package cake

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"zood.work/workers/job-sync/internal/listing"
	"zood.work/workers/job-sync/internal/store"
)

func MapToListingRow(source store.JobSource, job Job) map[string]interface{} {
	detail := job.Detail
	description := strings.TrimSpace(job.Description)
	requirements := ""
	benefits := ""
	extra := ""
	sourceCreatedAt := interface{}(nil)
	title := job.Title
	companyName := job.Page.Name

	if detail != nil {
		if detail.Title != "" {
			title = detail.Title
		}
		if detail.DescriptionText != "" {
			description = detail.DescriptionText
		}
		requirements = detail.RequirementsText
		benefits = detail.BenefitsText
		extra = detail.Responsibilities
		if detail.HiringOrganization != "" {
			companyName = detail.HiringOrganization
		}
		sourceCreatedAt = parseDate(detail.DatePosted)
	}

	minSalary := parseSalary(job.Salary.Min)
	maxSalary := parseSalary(job.Salary.Max)
	if minSalary == 0 {
		minSalary = nil
	}
	if maxSalary == 0 {
		maxSalary = nil
	}

	return listing.ToRow(source, listing.NormalizedJob{
		ExternalID:        job.Path,
		Title:             title,
		Status:            0,
		Description:       description,
		Requirements:      requirements,
		Benefits:          benefits,
		ExtraContent:      extra,
		CompanyName:       companyName,
		CompanyExternalID: job.Page.Path,
		CompanyLogo:       cakeImageURL(job.Page.Logo),
		WorkTypeName:      job.JobType,
		OfficeModeName:    strings.Join(job.Locations, " / "),
		Location:          strings.Join(job.Locations, " / "),
		BaseLocation:      job.Page.Country,
		MinSalary:         minSalary,
		MaxSalary:         maxSalary,
		SourceURL:         job.DetailURL,
		Tags:              normalizeTags(job),
		RawData:           rawData(job),
		SourceCreatedAt:   sourceCreatedAt,
	})
}

func parseDate(value string) interface{} {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	for _, layout := range []string{time.RFC3339, "2006-01-02"} {
		parsed, err := time.Parse(layout, value)
		if err == nil {
			return parsed.UTC().Format(time.RFC3339)
		}
	}
	return nil
}

func parseSalary(value string) interface{} {
	value = strings.TrimSpace(value)
	if value == "" || value == "0" {
		return 0
	}
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil || parsed == 0 {
		return 0
	}
	return parsed
}

func normalizeTags(job Job) []map[string]string {
	tags := []map[string]string{}
	appendTag := func(name string) {
		name = strings.TrimSpace(name)
		if name == "" {
			return
		}
		tags = append(tags, map[string]string{"tagName": name})
	}

	appendTag(job.JobType)
	appendTag(job.SeniorityLevel)
	appendTag(job.Salary.Currency)
	appendTag(job.Salary.Type)
	for _, item := range job.Tags {
		appendTag(strings.TrimSpace(strings.Trim(itemToString(item), `"`)))
	}
	return tags
}

func rawData(job Job) map[string]interface{} {
	return map[string]interface{}{
		"path":               job.Path,
		"title":              job.Title,
		"description":        job.Description,
		"locations":          job.Locations,
		"salary":             job.Salary,
		"seniority_level":    job.SeniorityLevel,
		"job_type":           job.JobType,
		"tags":               job.Tags,
		"number_of_openings": job.NumberOfOpenings,
		"page":               job.Page,
		"detail_url":         job.DetailURL,
		"detail":             job.Detail,
	}
}

func itemToString(value interface{}) string {
	switch v := value.(type) {
	case string:
		return v
	case map[string]interface{}:
		for _, key := range []string{"name", "label", "title"} {
			if item, ok := v[key]; ok {
				return strings.TrimSpace(strings.Trim(itemToString(item), `"`))
			}
		}
	}
	return strings.TrimSpace(fmt.Sprint(value))
}

func cakeImageURL(path string) string {
	path = strings.TrimSpace(path)
	if path == "" {
		return ""
	}
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return path
	}
	return "https://media.cake.me/image/upload/c_limit,w_256/f_auto/q_auto/" + strings.TrimLeft(path, "/")
}
