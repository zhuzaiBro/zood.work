package jobs

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"zood.work/workers/job-sync/internal/store"
)

type Service struct {
	Store        *store.Store
	BaseURL      string
	SearchPrefix string
}

type SearchResponse struct {
	Query   string         `json:"query"`
	Count   int            `json:"count"`
	Results []SearchResult `json:"results"`
	Text    string         `json:"text"`
}

type SearchResult struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	Company    string `json:"company"`
	Location   string `json:"location"`
	Salary     string `json:"salary,omitempty"`
	WorkMode   string `json:"work_mode,omitempty"`
	DetailURL  string `json:"detail_url"`
	SyncedAt   string `json:"synced_at,omitempty"`
	SourceTime string `json:"source_time,omitempty"`
}

func (s Service) Search(ctx context.Context, content string, limit int) (SearchResponse, error) {
	query := NormalizeQuery(content, s.SearchPrefix)
	if query == "" {
		return SearchResponse{
			Query: query,
			Text:  "请输入岗位关键词，例如：前端、Solidity、远程、产品经理。",
		}, nil
	}

	select {
	case <-ctx.Done():
		return SearchResponse{}, ctx.Err()
	default:
	}

	rows, err := s.Store.SearchJobListings(query, limit)
	if err != nil {
		return SearchResponse{}, err
	}

	response := SearchResponse{
		Query:   query,
		Count:   len(rows),
		Results: make([]SearchResult, 0, len(rows)),
	}
	for _, row := range rows {
		response.Results = append(response.Results, ToSearchResult(row, s.baseURL()))
	}
	response.Text = FormatSearchResponse(response)
	return response, nil
}

func (s Service) SearchText(ctx context.Context, content string, limit int) (string, error) {
	response, err := s.Search(ctx, content, limit)
	if err != nil {
		return "", err
	}
	return response.Text, nil
}

func NormalizeQuery(content, prefix string) string {
	query := strings.TrimSpace(content)
	if prefix != "" {
		query = strings.TrimSpace(strings.TrimPrefix(query, prefix))
	}

	lowerQuery := strings.ToLower(query)
	if strings.HasPrefix(lowerQuery, "/jobs") {
		if index := strings.IndexAny(query, " \t\r\n"); index >= 0 {
			query = strings.TrimSpace(query[index:])
		} else {
			query = ""
		}
	} else {
		for _, item := range []string{"岗位", "职位", "工作", "招聘", "搜索", "查找", "找"} {
			if strings.HasPrefix(lowerQuery, item) {
				query = strings.TrimSpace(query[len(item):])
				break
			}
		}
	}

	for _, item := range []string{"岗位", "职位", "工作", "招聘", "搜索", "查找", "找"} {
		if strings.HasPrefix(strings.ToLower(query), item) {
			query = strings.TrimSpace(query[len(item):])
			break
		}
	}

	query = strings.TrimLeft(query, ":：,， ")
	if len([]rune(query)) > 80 {
		query = string([]rune(query)[:80])
	}
	return strings.TrimSpace(query)
}

func ToSearchResult(job store.JobListingSearchResult, baseURL string) SearchResult {
	mode := strings.Join(nonEmpty(pointerValue(job.WorkTypeName), pointerValue(job.OfficeModeName)), " / ")
	detailURL := strings.TrimRight(baseURL, "/") + "/jobs/" + job.ID

	result := SearchResult{
		ID:        job.ID,
		Title:     valueOr(job.Title, "未命名岗位"),
		Company:   valueOr(job.CompanyName, "公司未填写"),
		Location:  valueOr(firstString(job.Location, job.BaseLocation), "地点未填写"),
		Salary:    formatSalary(job.MinSalary, job.MaxSalary),
		WorkMode:  mode,
		DetailURL: detailURL,
		SyncedAt:  job.LastSyncedAt.Format("2006-01-02 15:04"),
	}
	if job.CreatedAt != nil {
		result.SourceTime = job.CreatedAt.Format("2006-01-02")
	}
	return result
}

func FormatSearchResponse(response SearchResponse) string {
	if response.Query == "" {
		return response.Text
	}
	if response.Count == 0 {
		return fmt.Sprintf("没有找到“%s”相关岗位。\n可以换个关键词试试，例如：前端、Solidity、远程、产品。", response.Query)
	}

	lines := []string{fmt.Sprintf("找到 %d 个“%s”相关岗位：", response.Count, response.Query)}
	for i, job := range response.Results {
		lines = append(lines, formatJob(job, i+1))
	}
	lines = append(lines, "打开岗位详情后，可按账号权益查看投递方式或联系方式。继续发送关键词可以检索更多岗位。")
	return strings.Join(lines, "\n\n")
}

func (s Service) baseURL() string {
	if s.BaseURL != "" {
		return s.BaseURL
	}
	return "https://zood.work"
}

func formatJob(job SearchResult, index int) string {
	lines := []string{
		fmt.Sprintf("%d. %s", index, job.Title),
		fmt.Sprintf("%s · %s", job.Company, job.Location),
	}
	meta := strings.Join(nonEmpty(job.Salary, job.WorkMode), " · ")
	if meta != "" {
		lines = append(lines, meta)
	}
	lines = append(lines, job.DetailURL)
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

func valueOr(value *string, fallback string) string {
	if value == nil || strings.TrimSpace(*value) == "" {
		return fallback
	}
	return strings.TrimSpace(*value)
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

func nonEmpty(values ...string) []string {
	result := make([]string, 0, len(values))
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			result = append(result, strings.TrimSpace(value))
		}
	}
	return result
}
