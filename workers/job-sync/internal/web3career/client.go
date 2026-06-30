package web3career

import (
	"context"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"zood.work/workers/job-sync/internal/store"
)

const defaultUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"

type Client struct {
	httpClient *http.Client
}

func NewClient() *Client {
	return &Client{httpClient: &http.Client{Timeout: 35 * time.Second}}
}

func (c *Client) FetchList(ctx context.Context, baseURL string, config map[string]interface{}) ([]Job, error) {
	pages := configIntSlice(config, "pages")
	if len(pages) == 0 {
		pages = []int{store.ConfigInt(config, "page", 1)}
	}

	limit := store.ConfigInt(config, "limit", 20)
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	listPath := store.ConfigString(config, "list_path", "/remote-jobs")
	jobs := make([]Job, 0, limit)
	seen := map[string]struct{}{}

	for _, page := range pages {
		if len(jobs) >= limit {
			break
		}

		pageJobs, err := c.fetchPage(ctx, baseURL, listPath, page)
		if err != nil {
			return nil, err
		}

		for _, job := range pageJobs {
			if job.ExternalID == "" {
				job.ExternalID = externalIDFromPath(job.Path)
			}
			if job.ExternalID == "" {
				job.ExternalID = fallbackExternalID(job)
			}
			if _, ok := seen[job.ExternalID]; ok {
				continue
			}
			seen[job.ExternalID] = struct{}{}
			jobs = append(jobs, job)
			if len(jobs) >= limit {
				break
			}
		}
	}

	return jobs, nil
}

func (c *Client) FetchDetail(ctx context.Context, detailURL string) (*JobPosting, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, detailURL, nil)
	if err != nil {
		return nil, err
	}
	setHTMLHeaders(req, "https://web3.career/remote-jobs")

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
		return nil, fmt.Errorf("web3career detail API %d: %s", resp.StatusCode, string(body[:min(len(body), 500)]))
	}

	postings := parseJobPostings(string(body))
	if len(postings) == 0 {
		text := strings.TrimSpace(stripHTML(string(body)))
		if text == "" {
			return nil, fmt.Errorf("web3career detail html has no extractable content")
		}
		return &JobPosting{Description: text}, nil
	}
	return &postings[0], nil
}

func (c *Client) fetchPage(ctx context.Context, baseURL, listPath string, page int) ([]Job, error) {
	pageURL, err := buildListURL(baseURL, listPath, page)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, pageURL, nil)
	if err != nil {
		return nil, err
	}
	setHTMLHeaders(req, trimSlash(baseURL)+listPath)

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
		return nil, fmt.Errorf("web3career list API %d: %s", resp.StatusCode, string(body[:min(len(body), 500)]))
	}

	postings := parseJobPostings(string(body))
	links := extractJobLinks(string(body), baseURL)
	jobs := make([]Job, 0, len(postings))
	for index, posting := range postings {
		path := ""
		detailURL := strings.TrimSpace(posting.URL)
		if index < len(links) {
			detailURL = links[index]
			path = pathFromURL(detailURL)
		} else if detailURL != "" {
			path = pathFromURL(detailURL)
		}
		if detailURL == "" && path != "" {
			detailURL = trimSlash(baseURL) + path
		}

		jobs = append(jobs, Job{
			ExternalID: externalIDFromPath(path),
			Path:       path,
			DetailURL:  detailURL,
			Posting:    posting,
		})
	}

	if len(jobs) == 0 {
		return nil, fmt.Errorf("web3career list html has no JobPosting data")
	}
	return jobs, nil
}

func parseJobPostings(source string) []JobPosting {
	pattern := regexp.MustCompile(`(?is)<script[^>]+type=["']application/ld\+json["'][^>]*>(.*?)</script>`)
	matches := pattern.FindAllStringSubmatch(source, -1)
	postings := []JobPosting{}

	for _, match := range matches {
		raw := strings.TrimSpace(html.UnescapeString(match[1]))
		var payload interface{}
		if err := json.Unmarshal([]byte(raw), &payload); err != nil {
			continue
		}
		postings = append(postings, findJobPostings(payload)...)
	}
	return postings
}

