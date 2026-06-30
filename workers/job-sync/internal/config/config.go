package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	DatabaseURL           string
	DejobUserToken        string
	CronSecret            string
	HTTPAddr              string
	SourceSlug            string
	SourceSlugs           []string
	SiteBaseURL           string
	JobSearchPrefix       string
	TelegramBotToken      string
	TelegramWebhookSecret string
	TelegramPolling       bool
	TelegramDeleteWebhook bool
	DiscordPublicKey      string
	DiscordCommandName    string
	MCPAuthToken          string
	AgentAuthToken        string
	RunOnce               bool
}

func Load() (Config, error) {
	cfg := Config{
		DatabaseURL:           firstNonEmpty(os.Getenv("DATABASE_URL"), os.Getenv("POSTGRES_URL")),
		DejobUserToken:        os.Getenv("DEJOB_USER_TOKEN"),
		CronSecret:            os.Getenv("CRON_SECRET"),
		HTTPAddr:              envOr("HTTP_ADDR", ":8080"),
		SourceSlug:            envOr("JOB_SOURCE_SLUG", "all"),
		SiteBaseURL:           envOr("SITE_BASE_URL", "https://zood.work"),
		JobSearchPrefix:       envOr("JOB_SEARCH_PREFIX", ""),
		TelegramBotToken:      os.Getenv("TELEGRAM_BOT_TOKEN"),
		TelegramWebhookSecret: os.Getenv("TELEGRAM_WEBHOOK_SECRET"),
		TelegramPolling:       envBool("TELEGRAM_POLLING_ENABLED", false),
		TelegramDeleteWebhook: envBool("TELEGRAM_DELETE_WEBHOOK_ON_POLLING", true),
		DiscordPublicKey:      os.Getenv("DISCORD_PUBLIC_KEY"),
		DiscordCommandName:    envOr("DISCORD_COMMAND_NAME", "jobs"),
		MCPAuthToken:          os.Getenv("MCP_AUTH_TOKEN"),
		AgentAuthToken:        os.Getenv("AGENT_AUTH_TOKEN"),
		RunOnce:               envBool("RUN_ONCE", true),
	}
	cfg.SourceSlugs = envCSV("JOB_SOURCE_SLUGS", cfg.SourceSlug)

	if cfg.DatabaseURL == "" {
		return cfg, fmt.Errorf("DATABASE_URL is required")
	}
	if onlyDejob(cfg.SourceSlugs) && cfg.DejobUserToken == "" {
		return cfg, fmt.Errorf("DEJOB_USER_TOKEN is required")
	}

	return cfg, nil
}

func envCSV(key, fallback string) []string {
	value := os.Getenv(key)
	if value == "" {
		value = fallback
	}
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			result = append(result, part)
		}
	}
	if len(result) == 0 {
		return []string{"all"}
	}
	return result
}

func onlyDejob(values []string) bool {
	return len(values) == 1 && strings.EqualFold(values[0], "dejob")
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envBool(key string, fallback bool) bool {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(v)
	if err != nil {
		return fallback
	}
	return parsed
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}
