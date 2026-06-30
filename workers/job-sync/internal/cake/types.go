package cake

type SearchRequest struct {
	Query   string        `json:"query"`
	Filters SearchFilters `json:"filters"`
	SortBy  string        `json:"sort_by"`
	Page    int           `json:"page"`
	PerPage int           `json:"per_page"`
}

type SearchFilters struct {
	Professions []string `json:"professions,omitempty"`
	JobTypes    []string `json:"job_types,omitempty"`
	Remote      []string `json:"remote,omitempty"`
}

type SearchResponse struct {
	TotalEntries int   `json:"total_entries"`
	TotalPages   int   `json:"total_pages"`
	PerPage      int   `json:"per_page"`
	CurrentPage  int   `json:"current_page"`
	Data         []Job `json:"data"`
}

type Job struct {
	Path             string                 `json:"path"`
	Title            string                 `json:"title"`
	Description      string                 `json:"description"`
	Locations        []string               `json:"locations"`
	Salary           Salary                 `json:"salary"`
	SeniorityLevel   string                 `json:"seniority_level"`
	JobType          string                 `json:"job_type"`
	Tags             []interface{}          `json:"tags"`
	NumberOfOpenings *int                   `json:"number_of_openings"`
	Page             CompanyPage            `json:"page"`
	Raw              map[string]interface{} `json:"-"`
	Detail           *Detail
	DetailURL        string
}

type Salary struct {
	Min      string `json:"min"`
	Max      string `json:"max"`
	Currency string `json:"currency"`
	Type     string `json:"type"`
}

type CompanyPage struct {
	Path    string                 `json:"path"`
	Name    string                 `json:"name"`
	Logo    string                 `json:"logo"`
	Country string                 `json:"country"`
	Geo     map[string]interface{} `json:"geo"`
}

type Detail struct {
	Title              string                 `json:"title"`
	DescriptionHTML    string                 `json:"description_html"`
	DescriptionText    string                 `json:"description_text"`
	RequirementsText   string                 `json:"requirements_text"`
	Responsibilities   string                 `json:"responsibilities"`
	BenefitsText       string                 `json:"benefits_text"`
	HiringOrganization string                 `json:"hiring_organization"`
	EmploymentType     string                 `json:"employment_type"`
	DatePosted         string                 `json:"date_posted"`
	ValidThrough       string                 `json:"valid_through"`
	RawJSONLD          map[string]interface{} `json:"raw_json_ld,omitempty"`
}
