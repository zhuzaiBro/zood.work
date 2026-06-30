package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"zood.work/workers/job-sync/internal/jobs"
)

type Handler struct {
	BotToken      string
	WebhookSecret string
	Jobs          jobs.Service
	Client        *http.Client
}

type update struct {
	UpdateID      int      `json:"update_id"`
	Message       *message `json:"message"`
	EditedMessage *message `json:"edited_message"`
}

type message struct {
	MessageID int    `json:"message_id"`
	Text      string `json:"text"`
	Chat      chat   `json:"chat"`
}

type chat struct {
	ID int64 `json:"id"`
}

type getUpdatesResponse struct {
	OK          bool     `json:"ok"`
	Description string   `json:"description"`
	Result      []update `json:"result"`
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if h.WebhookSecret != "" && r.Header.Get("X-Telegram-Bot-Api-Secret-Token") != h.WebhookSecret {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	if h.BotToken == "" {
		http.Error(w, `{"error":"telegram bot token missing"}`, http.StatusServiceUnavailable)
		return
	}

	var payload update
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"error":"bad json"}`, http.StatusBadRequest)
		return
	}

	msg := payload.Message
	if msg == nil {
		msg = payload.EditedMessage
	}
	if msg == nil || strings.TrimSpace(msg.Text) == "" {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
		return
	}

	reply := h.buildReply(r.Context(), msg.Text)
	if err := h.sendMessage(r.Context(), msg.Chat.ID, reply); err != nil {
		log.Printf("telegram send message failed: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(`{"ok":true}`))
}

func (h Handler) RunPolling(ctx context.Context, deleteWebhook bool) {
	if h.BotToken == "" {
		log.Printf("telegram polling disabled: TELEGRAM_BOT_TOKEN missing")
		return
	}
	if deleteWebhook {
		if err := h.deleteWebhook(ctx); err != nil {
			log.Printf("telegram delete webhook before polling failed: %v", err)
		}
	}

	log.Printf("telegram polling started")
	offset := 0
	for {
		select {
		case <-ctx.Done():
			log.Printf("telegram polling stopped")
			return
		default:
		}

		updates, err := h.getUpdates(ctx, offset)
		if err != nil {
			log.Printf("telegram polling getUpdates failed: %v", err)
			wait(ctx, 3*time.Second)
			continue
		}
		for _, item := range updates {
			if item.UpdateID >= offset {
				offset = item.UpdateID + 1
			}
			h.handleUpdate(ctx, item)
		}
	}
}

func (h Handler) handleUpdate(ctx context.Context, payload update) {
	msg := payload.Message
	if msg == nil {
		msg = payload.EditedMessage
	}
	if msg == nil || strings.TrimSpace(msg.Text) == "" {
		return
	}

	reply := h.buildReply(ctx, msg.Text)
	if err := h.sendMessage(ctx, msg.Chat.ID, reply); err != nil {
		log.Printf("telegram polling send message failed: %v", err)
	}
}

func (h Handler) buildReply(ctx context.Context, text string) string {
	command := strings.TrimSpace(text)
	if strings.HasPrefix(command, "/start") || strings.HasPrefix(command, "/help") {
		return "把岗位关键词发给我即可检索，例如：\n/jobs 前端 远程\nSolidity\n产品经理"
	}

	reply, err := h.Jobs.SearchText(ctx, command, 5)
	if err != nil {
		log.Printf("telegram job search failed: %v", err)
		return "岗位检索暂时不可用，请稍后再试。"
	}
	return trimTelegramText(reply)
}

func (h Handler) sendMessage(ctx context.Context, chatID int64, text string) error {
	client := h.Client
	if client == nil {
		client = &http.Client{Timeout: 10 * time.Second}
	}

	body, err := json.Marshal(map[string]interface{}{
		"chat_id": chatID,
		"text":    text,
	})
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", h.BotToken),
		bytes.NewReader(body),
	)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("telegram api status %s", resp.Status)
	}
	return nil
}

func (h Handler) getUpdates(ctx context.Context, offset int) ([]update, error) {
	client := h.client()
	body, err := json.Marshal(map[string]interface{}{
		"offset":          offset,
		"timeout":         25,
		"allowed_updates": []string{"message", "edited_message"},
	})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		fmt.Sprintf("https://api.telegram.org/bot%s/getUpdates", h.BotToken),
		bytes.NewReader(body),
	)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var payload getUpdatesResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, err
	}
	if resp.StatusCode >= 300 || !payload.OK {
		if payload.Description != "" {
			return nil, fmt.Errorf("telegram getUpdates failed: %s", payload.Description)
		}
		return nil, fmt.Errorf("telegram getUpdates status %s", resp.Status)
	}
	return payload.Result, nil
}

func (h Handler) deleteWebhook(ctx context.Context) error {
	client := h.client()
	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		fmt.Sprintf("https://api.telegram.org/bot%s/deleteWebhook", h.BotToken),
		nil,
	)
	if err != nil {
		return err
	}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("telegram deleteWebhook status %s", resp.Status)
	}
	return nil
}

func (h Handler) client() *http.Client {
	if h.Client != nil {
		return h.Client
	}
	return &http.Client{Timeout: 35 * time.Second}
}

func wait(ctx context.Context, duration time.Duration) {
	timer := time.NewTimer(duration)
	defer timer.Stop()
	select {
	case <-ctx.Done():
	case <-timer.C:
	}
}

func trimTelegramText(text string) string {
	runes := []rune(text)
	if len(runes) <= 3900 {
		return text
	}
	return string(runes[:3900]) + "\n\n内容较长，已截断。"
}
