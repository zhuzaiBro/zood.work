package wecom

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"zood.work/workers/job-sync/internal/store"
)

type KFClient struct {
	CorpID          string
	Secret          string
	Store           *store.Store
	JobSearchPrefix string
	httpClient      *http.Client
	tokenMu         sync.Mutex
	token           string
	tokenExpiresAt  time.Time
}

type kfEvent struct {
	ToUserName string `xml:"ToUserName"`
	CreateTime int64  `xml:"CreateTime"`
	MsgType    string `xml:"MsgType"`
	Event      string `xml:"Event"`
	Token      string `xml:"Token"`
	OpenKfID   string `xml:"OpenKfId"`
}

type accessTokenResponse struct {
	ErrCode     int    `json:"errcode"`
	ErrMsg      string `json:"errmsg"`
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
}

type syncMsgResponse struct {
	ErrCode    int            `json:"errcode"`
	ErrMsg     string         `json:"errmsg"`
	NextCursor string         `json:"next_cursor"`
	MsgList    []kfSyncRecord `json:"msg_list"`
}

type kfSyncRecord struct {
	MsgID      string `json:"msgid"`
	OpenKfID   string `json:"open_kfid"`
	ExternalID string `json:"external_userid"`
	SendTime   int64  `json:"send_time"`
	Origin     int    `json:"origin"`
	MsgType    string `json:"msgtype"`
	Text       struct {
		Content string `json:"content"`
	} `json:"text"`
}

func (c *KFClient) Enabled() bool {
	return c.CorpID != "" && c.Secret != "" && c.Store != nil
}

func (c *KFClient) HandleEvent(ctx context.Context, event kfEvent) {
	if !c.Enabled() {
		return
	}

	cursor := event.Token
	for i := 0; i < 5; i++ {
		resp, err := c.syncMsg(ctx, cursor, event.OpenKfID)
		if err != nil {
			log.Printf("wecom kf sync_msg failed: %v", err)
			return
		}

		for _, msg := range resp.MsgList {
			if msg.MsgType != "text" || strings.TrimSpace(msg.Text.Content) == "" {
				continue
			}
			if msg.OpenKfID == "" || msg.ExternalID == "" {
				continue
			}

			reply := c.buildJobReply(msg.Text.Content)
			if err := c.sendText(ctx, msg.OpenKfID, msg.ExternalID, reply); err != nil {
				log.Printf("wecom kf send_msg failed: msgid=%s err=%v", msg.MsgID, err)
			}
		}

		if resp.NextCursor == "" || resp.NextCursor == cursor || len(resp.MsgList) == 0 {
			return
		}
		cursor = resp.NextCursor
	}
}

func (c *KFClient) buildJobReply(content string) string {
	query := normalizeJobQuery(content, c.JobSearchPrefix)
	if query == "" {
		return "请输入要检索的岗位关键词，例如：\n岗位 Rust\n岗位 前端 远程\n岗位 产品经理"
	}

	rows, err := c.Store.SearchJobListings(query, 5)
	if err != nil {
		log.Printf("wecom kf job search failed: %v", err)
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

func (c *KFClient) syncMsg(ctx context.Context, cursor, openKfID string) (syncMsgResponse, error) {
	var result syncMsgResponse
	token, err := c.accessToken(ctx)
	if err != nil {
		return result, err
	}

	body := map[string]interface{}{
		"token":        cursor,
		"limit":        20,
		"voice_format": 0,
	}
	if openKfID != "" {
		body["open_kfid"] = openKfID
	}

	if err := c.postJSON(ctx, "https://qyapi.weixin.qq.com/cgi-bin/kf/sync_msg?access_token="+token, body, &result); err != nil {
		return result, err
	}
	if result.ErrCode != 0 {
		return result, fmt.Errorf("sync_msg errcode=%d errmsg=%s", result.ErrCode, result.ErrMsg)
	}
	return result, nil
}

func (c *KFClient) sendText(ctx context.Context, openKfID, externalUserID, content string) error {
	token, err := c.accessToken(ctx)
	if err != nil {
		return err
	}

	body := map[string]interface{}{
		"touser":    externalUserID,
		"open_kfid": openKfID,
		"msgtype":   "text",
		"text": map[string]string{
			"content": content,
		},
	}

	var result struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
	}
	if err := c.postJSON(ctx, "https://qyapi.weixin.qq.com/cgi-bin/kf/send_msg?access_token="+token, body, &result); err != nil {
		return err
	}
	if result.ErrCode != 0 {
		return fmt.Errorf("send_msg errcode=%d errmsg=%s", result.ErrCode, result.ErrMsg)
	}
	return nil
}

func (c *KFClient) accessToken(ctx context.Context) (string, error) {
	c.tokenMu.Lock()
	defer c.tokenMu.Unlock()

	if c.token != "" && time.Now().Before(c.tokenExpiresAt.Add(-2*time.Minute)) {
		return c.token, nil
	}

	endpoint := fmt.Sprintf(
		"https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=%s&corpsecret=%s",
		c.CorpID,
		c.Secret,
	)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return "", err
	}

	resp, err := c.client().Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	payload, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var result accessTokenResponse
	if err := json.Unmarshal(payload, &result); err != nil {
		return "", err
	}
	if result.ErrCode != 0 {
		return "", fmt.Errorf("gettoken errcode=%d errmsg=%s", result.ErrCode, result.ErrMsg)
	}

	c.token = result.AccessToken
	c.tokenExpiresAt = time.Now().Add(time.Duration(result.ExpiresIn) * time.Second)
	return c.token, nil
}

func (c *KFClient) postJSON(ctx context.Context, endpoint string, body interface{}, target interface{}) error {
	payload, err := json.Marshal(body)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client().Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("http %d: %s", resp.StatusCode, string(respBody))
	}
	return json.Unmarshal(respBody, target)
}

func (c *KFClient) client() *http.Client {
	if c.httpClient != nil {
		return c.httpClient
	}
	c.httpClient = &http.Client{Timeout: 20 * time.Second}
	return c.httpClient
}
