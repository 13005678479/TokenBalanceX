package handlers

import (
	"fmt"
	"strconv"
	"time"

	"token-balance-backend/database"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

// GetStatsOverview 获取系统概览统计
func (h *Handler) GetStatsOverview(c *gin.Context) {
	// 获取系统统计
	stats, err := h.userService.GetSystemStats()
	if err != nil {
		InternalError(c, "获取系统统计失败: "+err.Error())
		return
	}

	// 获取当前总供应量和总积分
	totalSupply, err := h.userService.CalculateTotalSupply()
	if err != nil {
		InternalError(c, "计算总供应量失败: "+err.Error())
		return
	}

	totalPoints, err := h.userService.CalculateTotalPoints()
	if err != nil {
		InternalError(c, "计算总积分失败: "+err.Error())
		return
	}

	// 获取活跃用户数
	activeUsers, err := h.userService.GetActiveUserCount()
	if err != nil {
		InternalError(c, "计算活跃用户数失败: "+err.Error())
		return
	}

	// 获取今日交易统计
	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)

	var todayTransactions struct {
		TotalTransactions int64 `json:"total_transactions"`
		MintTransactions  int64 `json:"mint_transactions"`
		BurnTransactions  int64 `json:"burn_transactions"`
		TransferTransactions int64 `json:"transfer_transactions"`
	}

	h.db.Model(&database.UserBalanceHistory{}).
		Where("timestamp >= ? AND timestamp < ?", today, tomorrow).
		Count(&todayTransactions.TotalTransactions)

	h.db.Model(&database.UserBalanceHistory{}).
		Where("timestamp >= ? AND timestamp < ? AND event_type = ?", today, tomorrow, "mint").
		Count(&todayTransactions.MintTransactions)

	h.db.Model(&database.UserBalanceHistory{}).
		Where("timestamp >= ? AND timestamp < ? AND event_type = ?", today, tomorrow, "burn").
		Count(&todayTransactions.BurnTransactions)

	h.db.Model(&database.UserBalanceHistory{}).
		Where("timestamp >= ? AND timestamp < ? AND (event_type = ? OR event_type = ?)", today, tomorrow, "transfer", "transfer_receive").
		Count(&todayTransactions.TransferTransactions)

	overview := gin.H{
		"total_supply":    totalSupply.String(),
		"total_points":    totalPoints.String(),
		"total_users":     stats.TotalUsers,
		"active_users":    activeUsers,
		"today_transactions": todayTransactions,
		"chain_id":        stats.ChainID,
		"last_updated":    stats.UpdatedAt,
	}

	Success(c, overview)
}

// GetDailyStats 获取每日统计数据
func (h *Handler) GetDailyStats(c *gin.Context) {
	days := 30 // 默认30天
	
	if daysStr := c.Query("days"); daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 && d <= 365 {
			days = d
		}
	}

	stats, err := h.userService.GetDailyStats(days)
	if err != nil {
		InternalError(c, "获取每日统计失败: "+err.Error())
		return
	}

	// 格式化统计数据
	var formattedStats []gin.H
	for _, stat := range stats {
		formattedStats = append(formattedStats, gin.H{
			"date":                 stat.Date,
			"total_users":          stat.TotalUsers,
			"active_users":         stat.ActiveUsers,
			"total_balance":        stat.TotalBalance.String(),
			"total_supply":         stat.TotalSupply.String(),
			"total_points":         stat.TotalPoints.String(),
			"points_generated":     stat.PointsGenerated.String(),
			"transaction_count":    stat.TransactionCount,
			"mint_count":           stat.MintCount,
			"burn_count":           stat.BurnCount,
			"transfer_count":       stat.TransferCount,
			"chain_id":             stat.ChainID,
		})
	}

	Success(c, gin.H{
		"days":  days,
		"stats": formattedStats,
	})
}

