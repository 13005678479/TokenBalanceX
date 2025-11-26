package handlers

import (
	"strconv"
	"time"

	"token-balance-backend/database"

	"github.com/gin-gonic/gin"
)

// GetPointsLeaderboard 获取积分排行榜
func (h *Handler) GetPointsLeaderboard(c *gin.Context) {
	page, size, err := GetPaginationParams(c)
	if err != nil {
		BadRequest(c, "分页参数错误: "+err.Error())
		return
	}

	users, total, err := h.userService.GetPointsLeaderboard(page, size)
	if err != nil {
		InternalError(c, "获取积分排行榜失败: "+err.Error())
		return
	}

	// 格式化排行榜数据
	var leaderboard []gin.H
	rank := (page - 1) * size
	for _, user := range users {
		rank++
		leaderboard = append(leaderboard, gin.H{
			"rank":          rank,
			"id":            user.ID,
			"address":       user.Address,
			"balance":       user.Balance.String(),
			"total_points":  user.TotalPoints.String(),
			"created_at":    user.CreatedAt,
			"updated_at":    user.UpdatedAt,
		})
	}

	SuccessWithPagination(c, leaderboard, total, page, size)
}

// CalculatePoints 手动计算积分
func (h *Handler) CalculatePoints(c *gin.Context) {
	// 获取参数
	fromDateStr := c.PostForm("from_date")
	toDateStr := c.PostForm("to_date")
	address := c.PostForm("address") // 可选，指定用户地址

	var fromDate, toDate time.Time
	var err error

	// 解析日期参数
	if fromDateStr != "" {
		fromDate, err = ParseTime(fromDateStr)
		if err != nil {
			BadRequest(c, "from_date 格式错误: "+err.Error())
			return
		}
	} else {
		// 默认从今天开始
		fromDate = time.Now().Truncate(24 * time.Hour)
	}

	if toDateStr != "" {
		toDate, err = ParseTime(toDateStr)
		if err != nil {
			BadRequest(c, "to_date 格式错误: "+err.Error())
			return
		}
	} else {
		// 默认到当前时间
		toDate = time.Now()
	}

	// 验证日期范围
	if toDate.Before(fromDate) {
		BadRequest(c, "结束日期不能早于开始日期")
		return
	}

	// 启动积分计算（在goroutine中）
	go func() {
		if address != "" {
			// 计算指定用户的积分
			err := h.pointsService.CalculateUserPointsFromTo(address, fromDate, toDate)
			if err != nil {
				// 记录错误到日志
				return
			}
		} else {
			// 计算所有用户的积分
			err := h.pointsService.RecalculateMissingPoints(fromDate, toDate)
			if err != nil {
				// 记录错误到日志
				return
			}
		}
	}()

	result := gin.H{
		"message": "积分计算已启动",
		"from_date": fromDate.Format("2006-01-02 15:04:05"),
		"to_date": toDate.Format("2006-01-02 15:04:05"),
		"status": "processing",
	}

	if address != "" {
		result["address"] = address
	}

	Success(c, result)
}

// GetPointsHistory 获取积分历史记录
func (h *Handler) GetPointsHistory(c *gin.Context) {
	address := c.Query("address")
	if address == "" {
		BadRequest(c, "用户地址不能为空")
		return
	}

	page, size, err := GetPaginationParams(c)
	if err != nil {
		BadRequest(c, "分页参数错误: "+err.Error())
		return
	}

	user, pointsRecords, total, err := h.userService.GetUserPoints(address, page, size)
	if err != nil {
		InternalError(c, "获取积分历史失败: "+err.Error())
		return
	}

	// 格式化积分记录
	var formattedRecords []gin.H
	for _, record := range pointsRecords {
		formattedRecords = append(formattedRecords, gin.H{
			"id":          record.ID,
			"address":     record.Address,
			"points":      record.Points.String(),
			"balance":     record.Balance.String(),
			"duration":    record.Duration,
			"rate":        record.Rate.String(),
			"start_time":  record.StartTime,
			"end_time":    record.EndTime,
			"period":      record.Period,
			"chain_id":    record.ChainID,
			"created_at":  record.CreatedAt,
		})
	}

	Success(c, gin.H{
		"user": gin.H{
			"address":      user.Address,
			"balance":      user.Balance.String(),
			"total_points": user.TotalPoints.String(),
		},
		"records": formattedRecords,
		"total":   total,
		"page":    page,
		"size":    size,
	})
}

