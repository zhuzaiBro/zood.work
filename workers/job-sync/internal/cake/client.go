package cake

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"zood.work/workers/job-sync/internal/store"
)

const defaultUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"

type Client struct {
	httpClient *http.Client
}

func NewClient() *Client {
	return &Client{
		httpClient: &http.Client{Timeout: 35 * time.Second},
	}
}

func (c *Client) FetchList(ctx context.Context, baseURL string, config map[string]interface{}) ([]Job, error) {
	apiURL := store.ConfigString(config, "search_api_url", "https://api.cake.me/api/client/v1/jobs/search")
	page := store.ConfigInt(config, "page", 1)
	perPage := store.ConfigInt(config, "per_page", store.ConfigInt(config, "limit", 10))
	if perPage <= 0 || perPage > 50 {
		perPage = 10
	}

	payload := SearchRequest{
		Query: store.ConfigString(config, "query", ""),
		Filters: SearchFilters{
			Professions: configStringSlice(config, "professions", []string{
				"it_back-end-engineer",
				"it_software-engineer",
				"it_blockchain-platform-engineer",
			}),
			JobTypes: configStringSlice(config, "job_types", []string{
				"full_time",
			}),
			Remote: configStringSlice(config, "remote", []string{
				"full_remote_work",
			}),
		},
		SortBy:  store.ConfigString(config, "sort_by", "popularity"),
		Page:    page,
		PerPage: perPage,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, apiURL, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", trimSlash(baseURL))
	req.Header.Set("Referer", trimSlash(baseURL)+"/")
	req.Header.Set("User-Agent", defaultUserAgent)
	req.Header.Set("X-Search-Session-Id", store.ConfigString(config, "search_session_id", "zood-job-sync"))

	var response SearchResponse
	if err := c.doJSON(req, &response); err != nil {
		return nil, err
	}

	for i := range response.Data {
		response.Data[i].DetailURL = DetailURL(baseURL, response.Data[i])
	}
	return response.Data, nil
}

func (c *Client) FetchDetail(ctx context.Context, detailURL string) (*Detail, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, detailURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9")
	req.Header.Set("Referer", "https://www.cake.me/")
	req.Header.Set("User-Agent", defaultUserAgent)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("cake detail API %d: %s", resp.StatusCode, string(body[:min(len(body), 500)]))
	}
	return ParseDetailHTML(string(body))
}

func DetailURL(baseURL string, job Job) string {
	companyPath := strings.Trim(job.Page.Path, "/")
	if companyPath == "" {
		companyPath = "unknown"
	}
	return fmt.Sprintf("%s/companies/%s/jobs/%s", trimSlash(baseURL), url.PathEscape(companyPath), strings.TrimLeft(job.Path, "/"))
}

func (c *Client) doJSON(req *http.Request, target interface{}) error {
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("cake API %d: %s", resp.StatusCode, string(body))
	}
	if err := json.Unmarshal(body, target); err != nil {
		return err
	}
	return nil
}

func ParseDetailHTML(source string) (*Detail, error) {
	rawJSONLD := firstJobPostingJSONLD(source)
	if rawJSONLD == nil {
		text := strings.TrimSpace(stripHTML(source))
		if text == "" {
			return nil, fmt.Errorf("cake detail html has no extractable content")
		}
		return &Detail{DescriptionText: text}, nil
	}

	detail := &Detail{RawJSONLD: rawJSONLD}
	detail.Title = stringField(rawJSONLD, "title")
	detail.DescriptionHTML = html.UnescapeString(stringField(rawJSONLD, "description"))
	detail.DescriptionText = strings.TrimSpace(stripHTML(detail.DescriptionHTML))
	detail.EmploymentType = stringField(rawJSONLD, "employmentType")
	detail.DatePosted = stringField(rawJSONLD, "datePosted")
	detail.ValidThrough = stringField(rawJSONLD, "validThrough")

	if org, ok := rawJSONLD["hiringOrganization"].(map[string]interface{}); ok {
		detail.HiringOrganization = stringField(org, "name")
	}

	detail.RequirementsText = extractSection(detail.DescriptionText, []string{
		"Minimum qualifications:",
		"Preferred qualifications:",
		"Qualifications",
		"Requirements",
	})
	detail.Responsibilities = extractSection(detail.DescriptionText, []string{
		"Responsibilities",
		"About the job",
	})
	detail.BenefitsText = extractSection(detail.DescriptionText, []string{
		"benefits",
		"Benefits",
	})
	return detail, nil
}

