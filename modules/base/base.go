package base

type (
	ApiJsonErr struct {
		Message string `json:"message"`
		DocUrl  string `json:"url"`
	}
)
