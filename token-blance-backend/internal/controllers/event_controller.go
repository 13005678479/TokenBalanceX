package controllers

import (
	"net/http"
	"token-balance/internal/services"

	"github.com/gin-gonic/gin"
)

// EventController 事件控制器
type EventController struct {
	eventService *services.EventService
}

// NewEventController 创建事件控制器
func NewEventController(eventService *services.EventService) *EventController {
	return &EventController{
		eventService: eventService,
	}
}

// GetRecentEvents 获取最近事件
// @Summary 获取最近事件
// @Description 获取最近的区块链事件记录
// @Tags Events
// @Param page query int false "页码" default(1)
// @Param pageSize query int false "每页数量" default(20)
// @Produce json
// @Success 200 {object} models.PaginatedData
// @Router /api/v1/events [get]
func (ec *EventController) GetRecentEvents(c *gin.Context) {
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("pageSize", "20")

	events, err := ec.eventService.GetRecentEvents(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    events,
	})
}

// SyncEvents 同步事件
// @Summary 同步区块链事件
// @Description 手动触发区块链事件同步
// @Tags Events
// @Produce json
// @Success 200 {object} models.SwaggerResponse
// @Router /api/v1/events/sync [post]
func (ec *EventController) SyncEvents(c *gin.Context) {
	err := ec.eventService.SyncEvents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "事件同步已启动",
	})
}

// GetEvents 获取事件列表（别名）
func (ec *EventController) GetEvents(c *gin.Context) {
	ec.GetRecentEvents(c)
}

// GetEventByID 获取单个事件（暂时返回错误）
func (ec *EventController) GetEventByID(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"success": false,
		"message": "此端点暂未实现",
	})
}