// GetPointsStats 获取积分统计信息
func (h *Handler) GetPointsStats(c *gin.Context) {
	// 获取总积分
	totalPoints, err := h.userService.CalculateTotalPoints()
	if err != nil {
		InternalError(c, "计算总积分失败: "+err.Error())
		return
	}

	// 获取今日生成的积分
	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)
	
	var todayPoints struct {
		UsersCount  int64 `json:"users_count"`
		TotalPoints string `json:"total_points"`
	}

	h.db.Model(&database.PointsRecord{}).
		Where("created_at >= ? AND created_at < ?", today, tomorrow).
		Count(&todayPoints.UsersCount)

	var sumResult struct {
		Total string
	}
	h.db.Model(&database.PointsRecord{}).
		Where("created_at >= ? AND created_at < ?", today, tomorrow).
		Select("COALESCE(SUM(points), 0) as total").
		Scan(&sumResult)
	todayPoints.TotalPoints = sumResult.Total

	// 获取本周积分统计
	weekAgo := time.Now().AddDate(0, 0, -7).Truncate(24 * time.Hour)
	var weekStats struct {
		UsersCount  int64 `json:"users_count"`
		TotalPoints string `json:"total_points"`
	}

	h.db.Model(&database.PointsRecord{}).
		Where("created_at >= ?", weekAgo).
		Count(&weekStats.UsersCount)

	h.db.Model(&database.PointsRecord{}).
		Where("created_at >= ?", weekAgo).
		Select("COALESCE(SUM(points), 0) as total").
		Scan(&sumResult)
	weekStats.TotalPoints = sumResult.Total

	// 获取活跃用户数（有积分的用户）
	var activeUsers int64
	h.db.Model(&database.User{}).
		Where("total_points > 0").
		Count(&activeUsers)

	stats := gin.H{
		"total_points": totalPoints.String(),
		"active_users": activeUsers,
		"today": gin.H{
			"users_count":  todayPoints.UsersCount,
			"total_points": todayPoints.TotalPoints,
		},
		"week": gin.H{
			"users_count":  weekStats.UsersCount,
			"total_points": weekStats.TotalPoints,
		},
	}

	Success(c, stats)
}

// GetPointsChart 获取积分图表数据
func (h *Handler) GetPointsChart(c *gin.Context) {
	// 获取图表类型和时间段
	chartType := c.DefaultQuery("type", "daily") // daily, hourly, weekly
	days := 30 // 默认30天
	
	if daysStr := c.Query("days"); daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 && d <= 365 {
			days = d
		}
	}

	startDate := time.Now().AddDate(0, 0, -days).Truncate(24 * time.Hour)

	var chartData []gin.H

	switch chartType {
	case "daily":
		// 每日积分数据
		var dailyData []struct {
			Date   time.Time `json:"date"`
			Points string    `json:"points"`
			Count  int64     `json:"count"`
		}

		h.db.Model(&database.PointsRecord{}).
			Select("DATE(created_at) as date, COALESCE(SUM(points), 0) as points, COUNT(*) as count").
			Where("created_at >= ?", startDate).
			Group("DATE(created_at)").
			Order("date ASC").
			Scan(&dailyData)

		for _, data := range dailyData {
			chartData = append(chartData, gin.H{
				"date":   data.Date.Format("2006-01-02"),
				"points": data.Points,
				"count":  data.Count,
			})
		}

	case "weekly":
		// 每周积分数据
		var weeklyData []struct {
			Week   time.Time `json:"week"`
			Points string    `json:"points"`
			Count  int64     `json:"count"`
		}

		// 这里需要根据数据库类型调整周统计的SQL
		h.db.Raw(`
			SELECT DATE_SUB(DATE(created_at), INTERVAL WEEKDAY(created_at) DAY) as week,
			       COALESCE(SUM(points), 0) as points,
			       COUNT(*) as count
			FROM points_records 
			WHERE created_at >= ?
			GROUP BY week
			ORDER BY week ASC
		`, startDate).Scan(&weeklyData)

		for _, data := range weeklyData {
			chartData = append(chartData, gin.H{
				"week":   data.Week.Format("2006-01-02"),
				"points": data.Points,
				"count":  data.Count,
			})
		}

	default:
		// 默认返回每日数据
		var dailyData []struct {
			Date   time.Time `json:"date"`
			Points string    `json:"points"`
			Count  int64     `json:"count"`
		}

		h.db.Model(&database.PointsRecord{}).
			Select("DATE(created_at) as date, COALESCE(SUM(points), 0) as points, COUNT(*) as count").
			Where("created_at >= ?", startDate).
			Group("DATE(created_at)").
			Order("date ASC").
			Scan(&dailyData)

		for _, data := range dailyData {
			chartData = append(chartData, gin.H{
				"date":   data.Date.Format("2006-01-02"),
				"points": data.Points,
				"count":  data.Count,
			})
		}
	}

	Success(c, gin.H{
		"type":      chartType,
		"days":      days,
		"start_date": startDate.Format("2006-01-02"),
		"data":      chartData,
	})
}