package agent

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"zood.work/workers/job-sync/internal/jobs"
	syncer "zood.work/workers/job-sync/internal/sync"
)

type Service struct {
	Jobs   jobs.Service
	Runner *syncer.Runner
}

type Request struct {
	Message string `json:"message"`
	Limit   int    `json:"limit,omitempty"`
}

type Response struct {
	Intent string      `json:"intent"`
	Reply  string      `json:"reply"`
	Data   interface{} `json:"data,omitempty"`
}

func (s Service) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload Request
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"error":"bad json"}`, http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(payload.Message) == "" {
		http.Error(w, `{"error":"message is required"}`, http.StatusBadRequest)
		return
	}

	response, err := s.Handle(r, payload)
	if err != nil {
		log.Printf("agent request failed: %v", err)
		http.Error(w, `{"error":"agent unavailable"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(response)
}

func (s Service) Handle(r *http.Request, payload Request) (Response, error) {
	message := strings.TrimSpace(payload.Message)
	limit := payload.Limit
	if limit <= 0 {
		limit = 5
	}

	if isSyncIntent(message) {
		if s.Runner == nil {
			return Response{}, fmt.Errorf("sync runner not configured")
		}
		result, err := s.Runner.Run(r.Context())
		reply := fmt.Sprintf("同步完成：拉取 %d，新增 %d，跳过 %d，失败 %d。", result.JobsFetched, result.JobsCreated, result.JobsSkipped, result.JobsFailed)
		if err != nil {
			reply = "同步失败：" + err.Error()
		}
		return Response{Intent: "sync_jobs", Reply: reply, Data: result}, nil
	}

	result, err := s.Jobs.Search(r.Context(), message, limit)
	if err != nil {
		return Response{}, err
	}
	return Response{Intent: "search_jobs", Reply: result.Text, Data: result}, nil
}

func isSyncIntent(message string) bool {
	lower := strings.ToLower(message)
	for _, keyword := range []string{"同步", "刷新岗位", "更新岗位", "sync jobs", "sync"} {
		if strings.Contains(lower, keyword) {
			return true
		}
	}
	return false
}