func findJobPostings(value interface{}) []JobPosting {
	switch v := value.(type) {
	case map[string]interface{}:
		if isJobPostingType(v["@type"]) {
			body, err := json.Marshal(v)
			if err != nil {
				return nil
			}
			var posting JobPosting
			if err := json.Unmarshal(body, &posting); err != nil {
				return nil
			}
			posting.Raw = v
			return []JobPosting{posting}
		}
		if graph, ok := v["@graph"].([]interface{}); ok {
			return findJobPostings(graph)
		}
	case []interface{}:
		postings := []JobPosting{}
		for _, item := range v {
			postings = append(postings, findJobPostings(item)...)
		}
		return postings
	}
	return nil
}

func isJobPostingType(value interface{}) bool {
	switch v := value.(type) {
	case string:
		return strings.EqualFold(v, "JobPosting")
	case []interface{}:
		for _, item := range v {
			if isJobPostingType(item) {
				return true
			}
		}
	}
	return false
}

func extractJobLinks(source, baseURL string) []string {
	pattern := regexp.MustCompile(`href=["'](/[^"']+/[0-9]+)["']`)
	matches := pattern.FindAllStringSubmatch(source, -1)
	links := make([]string, 0, len(matches))
	seen := map[string]struct{}{}

	for _, match := range matches {
		path := html.UnescapeString(match[1])
		if strings.Contains(path, "/users/") || strings.Contains(path, "/companies/") {
			continue
		}
		if _, ok := seen[path]; ok {
			continue
		}
		seen[path] = struct{}{}
		links = append(links, trimSlash(baseURL)+path)
	}
	return links
}

func buildListURL(baseURL, listPath string, page int) (string, error) {
	parsed, err := url.Parse(trimSlash(baseURL) + listPath)
	if err != nil {
		return "", err
	}
	query := parsed.Query()
	if page > 1 {
		query.Set("page", strconv.Itoa(page))
	}
	parsed.RawQuery = query.Encode()
	return parsed.String(), nil
}

func setHTMLHeaders(req *http.Request, referer string) {
	req.Header.Set("Accept", "text/html, application/xhtml+xml")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9")
	req.Header.Set("Cache-Control", "no-cache")
	req.Header.Set("Pragma", "no-cache")
	req.Header.Set("Referer", referer)
	req.Header.Set("User-Agent", defaultUserAgent)
}

func configIntSlice(config map[string]interface{}, key string) []int {
	value, ok := config[key]
	if !ok || value == nil {
		return nil
	}

	switch v := value.(type) {
	case []int:
		return v
	case []interface{}:
		result := make([]int, 0, len(v))
		for _, item := range v {
			if parsed, ok := intValue(item); ok && parsed > 0 {
				result = append(result, parsed)
			}
		}
		return result
	case string:
		parts := strings.Split(v, ",")
		result := make([]int, 0, len(parts))
		for _, part := range parts {
			parsed, err := strconv.Atoi(strings.TrimSpace(part))
			if err == nil && parsed > 0 {
				result = append(result, parsed)
			}
		}
		return result
	}
	return nil
}

func intValue(value interface{}) (int, bool) {
	switch v := value.(type) {
	case int:
		return v, true
	case int64:
		return int(v), true
	case float64:
		return int(v), true
	case json.Number:
		parsed, err := v.Int64()
		return int(parsed), err == nil
	default:
		parsed, err := strconv.Atoi(strings.TrimSpace(fmt.Sprint(value)))
		return parsed, err == nil
	}
}

func pathFromURL(value string) string {
	parsed, err := url.Parse(value)
	if err != nil {
		return ""
	}
	return parsed.Path
}

func externalIDFromPath(path string) string {
	path = strings.Trim(path, "/")
	if path == "" {
		return ""
	}
	parts := strings.Split(path, "/")
	return parts[len(parts)-1]
}

func fallbackExternalID(job Job) string {
	key := strings.TrimSpace(job.Posting.Title + "-" + job.Posting.HiringOrganization.Name + "-" + job.Posting.DatePosted)
	key = strings.ToLower(regexp.MustCompile(`[^a-zA-Z0-9]+`).ReplaceAllString(key, "-"))
	return strings.Trim(key, "-")
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

func trimSlash(value string) string {
	return strings.TrimRight(value, "/")
}
