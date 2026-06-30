package mcp

import (
	"encoding/json"
	"fmt"
	"net/http"

	"zood.work/workers/job-sync/internal/jobs"
	syncer "zood.work/workers/job-sync/internal/sync"
)

type Handler struct {
	Jobs   jobs.Service
	Runner *syncer.Runner
}

type request struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id,omitempty"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

type response struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id,omitempty"`
	Result  interface{}     `json:"result,omitempty"`
	Error   *responseError  `json:"error,omitempty"`
}

type responseError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type toolCallParams struct {
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
}

func (h Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload request
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeResponse(w, response{
			JSONRPC: "2.0",
			Error:   &responseError{Code: -32700, Message: "parse error"},
		})
		return
	}

	result, err := h.handle(r, payload)
	res := response{JSONRPC: "2.0", ID: payload.ID, Result: result}
	if err != nil {
		res.Result = nil
		res.Error = &responseError{Code: -32603, Message: err.Error()}
	}
	writeResponse(w, res)
}

func (h Handler) handle(r *http.Request, payload request) (interface{}, error) {
	switch payload.Method {
	case "initialize":
		return map[string]interface{}{
			"protocolVersion": "2024-11-05",
			"capabilities": map[string]interface{}{
				"tools": map[string]interface{}{},
			},
			"serverInfo": map[string]interface{}{
				"name":    "zood-job-agent-mcp",
				"version": "0.1.0",
			},
		}, nil
	case "tools/list":
		return map[string]interface{}{
			"tools": []map[string]interface{}{
				searchJobsTool(),
				syncJobsTool(),
			},
		}, nil
	case "tools/call":
		var params toolCallParams
		if len(payload.Params) > 0 {
			if err := json.Unmarshal(payload.Params, &params); err != nil {
				return nil, fmt.Errorf("invalid tools/call params")
			}
		}
		return h.callTool(r, params)
	case "notifications/initialized":
		return map[string]interface{}{}, nil
	default:
		return nil, fmt.Errorf("unsupported method %q", payload.Method)
	}
}

func (h Handler) callTool(r *http.Request, params toolCallParams) (interface{}, error) {
	switch params.Name {
	case "search_jobs":
		query, _ := params.Arguments["query"].(string)
		limit := intArg(params.Arguments, "limit", 5)
		result, err := h.Jobs.Search(r.Context(), query, limit)
		if err != nil {
			return nil, err
		}
		return toolResult(result.Text, result), nil
	case "sync_jobs":
		if h.Runner == nil {
			return nil, fmt.Errorf("sync runner not configured")
		}
		result, err := h.Runner.Run(r.Context())
		if err != nil {
			return toolResult(fmt.Sprintf("同步失败：%s", err.Error()), result), nil
		}
		return toolResult(fmt.Sprintf("同步完成：新增 %d，跳过 %d，失败 %d。", result.JobsCreated, result.JobsSkipped, result.JobsFailed), result), nil
	default:
		return nil, fmt.Errorf("unknown tool %q", params.Name)
	}
}

func toolResult(text string, structured interface{}) map[string]interface{} {
	return map[string]interface{}{
		"content": []map[string]string{
			{"type": "text", "text": text},
		},
		"structuredContent": structured,
	}
}

func searchJobsTool() map[string]interface{} {
	return map[string]interface{}{
		"name":        "search_jobs",
		"description": "Search synced Web3/AI job listings by keyword.",
		"inputSchema": map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"query": map[string]interface{}{
					"type":        "string",
					"description": "Keyword query, for example frontend remote, Solidity, product manager.",
				},
				"limit": map[string]interface{}{
					"type":        "integer",
					"description": "Maximum result count, default 5.",
				},
			},
			"required": []string{"query"},
		},
	}
}

func syncJobsTool() map[string]interface{} {
	return map[string]interface{}{
		"name":        "sync_jobs",
		"description": "Run one DeJob sync and write new jobs into Postgres.",
		"inputSchema": map[string]interface{}{
			"type":       "object",
			"properties": map[string]interface{}{},
		},
	}
}

func intArg(args map[string]interface{}, key string, fallback int) int {
	value, ok := args[key]
	if !ok {
		return fallback
	}
	switch v := value.(type) {
	case float64:
		return int(v)
	case int:
		return v
	default:
		return fallback
	}
}

func writeResponse(w http.ResponseWriter, payload response) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(payload)
}
