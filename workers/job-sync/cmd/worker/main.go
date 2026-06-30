package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"zood.work/workers/job-sync/internal/agent"
	"zood.work/workers/job-sync/internal/cake"
	"zood.work/workers/job-sync/internal/config"
	"zood.work/workers/job-sync/internal/dejob"
	"zood.work/workers/job-sync/internal/discord"
	"zood.work/workers/job-sync/internal/jobs"
	"zood.work/workers/job-sync/internal/mcp"
	"zood.work/workers/job-sync/internal/store"
	syncer "zood.work/workers/job-sync/internal/sync"
	"zood.work/workers/job-sync/internal/telegram"
	"zood.work/workers/job-sync/internal/web3career"
)

func main() {
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	storeClient, err := store.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("store error: %v", err)
	}
	defer func() {
		if err := storeClient.Close(); err != nil {
			log.Printf("close store: %v", err)
		}
	}()

	runner := &syncer.Runner{
		Store:       storeClient,
		CakeClient:  cake.NewClient(),
		DejobClient: dejob.NewClient(cfg.DejobUserToken),
		Web3Client:  web3career.NewClient(),
		SourceSlug:  cfg.SourceSlug,
		SourceSlugs: cfg.SourceSlugs,
	}

	if cfg.RunOnce {
		result, err := runner.Run(context.Background())
		writeResult(result, err)
		if err != nil {
			os.Exit(1)
		}
		return
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("POST /sync", func(w http.ResponseWriter, r *http.Request) {
		if cfg.CronSecret != "" && r.Header.Get("x-cron-secret") != cfg.CronSecret {
			http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
			return
		}

		result, err := runner.Run(r.Context())
		status := http.StatusOK
		if err != nil {
			status = http.StatusInternalServerError
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		_ = json.NewEncoder(w).Encode(result)
	})

	jobService := jobs.Service{
		Store:        storeClient,
		BaseURL:      cfg.SiteBaseURL,
		SearchPrefix: cfg.JobSearchPrefix,
	}

	serviceCtx, serviceCancel := context.WithCancel(context.Background())
	defer serviceCancel()

	if cfg.TelegramBotToken != "" {
		telegramHandler := telegram.Handler{
			BotToken:      cfg.TelegramBotToken,
			WebhookSecret: cfg.TelegramWebhookSecret,
			Jobs:          jobService,
		}
		mux.Handle("/telegram/webhook", telegramHandler)
		log.Printf("telegram job bot webhook enabled at /telegram/webhook")
		if cfg.TelegramPolling {
			go telegramHandler.RunPolling(serviceCtx, cfg.TelegramDeleteWebhook)
		} else {
			log.Printf("telegram polling disabled: TELEGRAM_POLLING_ENABLED=false")
		}
	} else {
		log.Printf("telegram job bot webhook disabled: TELEGRAM_BOT_TOKEN missing")
	}
	if cfg.DiscordPublicKey != "" {
		mux.Handle("/discord/interactions", discord.Handler{
			PublicKey:   cfg.DiscordPublicKey,
			CommandName: cfg.DiscordCommandName,
			Jobs:        jobService,
		})
		log.Printf("discord job bot interactions enabled at /discord/interactions")
	} else {
		log.Printf("discord job bot disabled: DISCORD_PUBLIC_KEY missing")
	}
	mux.Handle("/mcp", bearerAuth(cfg.MCPAuthToken, mcp.Handler{
		Jobs:   jobService,
		Runner: runner,
	}))
	mux.Handle("/agent/jobs", bearerAuth(cfg.AgentAuthToken, agent.Service{
		Jobs:   jobService,
		Runner: runner,
	}))
	log.Printf("mcp endpoint enabled at /mcp")
	log.Printf("agent endpoint enabled at /agent/jobs")

	server := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("job-sync worker listening on %s", cfg.HTTPAddr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	serviceCancel()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = server.Shutdown(ctx)
}

func writeResult(result syncer.Result, err error) {
	payload, marshalErr := json.MarshalIndent(result, "", "  ")
	if marshalErr != nil {
		log.Fatalf("marshal result: %v", marshalErr)
	}
	log.Println(string(payload))
	if err != nil {
		log.Printf("sync failed: %v", err)
	}
}

func bearerAuth(token string, next http.Handler) http.Handler {
	if token == "" {
		return next
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer "+token {
			http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}
