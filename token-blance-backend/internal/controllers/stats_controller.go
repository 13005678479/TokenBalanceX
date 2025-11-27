package controllers

import (
	"net/http"
	"token-balance/internal/services"

	"github.com/gin-gonic/gin"
)

// StatsController 统计控制器
type StatsController struct {
	statsService *services.StatsService
}

// NewStatsController 创建统计控制器
func NewStatsController(statsService *services.StatsService) *StatsController {
	return &StatsController{
		statsService: statsService,
	}
}

// GetStatsOverview 获取系统概览
// @Summary 获取系统概览
// @Description 获取系统的总体统计数据
// @Tags Stats
// @Produce json
// @Success 200 {object} services.StatsOverview
// @Router /api/v1/stats/overview [get]
func (sc *StatsController) GetStatsOverview(c *gin.Context) {
	overview, err := sc.statsService.GetOverview()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    overview,
	})
}

// GetSystemStats 获取系统统计（别名）
func (sc *StatsController) GetSystemStats(c *gin.Context) {
	sc.GetStatsOverview(c)
}

// GetDailyStats 获取每日统计
// @Summary 获取每日统计
// @Description 获取指定天数的每日统计数据
// @Tags Stats
// @Param days query int false "天数" default(30)
// @Produce json
// @Success 200 {object} []models.DailyStats
// @Router /api/v1/stats/daily [get]
func (sc *StatsController) GetDailyStats(c *gin.Context) {
	days := c.DefaultQuery("days", "30")

	dailyStats, err := sc.statsService.GetDailyStats(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    dailyStats,
	})
}
