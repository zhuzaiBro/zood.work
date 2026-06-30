package sync

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strconv"
	"strings"

	"zood.work/workers/job-sync/internal/cake"
	"zood.work/workers/job-sync/internal/dejob"
	"zood.work/workers/job-sync/internal/store"
	"zood.work/workers/job-sync/internal/web3career"
)

type Result struct {
	RunID       string         `json:"run_id,omitempty"`
	SourceSlug  string         `json:"source_slug,omitempty"`
	OK          bool           `json:"ok"`
	JobsFetched int            `json:"jobs_fetched"`
	JobsCreated int            `json:"jobs_created"`
	JobsSkipped int            `json:"jobs_skipped"`
	JobsFailed  int            `json:"jobs_failed"`
	Error       string         `json:"error,omitempty"`
	Sources     []SourceResult `json:"sources,omitempty"`
}

type SourceResult struct {
	RunID       string `json:"run_id"`
	SourceSlug  string `json:"source_slug"`
	SourceName  string `json:"source_name,omitempty"`
	OK          bool   `json:"ok"`
	JobsFetched int    `json:"jobs_fetched"`
	JobsCreated int    `json:"jobs_created"`
	JobsSkipped int    `json:"jobs_skipped"`
	JobsFailed  int    `json:"jobs_failed"`
	Error       string `json:"error,omitempty"`
}

type Runner struct {
	Store       *store.Store
	CakeClient  *cake.Client
	DejobClient *dejob.Client
	Web3Client  *web3career.Client
	SourceSlug  string
	SourceSlugs []string
}

func (r *Runner) Run(ctx context.Context) (Result, error) {
	slugs := r.SourceSlugs
	if len(slugs) == 0 && r.SourceSlug != "" {
		slugs = []string{r.SourceSlug}
	}
	if len(slugs) == 0 {
		slugs = []string{"all"}
	}

	sources, err := r.Store.GetActiveSources(slugs)
	if err != nil {
		return Result{}, err
	}

	if len(sources) == 1 {
		return r.runSource(ctx, sources[0])
	}

	result := Result{OK: true, Sources: make([]SourceResult, 0, len(sources))}
	var syncErrors []string
	for _, source := range sources {
		sourceResult, err := r.runSource(ctx, source)
		result.JobsFetched += sourceResult.JobsFetched
		result.JobsCreated += sourceResult.JobsCreated
		result.JobsSkipped += sourceResult.JobsSkipped
		result.JobsFailed += sourceResult.JobsFailed
		result.Sources = append(result.Sources, SourceResult{
			RunID:       sourceResult.RunID,
			SourceSlug:  sourceResult.SourceSlug,
			SourceName:  source.Name,
			OK:          sourceResult.OK,
			JobsFetched: sourceResult.JobsFetched,
			JobsCreated: sourceResult.JobsCreated,
			JobsSkipped: sourceResult.JobsSkipped,
			JobsFailed:  sourceResult.JobsFailed,
			Error:       sourceResult.Error,
		})
		if err != nil {
			result.OK = false
			syncErrors = append(syncErrors, fmt.Sprintf("%s: %s", source.Slug, err.Error()))
		}
	}
	if len(syncErrors) > 0 {
		result.Error = strings.Join(syncErrors, "; ")
		return result, errors.New(result.Error)
	}
	return result, nil
}

