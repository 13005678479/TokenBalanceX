package models

// SwaggerResponse 通用Swagger响应类型
type SwaggerResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}
