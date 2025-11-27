package services

import (
	"math/rand"
	"time"
	"token-balance/internal/models"

	"gorm.io/gorm"
)

// StatsService 统计服务
type StatsService struct {
	db *gorm.DB
}

// NewStatsService 创建统计服务
func NewStatsService(db *gorm.DB) *StatsService {
	return &StatsService{
		db: db,
	}
}

// GetOverview 获取系统概览
func (ss *StatsService) GetOverview() (*StatsOverview, error) {
	var overview StatsOverview

	var totalUsers, activeUsers24h, transactions24h, totalTransactions int64

	// 获取总用户数
	ss.db.Model(&models.User{}).Count(&totalUsers)
	overview.TotalUsers = uint(totalUsers)

	// 获取总供应量（这里应该是合约的总供应量）
	ss.db.Model(&models.User{}).Select("COALESCE(SUM(balance), 0)").Row().Scan(&overview.TotalSupply)

	// 获取总积分
	ss.db.Model(&models.PointsRecord{}).Select("COALESCE(SUM(points), 0)").Row().Scan(&overview.TotalPoints)

	// 获取24小时活跃用户（简化处理）
	ss.db.Model(&models.UserDailySummary{}).
		Where("summary_date >= ?", time.Now().AddDate(0, 0, -1)).
		Count(&activeUsers24h)
	overview.ActiveUsers24h = uint(activeUsers24h)

	// 获取24小时交易数
	ss.db.Model(&models.UserBalanceHistory{}).
		Where("timestamp >= ?", time.Now().AddDate(0, 0, -1)).
		Count(&transactions24h)
	overview.Transactions24h = uint(transactions24h)

	// 获取总交易数
	ss.db.Model(&models.UserBalanceHistory{}).Count(&totalTransactions)
	overview.TotalTransactions = uint(totalTransactions)

	return &overview, nil
}

// GetDailyStats 获取每日统计
func (ss *StatsService) GetDailyStats(daysStr string) ([]models.DailyStats, error) {
	days := StringToInt(daysStr)

	var stats []models.DailyStats

	// 这里应该实现真实的每日统计查询
	// 暂时返回示例数据结构
	for i := 0; i < days; i++ {
		date := time.Now().AddDate(0, 0, -i)
		stat := models.DailyStats{
			Date:     date.Format("2006-01-02"),
			NewUsers: uint(rand.Intn(20)),
			Volume:   "0",
		}
		stats = append(stats, stat)
	}

	return stats, nil
}

// StatsOverview 系统统计概览
type StatsOverview struct {
	TotalUsers        uint    `json:"total_users"`
	TotalSupply       string  `json:"total_supply"`
	TotalPoints       float64 `json:"total_points"`
	ActiveUsers24h    uint    `json:"active_users_24h"`
	Transactions24h   uint    `json:"transactions_24h"`
	TotalTransactions uint    `json:"total_transactions"`
}
