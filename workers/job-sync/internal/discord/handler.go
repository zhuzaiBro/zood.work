package discord

import (
	"crypto/ed25519"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"zood.work/workers/job-sync/internal/jobs"
)

const (
	interactionPing               = 1
	interactionApplicationCommand = 2

	responsePong                  = 1
	responseChannelMessage        = 4
	discordFlagEphemeral   uint64 = 1 << 6
)

type Handler struct {
	PublicKey   string
	CommandName string
	Jobs        jobs.Service
}

type interaction struct {
	Type int             `json:"type"`
	Data interactionData `json:"data"`
}

type interactionData struct {
	Name    string              `json:"name"`
	Options []interactionOption `json:"options"`
}

type interactionOption struct {
	Name  string          `json:"name"`
	Value json.RawMessage `json:"value"`
}

type interactionResponse struct {
	Type int                      `json:"type"`
	Data *interactionResponseData `json:"data,omitempty"`
}

type interactionResponseData struct {
	Content string `json:"content"`
	Flags   uint64 `json:"flags,omitempty"`
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 2<<20))
	if err != nil {
		http.Error(w, "read body failed", http.StatusBadRequest)
		return
	}
	if !h.verifySignature(r, body) {
		http.Error(w, "invalid request signature", http.StatusUnauthorized)
		return
	}

	var payload interaction
	if err := json.Unmarshal(body, &payload); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	switch payload.Type {
	case interactionPing:
		_ = json.NewEncoder(w).Encode(interactionResponse{Type: responsePong})
	case interactionApplicationCommand:
		_ = json.NewEncoder(w).Encode(h.reply(r, payload))
	default:
		_ = json.NewEncoder(w).Encode(messageResponse("暂时只支持 /jobs 岗位检索。"))
	}
}

func (h Handler) verifySignature(r *http.Request, body []byte) bool {
	publicKey, err := hex.DecodeString(strings.TrimSpace(h.PublicKey))
	if err != nil || len(publicKey) != ed25519.PublicKeySize {
		log.Printf("discord public key invalid: %v", err)
		return false
	}
	signature, err := hex.DecodeString(r.Header.Get("X-Signature-Ed25519"))
	if err != nil || len(signature) != ed25519.SignatureSize {
		return false
	}
	timestamp := r.Header.Get("X-Signature-Timestamp")
	if timestamp == "" {
		return false
	}
	message := append([]byte(timestamp), body...)
	return ed25519.Verify(ed25519.PublicKey(publicKey), message, signature)
}

func (h Handler) reply(r *http.Request, payload interaction) interactionResponse {
	commandName := h.CommandName
	if commandName == "" {
		commandName = "jobs"
	}
	if payload.Data.Name != commandName {
		return messageResponse(fmt.Sprintf("未知命令：/%s。当前支持 /%s。", payload.Data.Name, commandName))
	}

	query := optionString(payload.Data.Options, "query")
	reply, err := h.Jobs.SearchText(r.Context(), query, 5)
	if err != nil {
		log.Printf("discord job search failed: %v", err)
		return messageResponse("岗位检索暂时不可用，请稍后再试。")
	}
	return messageResponse(trimDiscordText(reply))
}

func optionString(options []interactionOption, name string) string {
	for _, option := range options {
		if option.Name != name {
			continue
		}
		var value string
		if err := json.Unmarshal(option.Value, &value); err == nil {
			return value
		}
	}
	return ""
}

func messageResponse(content string) interactionResponse {
	return interactionResponse{
		Type: responseChannelMessage,
		Data: &interactionResponseData{
			Content: content,
			Flags:   discordFlagEphemeral,
		},
	}
}

func trimDiscordText(text string) string {
	runes := []rune(text)
	if len(runes) <= 1900 {
		return text
	}
	return string(runes[:1900]) + "\n\n内容较长，已截断。"
}
