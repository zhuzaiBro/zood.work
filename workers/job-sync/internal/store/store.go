package store

import (
	"encoding/json"
	"errors"
	"fmt"
	stdlog "log"
	"os"
	"strings"
	"time"

	"gorm.io/datatypes"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Store struct {
	db *gorm.DB
}

type JobSource struct {
	ID             string                 `gorm:"column:id"`
	Slug           string                 `gorm:"column:slug"`
	Name           string                 `gorm:"column:name"`
	BaseURL        string                 `gorm:"column:base_url"`
	SyncConfig     map[string]interface{} `gorm:"-"`
	SyncConfigJSON datatypes.JSONMap      `gorm:"column:sync_config"`
}

func (JobSource) TableName() string {
	return "job_sources"
}

func (s *JobSource) AfterFind(_ *gorm.DB) error {
	s.SyncConfig = map[string]interface{}(s.SyncConfigJSON)
	if s.SyncConfig == nil {
		s.SyncConfig = map[string]interface{}{}
	}
	return nil
}

type SyncRun struct {
	ID       string `gorm:"column:id;type:uuid;default:gen_random_uuid();primaryKey"`
	SourceID string `gorm:"column:source_id;type:uuid"`
	Status   string `gorm:"column:status"`
}

func (SyncRun) TableName() string {
	return "job_sync_runs"
}

type SyncRunUpdate struct {
	Status       string
	JobsFetched  int
	JobsCreated  int
	JobsSkipped  int
	JobsFailed   int
	ErrorMessage *string
}

type JobListingSearchResult struct {
	ID             string     `gorm:"column:id"`
	Title          *string    `gorm:"column:title"`
	CompanyName    *string    `gorm:"column:company_name"`
	Location       *string    `gorm:"column:location"`
	BaseLocation   *string    `gorm:"column:base_location"`
	MinSalary      *float64   `gorm:"column:min_salary"`
	MaxSalary      *float64   `gorm:"column:max_salary"`
	WorkTypeName   *string    `gorm:"column:work_type_name"`
	OfficeModeName *string    `gorm:"column:office_mode_name"`
	CreatedAt      *time.Time `gorm:"column:source_created_at"`
	LastSyncedAt   time.Time  `gorm:"column:last_synced_at"`
}

func New(databaseURL string) (*Store, error) {
	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  databaseURL,
		PreferSimpleProtocol: true,
	}), &gorm.Config{
		Logger: logger.New(
			stdlog.New(os.Stdout, "\r\n", stdlog.LstdFlags),
			logger.Config{
				SlowThreshold:             time.Second,
				LogLevel:                  logger.Warn,
				IgnoreRecordNotFoundError: true,
				ParameterizedQueries:      true,
			},
		),
	})
	if err != nil {
		return nil, fmt.Errorf("connect database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("open database handle: %w", err)
	}
	sqlDB.SetMaxOpenConns(5)
	sqlDB.SetMaxIdleConns(2)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	return &Store{db: db}, nil
}

func (s *Store) Close() error {
	sqlDB, err := s.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

func (s *Store) GetActiveSource(slug string) (*JobSource, error) {
	var source JobSource
	err := s.db.
		Select("id", "slug", "name", "base_url", "sync_config").
		Where("slug = ? AND is_active = ?", slug, true).
		First(&source).
		Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("job source %q not found or inactive", slug)
		}
		return nil, err
	}
	return &source, nil
}

func (s *Store) GetActiveSources(slugs []string) ([]JobSource, error) {
	db := s.db.
		Select("id", "slug", "name", "base_url", "sync_config").
		Where("is_active = ?", true)

	if len(slugs) > 0 && !containsAll(slugs) {
		db = db.Where("slug IN ?", slugs)
	}

	var sources []JobSource
	if err := db.Order("slug ASC").Find(&sources).Error; err != nil {
		return nil, err
	}
	if len(sources) == 0 {
		if len(slugs) > 0 && !containsAll(slugs) {
			return nil, fmt.Errorf("job sources %q not found or inactive", strings.Join(slugs, ","))
		}
		return nil, fmt.Errorf("no active job sources found")
	}
	return sources, nil
}

func (s *Store) CreateSyncRun(sourceID string) (string, error) {
	run := SyncRun{
		SourceID: sourceID,
		Status:   "running",
	}
	if err := s.db.Create(&run).Error; err != nil {
		return "", err
	}
	if run.ID == "" {
		return "", fmt.Errorf("failed to create sync run")
	}
	return run.ID, nil
}

