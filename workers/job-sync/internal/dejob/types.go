package dejob

type Tag struct {
	TagID   int    `json:"tagId"`
	TagName string `json:"tagName"`
}

type Job struct {
	TopicID              int                    `json:"topicId"`
	User                 map[string]interface{} `json:"user"`
	IsTopJob             bool                   `json:"isTopJob"`
	Content              string                 `json:"content"`
	Content2             string                 `json:"content2"`
	Content3             string                 `json:"content3"`
	Content5             string                 `json:"content5"`
	Email                string                 `json:"email"`
	Phone                string                 `json:"phone"`
	Wechat               string                 `json:"wechat"`
	Telegram             string                 `json:"telegram"`
	PositionName         string                 `json:"positionName"`
	PositionID           int                    `json:"positionId"`
	ViewCount            int                    `json:"viewCount"`
	ApplyCount           int                    `json:"applyCount"`
	CreateTime           int64                  `json:"createTime"`
	URL                  string                 `json:"url"`
	WorkTypeID           int                    `json:"workTypeId"`
	WorkTypeName         string                 `json:"workTypeName"`
	OfficeModeID         int                    `json:"officeModeId"`
	OfficeModeName       string                 `json:"officeModeName"`
	Company              string                 `json:"company"`
	CompanyIntroduction  string                 `json:"companyIntroduction"`
	CompanySizeName      string                 `json:"companySizeName"`
	CompanyLogo          string                 `json:"companyLogo"`
	CompanyWebsite       string                 `json:"companyWebsite"`
	CompanyID            int                    `json:"companyId"`
	MinSalary            float64                `json:"minSalary"`
	MaxSalary            float64                `json:"maxSalary"`
	LeverID              int                    `json:"leverId"`
	LeverName            string                 `json:"leverName"`
	Location             string                 `json:"location"`
	Tags                 []Tag                  `json:"tags"`
	Base                 string                 `json:"base"`
	Status               int                    `json:"status"`
}

type ListResponse struct {
	ErrorCode int    `json:"errorCode"`
	Message   string `json:"message"`
	Data      *struct {
		Page    map[string]interface{} `json:"page"`
		Results []Job                  `json:"results"`
	} `json:"data"`
	Success bool `json:"success"`
}

type DetailResponse struct {
	ErrorCode int    `json:"errorCode"`
	Message   string `json:"message"`
	Data      *Job   `json:"data"`
	Success   bool   `json:"success"`
}
