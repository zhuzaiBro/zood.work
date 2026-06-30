package dejob

import (
	"strconv"
	"time"

	"zood.work/workers/job-sync/internal/listing"
	"zood.work/workers/job-sync/internal/store"
)

func MapToListingRow(source store.JobSource, job Job) map[string]interface{} {
	return listing.ToRow(source, listing.NormalizedJob{
		ExternalID:        strconv.Itoa(job.TopicID),
		Title:             job.PositionName,
		PositionID:        nullableInt(job.PositionID),
		Status:            job.Status,
		Description:       job.Content,
		Requirements:      job.Content2,
		Benefits:          job.Content3,
		ExtraContent:      job.Content5,
		CompanyName:       job.Company,
		CompanyExternalID: nullableCompanyID(job.CompanyID),
		CompanyIntro:      job.CompanyIntroduction,
		CompanyLogo:       job.CompanyLogo,
		CompanyWebsite:    job.CompanyWebsite,
		CompanySize:       job.CompanySizeName,
		WorkTypeID:        nullableInt(job.WorkTypeID),
		WorkTypeName:      job.WorkTypeName,
		OfficeModeID:      nullableInt(job.OfficeModeID),
		OfficeModeName:    job.OfficeModeName,
		Location:          job.Location,
		BaseLocation:      job.Base,
		MinSalary:         nullableFloat(job.MinSalary),
		MaxSalary:         nullableFloat(job.MaxSalary),
		Email:             job.Email,
		Phone:             job.Phone,
		Wechat:            job.Wechat,
		Telegram:          job.Telegram,
		SourceURL:         job.URL,
		Tags:              job.Tags,
		IsTopJob:          job.IsTopJob,
		UrgencyID:         nullableInt(job.LeverID),
		UrgencyName:       job.LeverName,
		ViewCount:         job.ViewCount,
		ApplyCount:        job.ApplyCount,
		Publisher:         job.User,
		RawData:           job,
		SourceCreatedAt:   msToISO(job.CreateTime),
	})
}

func msToISO(ms int64) interface{} {
	if ms <= 0 {
		return nil
	}
	return time.UnixMilli(ms).UTC().Format(time.RFC3339)
}

func nullableInt(value int) interface{} {
	if value == 0 {
		return nil
	}
	return value
}

func nullableFloat(value float64) interface{} {
	if value == 0 {
		return nil
	}
	return value
}

func nullableCompanyID(value int) string {
	if value == 0 {
		return ""
	}
	return strconv.Itoa(value)
}
