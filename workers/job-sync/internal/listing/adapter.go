package listing

import (
	"time"

	"zood.work/workers/job-sync/internal/store"
)

type NormalizedJob struct {
	ExternalID        string
	Title             string
	PositionID        interface{}
	Status            int
	Description       string
	Requirements      string
	Benefits          string
	ExtraContent      string
	CompanyName       string
	CompanyExternalID string
	CompanyIntro      string
	CompanyLogo       string
	CompanyWebsite    string
	CompanySize       string
	WorkTypeID        interface{}
	WorkTypeName      string
	OfficeModeID      interface{}
	OfficeModeName    string
	Location          string
	BaseLocation      string
	MinSalary         interface{}
	MaxSalary         interface{}
	Email             string
	Phone             string
	Wechat            string
	Telegram          string
	SourceURL         string
	Tags              interface{}
	IsTopJob          bool
	UrgencyID         interface{}
	UrgencyName       string
	ViewCount         int
	ApplyCount        int
	Publisher         interface{}
	RawData           interface{}
	SourceCreatedAt   interface{}
}

func ToRow(source store.JobSource, job NormalizedJob) map[string]interface{} {
	return map[string]interface{}{
		"source_id":           source.ID,
		"source_slug":         nullableString(source.Slug),
		"source_name":         nullableString(source.Name),
		"external_id":         job.ExternalID,
		"title":               nullableString(job.Title),
		"position_id":         job.PositionID,
		"status":              job.Status,
		"description":         nullableString(job.Description),
		"requirements":        nullableString(job.Requirements),
		"benefits":            nullableString(job.Benefits),
		"extra_content":       nullableString(job.ExtraContent),
		"company_name":        nullableString(job.CompanyName),
		"company_external_id": nullableString(job.CompanyExternalID),
		"company_intro":       nullableString(job.CompanyIntro),
		"company_logo":        nullableString(job.CompanyLogo),
		"company_website":     nullableString(job.CompanyWebsite),
		"company_size":        nullableString(job.CompanySize),
		"work_type_id":        job.WorkTypeID,
		"work_type_name":      nullableString(job.WorkTypeName),
		"office_mode_id":      job.OfficeModeID,
		"office_mode_name":    nullableString(job.OfficeModeName),
		"location":            nullableString(job.Location),
		"base_location":       nullableString(job.BaseLocation),
		"min_salary":          job.MinSalary,
		"max_salary":          job.MaxSalary,
		"email":               nullableString(job.Email),
		"phone":               nullableString(job.Phone),
		"wechat":              nullableString(job.Wechat),
		"telegram":            nullableString(job.Telegram),
		"source_url":          nullableString(job.SourceURL),
		"tags":                job.Tags,
		"is_top_job":          job.IsTopJob,
		"urgency_id":          job.UrgencyID,
		"urgency_name":        nullableString(job.UrgencyName),
		"view_count":          job.ViewCount,
		"apply_count":         job.ApplyCount,
		"publisher":           job.Publisher,
		"raw_data":            job.RawData,
		"source_created_at":   job.SourceCreatedAt,
		"last_synced_at":      time.Now().UTC().Format(time.RFC3339),
	}
}

func nullableString(value string) interface{} {
	if value == "" {
		return nil
	}
	return value
}
