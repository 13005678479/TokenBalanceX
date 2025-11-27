package controllers

import (
	"net/http"
	"token-balance/internal/services"

	"github.com/gin-gonic/gin"
)

// PointsController 积分控制器
type PointsController struct {
	pointsService *services.PointsService
}

// NewPointsController 创建积分控制器
func NewPointsController(pointsService *services.PointsService) *PointsController {
	return &PointsController{
		pointsService: pointsService,
	}
}

// GetPointsLeaderboard 获取积分排行榜
// @Summary 获取积分排行榜
// @Description 获取积分排行榜，显示积分最高的用户
// @Tags Points
// @Param limit query int false "返回数量限制" default(50)
// @Produce json
// @Success 200 {object} []models.LeaderboardEntry
// @Router /api/v1/points/leaderboard [get]
func (pc *PointsController) GetPointsLeaderboard(c *gin.Context) {
	limit := c.DefaultQuery("limit", "50")

	leaderboard, err := pc.pointsService.GetPointsLeaderboard(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    leaderboard,
	})
}

// CalculatePoints 计算积分
// @Summary 计算积分
// @Description 手动触发积分计算任务
// @Tags Points
// @Param fromDate query string false "开始日期" format(2024-01-01)
// @Param toDate query string false "结束日期" format(2024-01-31)
// @Produce json
// @Success 200 {object} models.SwaggerResponse
// @Router /api/v1/points/calculate [post]
func (pc *PointsController) CalculatePoints(c *gin.Context) {
	fromDate := c.Query("from_date")
	toDate := c.Query("to_date")

	err := pc.pointsService.CalculatePoints(fromDate, toDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "积分计算任务已启动",
	})
}

// GetUserPointsSummary 获取用户积分汇总
func (pc *PointsController) GetUserPointsSummary(c *gin.Context) {
	address := c.Param("address")
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "用户地址不能为空",
		})
		return
	}

	c.JSON(http.StatusNotImplemented, gin.H{
		"success": false,
		"message": "此端点暂未实现",
	})
}