// GetTokenDistribution 获取代币分布统计
func (h *Handler) GetTokenDistribution(c *gin.Context) {
	// 获取代币分布统计
	var distribution []struct {
		Range      string `json:"range"`
		Count      int64  `json:"count"`
		Percentage string `json:"percentage"`
		TotalBalance string `json:"total_balance"`
	}

	// 计算用户总数
	var totalUsers int64
	h.db.Model(&database.User{}).Count(&totalUsers)

	if totalUsers == 0 {
		Success(c, gin.H{
			"total_users": 0,
			"distribution": []gin.H{},
		})
		return
	}

	// 定义余额区间
	ranges := []struct {
		Name  string
		Min   float64
		Max   float64
		Query string
	}{
		{"0-100", 0, 100, "balance >= 0 AND balance < 100"},
		{"100-1000", 100, 1000, "balance >= 100 AND balance < 1000"},
		{"1000-10000", 1000, 10000, "balance >= 1000 AND balance < 10000"},
		{"10000-100000", 10000, 100000, "balance >= 10000 AND balance < 100000"},
		{"100000+", 100000, -1, "balance >= 100000"},
	}

	for _, r := range ranges {
		var result struct {
			Count       int64 `json:"count"`
			TotalBalance string `json:"total_balance"`
		}

		query := "SELECT COUNT(*) as count, COALESCE(SUM(balance), 0) as total_balance FROM users WHERE " + r.Query
		h.db.Raw(query).Scan(&result)

		percentage := float64(result.Count) / float64(totalUsers) * 100

		distribution = append(distribution, struct {
			Range      string `json:"range"`
			Count      int64  `json:"count"`
			Percentage string `json:"percentage"`
			TotalBalance string `json:"total_balance"`
		}{
			Range:        r.Name,
			Count:        result.Count,
			Percentage:   fmt.Sprintf("%.2f%%", percentage),
			TotalBalance: result.TotalBalance,
		})
	}

	Success(c, gin.H{
		"total_users": totalUsers,
		"distribution": distribution,
	})
}

// GetTopHolders 获取持币排行榜
func (h *Handler) GetTopHolders(c *gin.Context) {
	limit := 50 // 默认前50名
	
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 1000 {
			limit = l
		}
	}

	var holders []database.User
	if err := h.db.Where("balance > 0").
		Order("balance DESC").
		Limit(limit).
		Find(&holders).Error; err != nil {
		InternalError(c, "获取持币排行榜失败: "+err.Error())
		return
	}

	// 计算总供应量用于计算百分比
	totalSupply, err := h.userService.CalculateTotalSupply()
	if err != nil {
		InternalError(c, "计算总供应量失败: "+err.Error())
		return
	}

	var formattedHolders []gin.H
	rank := 0
	cumulativePercentage := decimal.Zero

	for _, holder := range holders {
		rank++
		percentage := decimal.Zero
		if totalSupply.GreaterThan(decimal.Zero) {
			percentage = holder.Balance.Div(totalSupply).Mul(decimal.NewFromInt(100))
		}
		cumulativePercentage = cumulativePercentage.Add(percentage)

		formattedHolders = append(formattedHolders, gin.H{
			"rank":                rank,
			"address":             holder.Address,
			"balance":             holder.Balance.String(),
			"percentage":          percentage.StringFixed(4) + "%",
			"cumulative_percentage": cumulativePercentage.StringFixed(4) + "%",
			"total_points":        holder.TotalPoints.String(),
			"created_at":          holder.CreatedAt,
		})
	}

	Success(c, gin.H{
		"limit":           limit,
		"total_supply":    totalSupply.String(),
		"holders_count":   len(holders),
		"holders":         formattedHolders,
	})
}

// GetTransactionVolume 获取交易量统计
func (h *Handler) GetTransactionVolume(c *gin.Context) {
	days := 30 // 默认30天
	
	if daysStr := c.Query("days"); daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 && d <= 365 {
			days = d
		}
	}

	startDate := time.Now().AddDate(0, 0, -days).Truncate(24 * time.Hour)

	var volumeData []struct {
		Date                time.Time `json:"date"`
		TotalVolume         string    `json:"total_volume"`
		MintVolume          string    `json:"mint_volume"`
		BurnVolume          string    `json:"burn_volume"`
		TransferVolume      string    `json:"transfer_volume"`
		TransactionCount    int64     `json:"transaction_count"`
		UniqueUsers         int64     `json:"unique_users"`
	}

	// 查询每日交易量和用户数
	h.db.Raw(`
		SELECT 
			DATE(timestamp) as date,
			COALESCE(SUM(CASE WHEN event_type = 'mint' THEN amount ELSE 0 END), 0) as mint_volume,
			COALESCE(SUM(CASE WHEN event_type = 'burn' THEN amount ELSE 0 END), 0) as burn_volume,
			COALESCE(SUM(CASE WHEN event_type IN ('transfer', 'transfer_receive') THEN amount ELSE 0 END), 0) as transfer_volume,
			COALESCE(SUM(amount), 0) as total_volume,
			COUNT(*) as transaction_count,
			COUNT(DISTINCT address) as unique_users
		FROM user_balance_history 
		WHERE timestamp >= ?
		GROUP BY DATE(timestamp)
		ORDER BY date ASC
	`, startDate).Scan(&volumeData)

	Success(c, gin.H{
		"days":    days,
		"start_date": startDate.Format("2006-01-02"),
		"data":    volumeData,
	})
}