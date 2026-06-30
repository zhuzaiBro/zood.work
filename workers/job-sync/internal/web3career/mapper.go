package web3career

import (
	"html"
	"regexp"
	"strings"
	"time"

	"zood.work/workers/job-sync/internal/listing"
	"zood.work/workers/job-sync/internal/store"
)

func MapToListingRow(source store.JobSource, job Job) map[string]interface{} {
	posting := job.Posting
	if job.Detail != nil {
		posting = mergePosting(posting, *job.Detail)
	}

	description := strings.TrimSpace(stripHTML(html.UnescapeString(posting.Description)))
	location := normalizeLocation(posting)
	minSalary, maxSalary := normalizeSalary(posting.BaseSalary)

	return listing.ToRow(source, listing.NormalizedJob{
		ExternalID:        job.ExternalID,
		Title:             posting.Title,
		Status:            0,
		Description:       description,
		Requirements:      extractSection(description, []string{"requirements", "what you will need", "required qualifications", "minimum qualifications", "must-haves"}),
		Benefits:          extractSection(description, []string{"benefits", "perks", "compensation", "why join"}),
		ExtraContent:      extractSection(description, []string{"responsibilities", "what you will do", "about the role", "the role"}),
		CompanyName:       posting.HiringOrganization.Name,
		CompanyExternalID: normalizeCompanyID(posting.HiringOrganization.Name),
		CompanyLogo:       firstNonEmpty(posting.HiringOrganization.Logo, posting.Image),
		CompanyWebsite:    posting.HiringOrganization.URL,
		WorkTypeName:      posting.EmploymentType,
		OfficeModeName:    normalizeOfficeMode(posting),
		Location:          location,
		BaseLocation:      location,
		MinSalary:         minSalary,
		MaxSalary:         maxSalary,
		SourceURL:         job.DetailURL,
		Tags:              normalizeTags(posting),
		RawData:           rawData(job),
		SourceCreatedAt:   parseDate(posting.DatePosted),
	})
}

func mergePosting(base JobPosting, detail JobPosting) JobPosting {
	if detail.Title != "" {
		base.Title = detail.Title
	}
	if detail.Description != "" {
		base.Description = detail.Description
	}
	if detail.DatePosted != "" {
		base.DatePosted = detail.DatePosted
	}
	if detail.ValidThrough != "" {
		base.ValidThrough = detail.ValidThrough
	}
	if detail.EmploymentType != "" {
		base.EmploymentType = detail.EmploymentType
	}
	if detail.Industry != "" {
		base.Industry = detail.Industry
	}
	if detail.JobLocationType != "" {
		base.JobLocationType = detail.JobLocationType
	}
	if detail.HiringOrganization.Name != "" {
		base.HiringOrganization = detail.HiringOrganization
	}
	if detail.BaseSalary != nil {
		base.BaseSalary = detail.BaseSalary
	}
	if detail.ApplicantLocationRequirements.Name != "" {
		base.ApplicantLocationRequirements = detail.ApplicantLocationRequirements
	}
	if detail.JobLocation.Address.AddressCountry != "" || detail.JobLocation.Address.AddressLocality != "" {
		base.JobLocation = detail.JobLocation
	}
	if detail.Raw != nil {
		base.Raw = detail.Raw
	}
	return base
}

func normalizeLocation(posting JobPosting) string {
	parts := []string{}
	appendPart := func(value string) {
		value = strings.TrimSpace(value)
		if value != "" && !containsFold(parts, value) {
			parts = append(parts, value)
		}
	}

	if strings.EqualFold(posting.JobLocationType, "TELECOMMUTE") {
		appendPart("Remote")
	}
	appendPart(posting.ApplicantLocationRequirements.Name)
	appendPart(posting.JobLocation.Address.AddressLocality)
	appendPart(posting.JobLocation.Address.AddressRegion)
	appendPart(posting.JobLocation.Address.AddressCountry)

	if len(parts) == 0 {
		return ""
	}
	return strings.Join(parts, " / ")
}

func normalizeOfficeMode(posting JobPosting) string {
	if strings.EqualFold(posting.JobLocationType, "TELECOMMUTE") {
		return "Remote"
	}
	return posting.JobLocationType
}

func normalizeSalary(salary *MonetaryAmount) (interface{}, interface{}) {
	if salary == nil {
		return nil, nil
	}
	minValue := salary.Value.MinValue
	maxValue := salary.Value.MaxValue
	if minValue == 0 && salary.Value.Value > 0 {
		minValue = salary.Value.Value
	}
	if maxValue == 0 && salary.Value.Value > 0 {
		maxValue = salary.Value.Value
	}
	if minValue == 0 && maxValue == 0 {
		return nil, nil
	}
	var minResult interface{}
	var maxResult interface{}
	if minValue > 0 {
		minResult = minValue
	}
	if maxValue > 0 {
		maxResult = maxValue
	}
	return minResult, maxResult
}

func normalizeTags(posting JobPosting) []map[string]string {
	tags := []map[string]string{}
	appendTag := func(name string) {
		name = strings.TrimSpace(name)
		if name == "" {
			return
		}
		tags = append(tags, map[string]string{"tagName": name})
	}

	appendTag(posting.EmploymentType)
	appendTag(posting.Industry)
	appendTag(posting.JobLocationType)
	appendTag(posting.OccupationalCategory)
	appendTag(posting.WorkHours)
	if posting.BaseSalary != nil {
		appendTag(posting.BaseSalary.Currency)
		appendTag(posting.BaseSalary.Value.UnitText)
	}
	return tags
}

func rawData(job Job) map[string]interface{} {
	return map[string]interface{}{
		"external_id": job.ExternalID,
		"path":        job.Path,
		"detail_url":  job.DetailURL,
		"posting":     job.Posting,
		"detail":      job.Detail,
	}
}

func parseDate(value string) interface{} {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	for _, layout := range []string{
		time.RFC3339,
		"2006-01-02 15:04:05 -0700",
		"2006-01-02 15:04:05 MST",
		"2006-01-02",
	} {
		parsed, err := time.Parse(layout, value)
		if err == nil {
			return parsed.UTC().Format(time.RFC3339)
		}
	}
	return nil
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

func normalizeCompanyID(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = regexp.MustCompile(`[^a-zA-Z0-9]+`).ReplaceAllString(value, "-")
	return strings.Trim(value, "-")
}

func containsFold(values []string, candidate string) bool {
	for _, value := range values {
		if strings.EqualFold(value, candidate) {
			return true
		}
	}
	return false
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}
