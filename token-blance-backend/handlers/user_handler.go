package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetUserBalance 获取用户余额
func (h *Handler) GetUserBalance(c *gin.Context) {
	address := c.Param("address")
	if address == "" {
		BadRequest(c, "用户地址不能为空")
		return
	}

	user, err := h.userService.GetUserBalance(address)
	if err != nil {
		InternalError(c, "获取用户余额失败: "+err.Error())
		return
	}

	Success(c, gin.H{
		"address":      user.Address,
		"balance":      user.Balance.String(),
		"total_points": user.TotalPoints.String(),
		"created_at":   user.CreatedAt,
		"updated_at":   user.UpdatedAt,
	})
}

// GetUserBalanceHistory 获取用户余额变动历史
func (h *Handler) GetUserBalanceHistory(c *gin.Context) {
	address := c.Param("address")
	if address == "" {
		BadRequest(c, "用户地址不能为空")
		return
	}

	page, size, err := GetPaginationParams(c)
	if err != nil {
		BadRequest(c, "分页参数错误: "+err.Error())
		return
	}

	histories, total, err := h.userService.GetUserBalanceHistory(address, page, size)
	if err != nil {
		InternalError(c, "获取用户余额历史失败: "+err.Error())
		return
	}

	// 格式化历史记录
	var formattedHistories []gin.H
	for _, history := range histories {
		formattedHistories = append(formattedHistories, gin.H{
			"id":             history.ID,
			"address":        history.Address,
			"from_address":   history.FromAddress,
			"to_address":     history.ToAddress,
			"amount":         history.Amount.String(),
			"balance_before": history.BalanceBefore.String(),
			"balance_after":  history.BalanceAfter.String(),
			"event_type":     history.EventType,
			"tx_hash":        history.TxHash,
			"block_number":   history.BlockNumber,
			"log_index":      history.LogIndex,
			"block_hash":     history.BlockHash,
			"timestamp":      history.Timestamp,
			"chain_id":       history.ChainID,
			"created_at":     history.CreatedAt,
		})
	}

	SuccessWithPagination(c, formattedHistories, total, page, size)
}

// GetUserPoints 获取用户积分信息
func (h *Handler) GetUserPoints(c *gin.Context) {
	address := c.Param("address")
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
		InternalError(c, "获取用户积分信息失败: "+err.Error())
		return
	}

	// 格式化积分记录
	var formattedRecords []gin.H
	for _, record := range pointsRecords {
		formattedRecords = append(formattedRecords, gin.H{
			"id":        record.ID,
			"address":   record.Address,
			"points":    record.Points.String(),
			"balance":   record.Balance.String(),
			"duration":  record.Duration,
			"rate":      record.Rate.String(),
			"start_time": record.StartTime,
			"end_time":  record.EndTime,
			"period":    record.Period,
			"chain_id":  record.ChainID,
			"created_at": record.CreatedAt,
		})
	}

	// 格式化用户信息
	userInfo := gin.H{
		"address":       user.Address,
		"balance":       user.Balance.String(),
		"total_points":  user.TotalPoints.String(),
		"created_at":    user.CreatedAt,
		"updated_at":    user.UpdatedAt,
	}

	Success(c, gin.H{
		"user":           userInfo,
		"points_records": formattedRecords,
		"total":          total,
		"page":           page,
		"size":           size,
	})
}

// GetUsersList 获取用户列表
func (h *Handler) GetUsersList(c *gin.Context) {
	page, size, err := GetPaginationParams(c)
	if err != nil {
		BadRequest(c, "分页参数错误: "+err.Error())
		return
	}

	order := c.DefaultQuery("order", "balance_desc") // balance_desc, balance_asc, points_desc, points_asc

	users, total, err := h.userService.GetUsersByBalance(page, size, order)
	if err != nil {
		InternalError(c, "获取用户列表失败: "+err.Error())
		return
	}

	// 格式化用户列表
	var formattedUsers []gin.H
	for _, user := range users {
		formattedUsers = append(formattedUsers, gin.H{
			"id":           user.ID,
			"address":      user.Address,
			"balance":      user.Balance.String(),
			"total_points": user.TotalPoints.String(),
			"created_at":   user.CreatedAt,
			"updated_at":   user.UpdatedAt,
		})
	}

	SuccessWithPagination(c, formattedUsers, total, page, size)
}

// GetUserDailySummary 获取用户每日汇总
func (h *Handler) GetUserDailySummary(c *gin.Context) {
	address := c.Param("address")
	if address == "" {
		BadRequest(c, "用户地址不能为空")
		return
	}

	days := 7 // 默认7天
	if daysStr := c.Query("days"); daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 && d <= 365 {
			days = d
		}
	}

	summaries, err := h.userService.GetUserDailySummary(address, days)
	if err != nil {
		InternalError(c, "获取用户每日汇总失败: "+err.Error())
		return
	}

	// 格式化汇总数据
	var formattedSummaries []gin.H
	for _, summary := range summaries {
		formattedSummaries = append(formattedSummaries, gin.H{
			"id":              summary.ID,
			"address":         summary.Address,
			"date":            summary.Date,
			"opening_balance": summary.OpeningBalance.String(),
			"closing_balance": summary.ClosingBalance.String(),
			"points_earned":   summary.PointsEarned.String(),
			"total_points":    summary.TotalPoints.String(),
			"transaction_count": summary.TransactionCount,
			"chain_id":        summary.ChainID,
			"created_at":      summary.CreatedAt,
			"updated_at":      summary.UpdatedAt,
		})
	}

	Success(c, gin.H{
		"address":  address,
		"days":     days,
		"summaries": formattedSummaries,
	})
}