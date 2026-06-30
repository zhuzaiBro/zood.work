package wecom

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gorilla/websocket"

	"zood.work/workers/job-sync/internal/store"
)

const defaultStreamURL = "wss://openws.work.weixin.qq.com"

type StreamClient struct {
	BotID           string
	BotSecret       string
	Store           *store.Store
	JobSearchPrefix string
	URL             string
}

type streamEnvelope struct {
	Cmd     string          `json:"cmd"`
	Headers streamHeaders   `json:"headers"`
	Body    json.RawMessage `json:"body"`
	ErrCode int             `json:"errcode"`
	ErrMsg  string          `json:"errmsg"`
	Raw     json.RawMessage `json:"-"`
}

type streamHeaders struct {
	ReqID string `json:"req_id"`
}

type streamMessageBody struct {
	MsgID    string          `json:"msgid"`
	MsgType  string          `json:"msgtype"`
	AIBotID  string          `json:"aibotid"`
	ChatID   string          `json:"chatid"`
	ChatType string          `json:"chattype"`
	Content  string          `json:"content"`
	Text     json.RawMessage `json:"text"`
	Voice    json.RawMessage `json:"voice"`
	Mixed    json.RawMessage `json:"mixed"`
	Data     json.RawMessage `json:"data"`
	Payload  json.RawMessage `json:"payload"`
	Raw      json.RawMessage `json:"-"`
}

type textBody struct {
	Content string `json:"content"`
}

func (c StreamClient) Run(ctx context.Context) {
	if c.BotID == "" || c.BotSecret == "" {
		log.Printf("wecom stream bot disabled: missing BOT_ID/BOT_SECRET")
		return
	}
	if c.URL == "" {
		c.URL = defaultStreamURL
	}

	backoff := time.Second
	for {
		if ctx.Err() != nil {
			return
		}

		if err := c.runOnce(ctx); err != nil && ctx.Err() == nil {
			log.Printf("wecom stream disconnected: %v; reconnecting in %s", err, backoff)
			timer := time.NewTimer(backoff)
			select {
			case <-ctx.Done():
				timer.Stop()
				return
			case <-timer.C:
			}
			if backoff < 30*time.Second {
				backoff *= 2
			}
			continue
		}

		backoff = time.Second
	}
}

func (c StreamClient) runOnce(ctx context.Context) error {
	conn, _, err := websocket.DefaultDialer.DialContext(ctx, c.URL, http.Header{})
	if err != nil {
		return fmt.Errorf("dial %s: %w", c.URL, err)
	}
	defer conn.Close()

	if err := c.subscribe(conn); err != nil {
		return err
	}
	log.Printf("wecom stream subscribed: bot_id=%s", c.BotID)

	for {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		_, payload, err := conn.ReadMessage()
		if err != nil {
			return err
		}

		if err := c.handleMessage(ctx, conn, payload); err != nil {
			log.Printf("wecom stream message handle failed: %v", err)
		}
	}
}

func (c StreamClient) subscribe(conn *websocket.Conn) error {
	payload := map[string]interface{}{
		"cmd": "aibot_subscribe",
		"headers": map[string]string{
			"req_id": generateReqID("aibot_subscribe"),
		},
		"body": map[string]string{
			"bot_id": c.BotID,
			"secret": c.BotSecret,
		},
	}
	return conn.WriteJSON(payload)
}

func (c StreamClient) handleMessage(ctx context.Context, conn *websocket.Conn, payload []byte) error {
	var envelope streamEnvelope
	if err := json.Unmarshal(payload, &envelope); err != nil {
		return err
	}
	envelope.Raw = payload

	log.Printf("wecom stream received: type=%s event=%s msg_type=%s msg_id=%s chat_id=%s raw=%s",
		envelope.Cmd,
		"",
		"",
		"",
		"",
		string(payload),
	)

	if envelope.ErrCode != 0 {
		if strings.HasPrefix(envelope.Headers.ReqID, "aibot_subscribe") {
			return fmt.Errorf("subscribe failed: errcode=%d errmsg=%s", envelope.ErrCode, envelope.ErrMsg)
		}
		return nil
	}

	if envelope.Cmd != "aibot_msg_callback" {
		return nil
	}

	message, err := envelope.messageBody()
	if err != nil {
		return err
	}
	content := message.textContent()
	if strings.TrimSpace(content) == "" {
		return nil
	}

	reply := c.buildJobReply(ctx, content)
	return c.respond(conn, envelope, message, reply, true)
}

func (c StreamClient) buildJobReply(_ context.Context, content string) string {
	query := normalizeJobQuery(content, c.JobSearchPrefix)
	if query == "" {
		return "请输入要检索的岗位关键词，例如：\n岗位 Rust\n岗位 前端 远程\n岗位 产品经理"
	}

	rows, err := c.Store.SearchJobListings(query, 5)
	if err != nil {
		log.Printf("wecom stream job search failed: %v", err)
		return "岗位检索暂时不可用，请稍后再试。"
	}
	if len(rows) == 0 {
		return fmt.Sprintf("没有找到“%s”相关岗位。\n可以换个关键词试试，例如：前端、Solidity、远程、产品。", query)
	}

	lines := []string{fmt.Sprintf("找到 %d 个相关岗位：", len(rows))}
	for i, row := range rows {
		lines = append(lines, formatJob(row, i+1, "https://zood.work"))
	}
	lines = append(lines, "继续发送关键词可以检索更多岗位。")
	return strings.Join(lines, "\n\n")
}

func (c StreamClient) respond(conn *websocket.Conn, envelope streamEnvelope, message streamMessageBody, content string, finish bool) error {
	if message.MsgID == "" {
		return fmt.Errorf("missing msg id in payload: %s", string(envelope.Raw))
	}
	streamID := message.MsgID
	if streamID == "" {
		streamID = generateReqID("stream")
	}

	payload := map[string]interface{}{
		"cmd": "aibot_respond_msg",
		"headers": map[string]string{
			"req_id": envelope.Headers.ReqID,
		},
		"body": map[string]interface{}{
			"msgtype": "stream",
			"stream": map[string]interface{}{
				"id":      streamID,
				"finish":  finish,
				"content": content,
			},
		},
	}
	return conn.WriteJSON(payload)
}

func (e streamEnvelope) messageBody() (streamMessageBody, error) {
	var body streamMessageBody
	if len(e.Body) == 0 {
		return body, fmt.Errorf("missing body")
	}
	err := json.Unmarshal(e.Body, &body)
	body.Raw = e.Body
	return body, err
}

func (b streamMessageBody) textContent() string {
	if b.Content != "" {
		return b.Content
	}
	for _, raw := range []json.RawMessage{b.Text, b.Voice, b.Mixed, b.Data, b.Payload} {
		content := extractContent(raw)
		if content != "" {
			return content
		}
	}
	return ""
}

func extractContent(raw json.RawMessage) string {
	if len(raw) == 0 {
		return ""
	}

	var text textBody
	if err := json.Unmarshal(raw, &text); err == nil && text.Content != "" {
		return text.Content
	}

	var nested streamMessageBody
	if err := json.Unmarshal(raw, &nested); err == nil {
		return nested.textContent()
	}

	var textValue string
	if err := json.Unmarshal(raw, &textValue); err == nil {
		return textValue
	}
	return ""
}

func generateReqID(prefix string) string {
	return fmt.Sprintf("%s_%d", prefix, time.Now().UnixNano())
}

func streamURLFromEnv(value string) string {
	if value == "" {
		return defaultStreamURL
	}
	if _, err := url.Parse(value); err != nil {
		return defaultStreamURL
	}
	return value
}
