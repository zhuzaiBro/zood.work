package web3career

type Job struct {
	ExternalID string      `json:"external_id"`
	Path       string      `json:"path"`
	DetailURL  string      `json:"detail_url"`
	Posting    JobPosting  `json:"posting"`
	Detail     *JobPosting `json:"detail,omitempty"`
}

type JobPosting struct {
	Context                       interface{}                   `json:"@context,omitempty"`
	Type                          interface{}                   `json:"@type,omitempty"`
	Title                         string                        `json:"title,omitempty"`
	Description                   string                        `json:"description,omitempty"`
	DatePosted                    string                        `json:"datePosted,omitempty"`
	ValidThrough                  string                        `json:"validThrough,omitempty"`
	EmploymentType                string                        `json:"employmentType,omitempty"`
	Industry                      string                        `json:"industry,omitempty"`
	JobLocationType               string                        `json:"jobLocationType,omitempty"`
	OccupationalCategory          string                        `json:"occupationalCategory,omitempty"`
	WorkHours                     string                        `json:"workHours,omitempty"`
	Image                         string                        `json:"image,omitempty"`
	URL                           string                        `json:"url,omitempty"`
	HiringOrganization            Organization                  `json:"hiringOrganization,omitempty"`
	BaseSalary                    *MonetaryAmount               `json:"baseSalary,omitempty"`
	ApplicantLocationRequirements ApplicantLocationRequirements `json:"applicantLocationRequirements,omitempty"`
	JobLocation                   JobLocation                   `json:"jobLocation,omitempty"`
	Raw                           map[string]interface{}        `json:"-"`
}

type Organization struct {
	Type string `json:"@type,omitempty"`
	Name string `json:"name,omitempty"`
	Logo string `json:"logo,omitempty"`
	URL  string `json:"url,omitempty"`
}

type MonetaryAmount struct {
	Type     string            `json:"@type,omitempty"`
	Currency string            `json:"currency,omitempty"`
	Value    QuantitativeValue `json:"value,omitempty"`
}

type QuantitativeValue struct {
	Type     string  `json:"@type,omitempty"`
	MinValue float64 `json:"minValue,omitempty"`
	MaxValue float64 `json:"maxValue,omitempty"`
	Value    float64 `json:"value,omitempty"`
	UnitText string  `json:"unitText,omitempty"`
}

type ApplicantLocationRequirements struct {
	Type string `json:"@type,omitempty"`
	Name string `json:"name,omitempty"`
}

type JobLocation struct {
	Type    string  `json:"@type,omitempty"`
	Address Address `json:"address,omitempty"`
}

type Address struct {
	Type            string `json:"@type,omitempty"`
	StreetAddress   string `json:"streetAddress,omitempty"`
	AddressLocality string `json:"addressLocality,omitempty"`
	AddressRegion   string `json:"addressRegion,omitempty"`
	PostalCode      string `json:"postalCode,omitempty"`
	AddressCountry  string `json:"addressCountry,omitempty"`
}