func firstJobPostingJSONLD(source string) map[string]interface{} {
	pattern := regexp.MustCompile(`(?is)<script[^>]+type=["']application/ld\+json["'][^>]*>(.*?)</script>`)
	matches := pattern.FindAllStringSubmatch(source, -1)
	for _, match := range matches {
		raw := strings.TrimSpace(html.UnescapeString(match[1]))
		var payload interface{}
		if err := json.Unmarshal([]byte(raw), &payload); err != nil {
			continue
		}
		if item := findJobPosting(payload); item != nil {
			return item
		}
	}
	return nil
}

func findJobPosting(value interface{}) map[string]interface{} {
	switch v := value.(type) {
	case map[string]interface{}:
		if typeValue, ok := v["@type"]; ok && strings.EqualFold(fmt.Sprint(typeValue), "JobPosting") {
			return v
		}
		if graph, ok := v["@graph"].([]interface{}); ok {
			for _, item := range graph {
				if found := findJobPosting(item); found != nil {
					return found
				}
			}
		}
	case []interface{}:
		for _, item := range v {
			if found := findJobPosting(item); found != nil {
				return found
			}
		}
	}
	return nil
}

func stripHTML(source string) string {
	text := html.UnescapeString(source)
	text = regexp.MustCompile(`(?i)<br\s*/?>`).ReplaceAllString(text, "\n")
	text = regexp.MustCompile(`(?i)</(p|div|li|h[1-6])>`).ReplaceAllString(text, "\n")
	text = regexp.MustCompile(`(?is)<script[\s\S]*?</script>`).ReplaceAllString(text, " ")
	text = regexp.MustCompile(`(?is)<style[\s\S]*?</style>`).ReplaceAllString(text, " ")
	text = regexp.MustCompile(`(?s)<[^>]+>`).ReplaceAllString(text, " ")
	text = regexp.MustCompile(`[ \t]+`).ReplaceAllString(text, " ")
	text = regexp.MustCompile(`\n\s+`).ReplaceAllString(text, "\n")
	text = regexp.MustCompile(`\n{3,}`).ReplaceAllString(text, "\n\n")
	return strings.TrimSpace(text)
}

func extractSection(text string, markers []string) string {
	lower := strings.ToLower(text)
	for _, marker := range markers {
		index := strings.Index(lower, strings.ToLower(marker))
		if index < 0 {
			continue
		}
		section := strings.TrimSpace(text[index:])
		if len([]rune(section)) > 3000 {
			section = string([]rune(section)[:3000])
		}
		return section
	}
	return ""
}

func stringField(values map[string]interface{}, key string) string {
	value, ok := values[key]
	if !ok || value == nil {
		return ""
	}
	return strings.TrimSpace(fmt.Sprint(value))
}

func configStringSlice(config map[string]interface{}, key string, fallback []string) []string {
	value, ok := config[key]
	if !ok || value == nil {
		return fallback
	}
	switch v := value.(type) {
	case []string:
		return v
	case []interface{}:
		result := make([]string, 0, len(v))
		for _, item := range v {
			if text := strings.TrimSpace(fmt.Sprint(item)); text != "" {
				result = append(result, text)
			}
		}
		if len(result) > 0 {
			return result
		}
	}
	return fallback
}

func trimSlash(value string) string {
	return strings.TrimRight(value, "/")
}