func (s *Store) FinishSyncRun(runID string, update SyncRunUpdate) error {
	values := map[string]interface{}{
		"status":        update.Status,
		"jobs_fetched":  update.JobsFetched,
		"jobs_created":  update.JobsCreated,
		"jobs_skipped":  update.JobsSkipped,
		"jobs_failed":   update.JobsFailed,
		"error_message": update.ErrorMessage,
		"finished_at":   time.Now().UTC(),
	}

	return s.db.
		Table("job_sync_runs").
		Where("id = ?", runID).
		Updates(values).
		Error
}

func (s *Store) ExistingExternalIDs(sourceID string, externalIDs []string) (map[string]struct{}, error) {
	result := make(map[string]struct{})
	if len(externalIDs) == 0 {
		return result, nil
	}

	var rows []struct {
		ExternalID string `gorm:"column:external_id"`
	}
	if err := s.db.
		Table("job_listings").
		Select("external_id").
		Where("source_id = ? AND external_id IN ?", sourceID, externalIDs).
		Find(&rows).
		Error; err != nil {
		return nil, err
	}

	for _, row := range rows {
		result[row.ExternalID] = struct{}{}
	}
	return result, nil
}

func (s *Store) InsertJobListing(row map[string]interface{}) error {
	values, err := normalizeListingRow(row)
	if err != nil {
		return err
	}
	return s.db.Table("job_listings").Create(values).Error
}

func (s *Store) SearchJobListings(query string, limit int) ([]JobListingSearchResult, error) {
	keywords := splitKeywords(query)
	if len(keywords) == 0 {
		return nil, nil
	}
	if limit <= 0 || limit > 10 {
		limit = 5
	}

	db := s.db.
		Table("job_listings").
		Select(`
			id,
			title,
			company_name,
			location,
			base_location,
			min_salary,
			max_salary,
			work_type_name,
			office_mode_name,
			source_created_at,
			last_synced_at
		`)

	for _, keyword := range keywords {
		pattern := "%" + escapeLike(keyword) + "%"
		db = db.Where(`
			title ILIKE @pattern OR
			company_name ILIKE @pattern OR
			location ILIKE @pattern OR
			base_location ILIKE @pattern OR
			work_type_name ILIKE @pattern OR
			office_mode_name ILIKE @pattern OR
			description ILIKE @pattern OR
			requirements ILIKE @pattern
		`, map[string]interface{}{"pattern": pattern})
	}

	var rows []JobListingSearchResult
	if err := db.
		Order("source_created_at DESC NULLS LAST").
		Limit(limit).
		Find(&rows).
		Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func normalizeListingRow(row map[string]interface{}) (map[string]interface{}, error) {
	values := make(map[string]interface{}, len(row))
	for key, value := range row {
		switch key {
		case "tags", "publisher", "raw_data":
			jsonValue, err := toJSON(value)
			if err != nil {
				return nil, fmt.Errorf("marshal %s: %w", key, err)
			}
			values[key] = jsonValue
		case "source_created_at", "last_synced_at":
			if value == nil {
				values[key] = nil
				continue
			}
			parsed, err := parseTime(value)
			if err != nil {
				return nil, fmt.Errorf("parse %s: %w", key, err)
			}
			values[key] = parsed
		default:
			values[key] = value
		}
	}
	return values, nil
}

func toJSON(value interface{}) (datatypes.JSON, error) {
	if value == nil {
		return datatypes.JSON([]byte("null")), nil
	}
	payload, err := json.Marshal(value)
	if err != nil {
		return nil, err
	}
	return datatypes.JSON(payload), nil
}

func parseTime(value interface{}) (interface{}, error) {
	switch v := value.(type) {
	case time.Time:
		return v, nil
	case string:
		if v == "" {
			return nil, nil
		}
		parsed, err := time.Parse(time.RFC3339, v)
		if err != nil {
			return nil, err
		}
		return parsed, nil
	default:
		return nil, fmt.Errorf("unsupported time value %T", value)
	}
}

func ConfigInt(config map[string]interface{}, key string, fallback int) int {
	value, ok := config[key]
	if !ok {
		return fallback
	}
	switch v := value.(type) {
	case float64:
		return int(v)
	case int:
		return v
	case int64:
		return int(v)
	case json.Number:
		n, _ := v.Int64()
		return int(n)
	default:
		return fallback
	}
}

func ConfigString(config map[string]interface{}, key, fallback string) string {
	value, ok := config[key]
	if !ok || value == nil {
		return fallback
	}
	if s, ok := value.(string); ok {
		return s
	}
	return fallback
}

func splitKeywords(query string) []string {
	fields := strings.Fields(strings.TrimSpace(query))
	if len(fields) > 4 {
		fields = fields[:4]
	}
	return fields
}

func escapeLike(value string) string {
	replacer := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)
	return replacer.Replace(value)
}

func containsAll(values []string) bool {
	for _, value := range values {
		normalized := strings.TrimSpace(strings.ToLower(value))
		if normalized == "all" || normalized == "*" {
			return true
		}
	}
	return false
}