func (r *Runner) runSource(ctx context.Context, source store.JobSource) (result Result, err error) {
	runID, err := r.Store.CreateSyncRun(source.ID)
	if err != nil {
		return Result{}, err
	}

	result = Result{RunID: runID, SourceSlug: source.Slug}
	syncConfig := source.SyncConfig
	if syncConfig == nil {
		syncConfig = map[string]interface{}{}
	}

	provider := store.ConfigString(syncConfig, "provider", r.SourceSlug)
	baseURL := source.BaseURL
	if baseURL == "" {
		if provider == "cake" {
			baseURL = "https://www.cake.me"
		} else if provider == "web3career" {
			baseURL = "https://web3.career"
		} else {
			baseURL = "https://dejob.ai"
		}
	}

	var runErr error
	defer func() {
		status := "success"
		var errMsg *string
		if runErr != nil {
			status = "failed"
			msg := runErr.Error()
			errMsg = &msg
			result.OK = false
			result.Error = msg
		} else {
			result.OK = true
		}

		updateErr := r.Store.FinishSyncRun(runID, store.SyncRunUpdate{
			Status:       status,
			JobsFetched:  result.JobsFetched,
			JobsCreated:  result.JobsCreated,
			JobsSkipped:  result.JobsSkipped,
			JobsFailed:   result.JobsFailed,
			ErrorMessage: errMsg,
		})
		if updateErr != nil {
			log.Printf("failed to finish sync run %s: %v", runID, updateErr)
		}
	}()

	select {
	case <-ctx.Done():
		runErr = ctx.Err()
		return result, runErr
	default:
	}

	if provider == "cake" {
		runErr = r.syncCake(ctx, source, baseURL, syncConfig, &result)
		return result, runErr
	}
	if provider == "web3career" {
		runErr = r.syncWeb3Career(ctx, source, baseURL, syncConfig, &result)
		return result, runErr
	}

	page := store.ConfigInt(syncConfig, "page", 1)
	limit := store.ConfigInt(syncConfig, "limit", 20)
	listPath := store.ConfigString(syncConfig, "list_path", "/api/worker/topics")
	detailTemplate := store.ConfigString(syncConfig, "detail_path_template", "/api/worker/{id}")

	list, err := r.DejobClient.FetchList(baseURL, listPath, page, limit)
	if err != nil {
		runErr = err
		return result, runErr
	}

	result.JobsFetched = len(list)
	externalIDs := make([]string, 0, len(list))
	for _, item := range list {
		externalIDs = append(externalIDs, strconv.Itoa(item.TopicID))
	}

	existing, err := r.Store.ExistingExternalIDs(source.ID, externalIDs)
	if err != nil {
		runErr = err
		return result, runErr
	}

	for _, item := range list {
		select {
		case <-ctx.Done():
			runErr = ctx.Err()
			return result, runErr
		default:
		}

		externalID := strconv.Itoa(item.TopicID)
		if _, ok := existing[externalID]; ok {
			result.JobsSkipped++
			continue
		}

		detail, err := r.DejobClient.FetchDetail(baseURL, detailTemplate, externalID)
		if err != nil {
			result.JobsFailed++
			log.Printf("failed to sync job %s: %v", externalID, err)
			continue
		}

		row := dejob.MapToListingRow(source, *detail)
		if err := r.Store.InsertJobListing(row); err != nil {
			result.JobsFailed++
			log.Printf("failed to insert job %s: %v", externalID, err)
			continue
		}

		result.JobsCreated++
		existing[externalID] = struct{}{}
	}

	if result.JobsFailed > 0 && result.JobsCreated == 0 && result.JobsSkipped == 0 {
		runErr = fmt.Errorf("%d jobs failed during sync", result.JobsFailed)
	}

	result.OK = runErr == nil
	if runErr != nil {
		result.Error = runErr.Error()
	}
	return result, runErr
}

func (r *Runner) syncCake(ctx context.Context, source store.JobSource, baseURL string, syncConfig map[string]interface{}, result *Result) error {
	client := r.CakeClient
	if client == nil {
		client = cake.NewClient()
	}

	list, err := client.FetchList(ctx, baseURL, syncConfig)
	if err != nil {
		return err
	}

	result.JobsFetched = len(list)
	externalIDs := make([]string, 0, len(list))
	for _, item := range list {
		externalIDs = append(externalIDs, item.Path)
	}

	existing, err := r.Store.ExistingExternalIDs(source.ID, externalIDs)
	if err != nil {
		return err
	}

	for _, item := range list {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		if _, ok := existing[item.Path]; ok {
			result.JobsSkipped++
			continue
		}

		detail, err := client.FetchDetail(ctx, item.DetailURL)
		if err != nil {
			result.JobsFailed++
			log.Printf("failed to fetch cake job detail %s: %v", item.Path, err)
		} else {
			item.Detail = detail
		}

		row := cake.MapToListingRow(source, item)
		if err := r.Store.InsertJobListing(row); err != nil {
			result.JobsFailed++
			log.Printf("failed to insert cake job %s: %v", item.Path, err)
			continue
		}

		result.JobsCreated++
		existing[item.Path] = struct{}{}
	}

	if result.JobsFailed > 0 && result.JobsCreated == 0 && result.JobsSkipped == 0 {
		return fmt.Errorf("%d cake jobs failed during sync", result.JobsFailed)
	}
	return nil
}

func (r *Runner) syncWeb3Career(ctx context.Context, source store.JobSource, baseURL string, syncConfig map[string]interface{}, result *Result) error {
	client := r.Web3Client
	if client == nil {
		client = web3career.NewClient()
	}

	list, err := client.FetchList(ctx, baseURL, syncConfig)
	if err != nil {
		return err
	}

	result.JobsFetched = len(list)
	externalIDs := make([]string, 0, len(list))
	for _, item := range list {
		externalIDs = append(externalIDs, item.ExternalID)
	}

	existing, err := r.Store.ExistingExternalIDs(source.ID, externalIDs)
	if err != nil {
		return err
	}

	for _, item := range list {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		if _, ok := existing[item.ExternalID]; ok {
			result.JobsSkipped++
			continue
		}

		if item.DetailURL != "" {
			detail, err := client.FetchDetail(ctx, item.DetailURL)
			if err != nil {
				result.JobsFailed++
				log.Printf("failed to fetch web3career job detail %s: %v", item.DetailURL, err)
			} else {
				item.Detail = detail
			}
		}

		row := web3career.MapToListingRow(source, item)
		if err := r.Store.InsertJobListing(row); err != nil {
			result.JobsFailed++
			log.Printf("failed to insert web3career job %s: %v", item.ExternalID, err)
			continue
		}

		result.JobsCreated++
		existing[item.ExternalID] = struct{}{}
	}

	if result.JobsFailed > 0 && result.JobsCreated == 0 && result.JobsSkipped == 0 {
		return fmt.Errorf("%d web3career jobs failed during sync", result.JobsFailed)
	}
	return nil
}
