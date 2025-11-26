package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"token-balance-backend/services"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type Handler struct {
	eventService  *services.EventService
	pointsService *services.PointsService
	userService   *services.UserService
	db           *gorm.DB
}

func NewHandler(eventService *services.EventService, pointsService *services.PointsService, userService *services.UserService, db *gorm.DB) *Handler {
	return &Handler{
		eventService:  eventService,
		pointsService: pointsService,
		userService:   userService,
		db:           db,
	}
}

// Response 通用响应结构
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// PaginationResponse 分页响应结构
type PaginationResponse struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Total   int64       `json:"total"`
	Page    int         `json:"page"`
	Size    int         `json:"size"`
}

// Success 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    0,
		Message: "success",
		Data:    data,
	})
}

// SuccessWithPagination 带分页的成功响应
func SuccessWithPagination(c *gin.Context, data interface{}, total int64, page, size int) {
	c.JSON(http.StatusOK, PaginationResponse{
		Code:    0,
		Message: "success",
		Data:    data,
		Total:   total,
		Page:    page,
		Size:    size,
	})
}

// Error 错误响应
func Error(c *gin.Context, code int, message string) {
	c.JSON(code, Response{
		Code:    code,
		Message: message,
	})
}

// BadRequest 400错误
func BadRequest(c *gin.Context, message string) {
	Error(c, http.StatusBadRequest, message)
}

// InternalError 500错误
func InternalError(c *gin.Context, message string) {
	Error(c, http.StatusInternalServerError, message)
}

// GetPaginationParams 获取分页参数
func GetPaginationParams(c *gin.Context) (int, int, error) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 10
	}

	return page, size, nil
}

// ParseTime 解析时间参数
func ParseTime(timeStr string) (time.Time, error) {
	if timeStr == "" {
		return time.Time{}, nil
	}
	
	// 支持多种时间格式
	formats := []string{
		"2006-01-02",
		"2006-01-02 15:04:05",
		"2006/01/02",
		"2006/01/02 15:04:05",
		time.RFC3339,
	}
	
	for _, format := range formats {
		if t, err := time.Parse(format, timeStr); err == nil {
			return t, nil
		}
	}
	
	return time.Time{}, fmt.Errorf("invalid time format")
}

// ParseDecimal 解析decimal参数
func ParseDecimal(str string) (decimal.Decimal, error) {
	if str == "" {
		return decimal.Zero, nil
	}
	
	return decimal.NewFromString(str)
}