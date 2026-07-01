package dejob

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const userAgent = "Mozilla/5.0 (compatible; ZoodJobSync/1.0; +https://zood.work)"

type Client struct {
	httpClient *http.Client
	token      string
}

func NewClient(token string) *Client {
	return &Client{
		token: token,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) FetchList(baseURL, listPath string, page, limit int) ([]Job, error) {
	url := fmt.Sprintf("%s%s?page=%d&limit=%d", trimSlash(baseURL), listPath, page, limit)
	referer := trimSlash(baseURL) + "/job"

	var payload ListResponse
	if err := c.getJSON(url, referer, &payload); err != nil {
		return nil, err
	}
	if payload.ErrorCode != 0 || payload.Data == nil {
		return nil, fmt.Errorf("dejob list error: %s", fallbackMessage(payload.Message, "invalid list response"))
	}
	return payload.Data.Results, nil
}

func (c *Client) FetchDetail(baseURL, detailTemplate, externalID string) (*Job, error) {
	detailPath := strings.ReplaceAll(detailTemplate, "{id}", externalID)
	url := trimSlash(baseURL) + detailPath
	referer := fmt.Sprintf("%s/jobDetail?id=%s", trimSlash(baseURL), externalID)

	var payload DetailResponse
	if err := c.getJSON(url, referer, &payload); err != nil {
		return nil, err
	}
	if payload.ErrorCode != 0 || payload.Data == nil {
		return nil, fmt.Errorf("dejob detail error: %s", fallbackMessage(payload.Message, "invalid detail response"))
	}
	return payload.Data, nil
}

func (c *Client) FetchCompany(baseURL string, companyID int) (*Company, error) {
	if companyID <= 0 {
		return nil, fmt.Errorf("company id is required")
	}
	url := fmt.Sprintf("%s/api/company/%d", trimSlash(baseURL), companyID)
	referer := trimSlash(baseURL) + "/job"

	var payload CompanyResponse
	if err := c.getJSON(url, referer, &payload); err != nil {
		return nil, err
	}
	if payload.ErrorCode != 0 || payload.Data == nil {
		return nil, fmt.Errorf("dejob company error: %s", fallbackMessage(payload.Message, "invalid company response"))
	}
	return payload.Data, nil
}

func (c *Client) getJSON(url, referer string, target interface{}) error {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return err
	}

	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Accept-Language", "zh")
	req.Header.Set("Referer", referer)
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("X-User-Token", c.token)

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
		return fmt.Errorf("dejob API %d: %s", resp.StatusCode, string(body))
	}
	if err := json.Unmarshal(body, target); err != nil {
		return err
	}
	return nil
}

func trimSlash(value string) string {
	return strings.TrimRight(value, "/")
}

func fallbackMessage(message, fallback string) string {
	if message != "" {
		return message
	}
	return fallback
}
