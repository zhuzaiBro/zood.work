package wecom

import (
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

	"zood.work/workers/job-sync/internal/store"
)

type Handler struct {
	Config          Config
	Store           *store.Store
	JobSearchPrefix string
	KFClient        *KFClient
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Printf("wecom callback received: method=%s path=%s remote=%s", r.Method, r.URL.Path, r.RemoteAddr)
	switch r.Method {
	case http.MethodGet:
		h.verifyURL(w, r)
	case http.MethodPost:
		h.replyMessage(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h Handler) verifyURL(w http.ResponseWriter, r *http.Request) {
	signature, timestamp, nonce := callbackParams(r)
	echostr := r.URL.Query().Get("echostr")
	if signature == "" || timestamp == "" || nonce == "" || echostr == "" {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	if !VerifySignature(h.Config.Token, signature, timestamp, nonce, echostr) {
		http.Error(w, "invalid signature", http.StatusUnauthorized)
		return
	}

	plain, err := DecryptMessage(echostr, h.Config)
	if err != nil {
		log.Printf("wecom url verify decrypt failed: %v", err)
		http.Error(w, "decrypt failed", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	_, _ = w.Write(plain)
}

func (h Handler) replyMessage(w http.ResponseWriter, r *http.Request) {
	signature, timestamp, nonce := callbackParams(r)
	if signature == "" || timestamp == "" || nonce == "" {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 2<<20))
	if err != nil {
		http.Error(w, "read body failed", http.StatusBadRequest)
		return
	}
	encrypted, err := ParseEncryptedXML(body)
	if err != nil {
		http.Error(w, "bad xml", http.StatusBadRequest)
		return
	}
	if !VerifySignature(h.Config.Token, signature, timestamp, nonce, encrypted) {
		http.Error(w, "invalid signature", http.StatusUnauthorized)
		return
	}

	plainXML, err := DecryptMessage(encrypted, h.Config)
	if err != nil {
		log.Printf("wecom message decrypt failed: %v", err)
		http.Error(w, "decrypt failed", http.StatusBadRequest)
		return
	}

	message, err := ParsePlainMessage(plainXML)
	if err != nil {
		log.Printf("wecom message parse failed: %v", err)
		http.Error(w, "parse failed", http.StatusBadRequest)
		return
	}
	log.Printf("wecom message parsed: msg_type=%s chat_id=%s from=%s content=%q", message.MsgType, message.ChatID, message.FromUserName, message.TextContent())

	if message.MsgType == "event" && message.Event == "kf_msg_or_event" {
		var event kfEvent
		if err := xml.Unmarshal(plainXML, &event); err != nil {
			log.Printf("wecom kf event parse failed: %v", err)
			http.Error(w, "parse failed", http.StatusBadRequest)
			return
		}
		if h.KFClient != nil && h.KFClient.Enabled() {
			go h.KFClient.HandleEvent(r.Context(), event)
		} else {
			log.Printf("wecom kf event ignored: WECOM_KF_SECRET missing")
		}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		_, _ = w.Write([]byte("success"))
		return
	}

	content := h.buildReplyContent(r, message)
	replyXML, err := BuildTextReply(message, content)
	if err != nil {
		log.Printf("wecom reply build failed: %v", err)
		http.Error(w, "reply failed", http.StatusInternalServerError)
		return
	}
	reply, err := BuildEncryptedReply(replyXML, h.Config, nonce)
	if err != nil {
		log.Printf("wecom reply encrypt failed: %v", err)
		http.Error(w, "reply failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	_, _ = w.Write(reply)
}

func (h Handler) buildReplyContent(r *http.Request, message PlainMessage) string {
	if message.MsgType != "text" {
		return "请发送岗位关键词，例如：岗位 前端、岗位 Rust、岗位 远程。"
	}

	query := normalizeJobQuery(message.TextContent(), h.JobSearchPrefix)
	if query == "" {
		return "请输入要检索的岗位关键词，例如：\n岗位 Rust\n岗位 前端 远程\n岗位 产品经理"
	}

	rows, err := h.Store.SearchJobListings(query, 5)
	if err != nil {
		log.Printf("wecom job search failed: %v", err)
		return "岗位检索暂时不可用，请稍后再试。"
	}
	if len(rows) == 0 {
		return fmt.Sprintf("没有找到“%s”相关岗位。\n可以换个关键词试试，例如：前端、Solidity、远程、产品。", query)
	}

	baseURL := siteURL(r)
	lines := []string{fmt.Sprintf("找到 %d 个相关岗位：", len(rows))}
	for i, row := range rows {
		lines = append(lines, formatJob(row, i+1, baseURL))
	}
	lines = append(lines, "打开岗位详情后，可按账号权益查看投递方式或联系方式。继续发送关键词可以检索更多岗位。")
	return strings.Join(lines, "\n\n")
}

func callbackParams(r *http.Request) (signature, timestamp, nonce string) {
	query := r.URL.Query()
	return query.Get("msg_signature"), query.Get("timestamp"), query.Get("nonce")
}

func normalizeJobQuery(content, prefix string) string {
	query := strings.TrimSpace(content)
	if prefix != "" {
		query = strings.TrimSpace(strings.TrimPrefix(query, prefix))
	}

	prefixes := []string{"岗位", "职位", "工作", "招聘", "搜索", "查找", "找"}
	for _, item := range prefixes {
		if strings.HasPrefix(query, item) {
			query = strings.TrimSpace(strings.TrimPrefix(query, item))
			break
		}
	}
	query = strings.TrimLeft(query, ":：,， ")
	if len([]rune(query)) > 80 {
		query = string([]rune(query)[:80])
	}
	return strings.TrimSpace(query)
}

func formatJob(job store.JobListingSearchResult, index int, baseURL string) string {
	title := valueOr(job.Title, "未命名岗位")
	company := valueOr(job.CompanyName, "公司未填写")
	location := valueOr(firstString(job.Location, job.BaseLocation), "地点未填写")
	salary := formatSalary(job.MinSalary, job.MaxSalary)
	mode := strings.Join(nonEmpty(pointerValue(job.WorkTypeName), pointerValue(job.OfficeModeName)), " / ")
	url := strings.TrimRight(baseURL, "/") + "/jobs/" + job.ID

	lines := []string{
		fmt.Sprintf("%d. %s", index, title),
		fmt.Sprintf("%s · %s", company, location),
	}
	meta := strings.Join(nonEmpty(salary, mode), " · ")
	if meta != "" {
		lines = append(lines, meta)
	}
	lines = append(lines, url)
	return strings.Join(lines, "\n")
}

func formatSalary(min, max *float64) string {
	switch {
	case min != nil && max != nil:
		return fmt.Sprintf("%s-%s", trimFloat(*min), trimFloat(*max))
	case min != nil:
		return fmt.Sprintf("%s+", trimFloat(*min))
	case max != nil:
		return fmt.Sprintf("最高 %s", trimFloat(*max))
	default:
		return ""
	}
}

func trimFloat(value float64) string {
	return strconv.FormatFloat(value, 'f', -1, 64)
}

func siteURL(r *http.Request) string {
	proto := r.Header.Get("x-forwarded-proto")
	if proto == "" {
		if r.TLS != nil {
			proto = "https"
		} else {
			proto = "http"
		}
	}
	host := r.Header.Get("x-forwarded-host")
	if host == "" {
		host = r.Host
	}
	if host == "" {
		return "https://zood.work"
	}
	return proto + "://" + host
}

func firstString(values ...*string) *string {
	for _, value := range values {
		if value != nil && strings.TrimSpace(*value) != "" {
			return value
		}
	}
	return nil
}

func pointerValue(value *string) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(*value)
}

func valueOr(value *string, fallback string) string {
	normalized := pointerValue(value)
	if normalized == "" {
		return fallback
	}
	return normalized
}

func nonEmpty(values ...string) []string {
	result := make([]string, 0, len(values))
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			result = append(result, value)
		}
	}
	return result
}
