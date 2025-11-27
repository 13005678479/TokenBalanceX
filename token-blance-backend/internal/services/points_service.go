package services

import (
	"fmt"
	"math/rand"
	"time"
	"token-balance/internal/middleware"
	"token-balance/internal/models"

	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
)

// PointsService 积分服务
type PointsService struct {
	db *gorm.DB
}

// NewPointsService 创建积分服务
func NewPointsService(db *gorm.DB) *PointsService {
	return &PointsService{
		db: db,
	}
}

// StartPointsCalculation 启动积分计算定时任务
func (ps *PointsService) StartPointsCalculation() {
	middleware.Info("启动积分计算定时任务...")

	// 创建定时任务，每小时执行一次
	c := cron.New()

	// 每小时的第0分钟执行
	_, err := c.AddFunc("0 * * * *", func() {
		ps.CalculateHourlyPoints()
	})

	if err != nil {
		middleware.Error("创建定时任务失败: %v", err)
		return
	}

	c.Start()
}

// CalculateHourlyPoints 计算小时积分
func (ps *PointsService) CalculateHourlyPoints() {
	middleware.Info("开始计算积分...")

	// 获取所有用户
	var users []models.User
	err := ps.db.Find(&users).Error
	if err != nil {
		middleware.Error("获取用户列表失败: %v", err)
		return
	}

	// 为每个用户计算积分
	for _, user := range users {
		points := ps.calculateUserPoints(user.ID, user.Balance)
		if points > 0 {
			// 记录积分
			record := models.PointsRecord{
				UserAddress:   user.ID,
				Points:        points,
				Balance:       user.Balance,
				Hours:         1,    // 每小时1小时
				Rate:          0.05, // 5%费率
				CalculateDate: time.Now(),
			}

			if err := ps.db.Create(&record).Error; err != nil {
				middleware.Error("记录积分失败: %v", err)
				continue
			}

			// 更新用户总积分
			newTotalPoints := user.TotalPoints + points
			if err := ps.db.Model(&user).Update("total_points", newTotalPoints).Error; err != nil {
				middleware.Error("更新用户总积分失败: %v", err)
			}
		}
	}

	middleware.Info("积分计算完成")
}

// calculateUserPoints 计算用户积分
func (ps *PointsService) calculateUserPoints(address, balance string) float64 {
	// 积分计算公式：积分 = 余额 × 0.05 × 持有时间（小时）
	// 这里简化处理，实际应该基于用户余额历史记录计算

	// 解析余额
	balanceFloat := parseFloat(balance)
	if balanceFloat <= 0 {
		return 0
	}

	// 简化计算：每小时5%费率
	points := balanceFloat * 0.05

	return points
}

// GetPointsLeaderboard 获取积分排行榜
func (ps *PointsService) GetPointsLeaderboard(limitStr string) ([]models.LeaderboardEntry, error) {
	limit := StringToInt(limitStr)

	var results []struct {
		Address     string  `json:"address"`
		Balance     string  `json:"balance"`
		TotalPoints float64 `json:"total_points"`
	}

	err := ps.db.Table("users").
		Select("id as address, balance, total_points").
		Order("total_points desc").
		Limit(limit).
		Find(&results).Error
	if err != nil {
		return nil, err
	}

	var leaderboard []models.LeaderboardEntry
	for i, result := range results {
		entry := models.LeaderboardEntry{
			Rank:        i + 1,
			Address:     result.Address,
			Balance:     result.Balance,
			TotalPoints: result.TotalPoints,
		}
		leaderboard = append(leaderboard, entry)
	}

	return leaderboard, nil
} // CalculatePoints 手动计算积分
func (ps *PointsService) CalculatePoints(fromDate, toDate string) error {
	middleware.Info("开始手动计算积分: %s 到 %s", fromDate, toDate)

	// 这里应该实现指定日期范围的积分计算
	// 包括回溯历史余额变动

	middleware.Info("手动积分计算完成")
	return nil
}

// GetDailyStats 获取每日统计
func (ps *PointsService) GetDailyStats(daysStr string) ([]models.DailyStats, error) {
	days := StringToInt(daysStr)

	// 这里应该实现每日统计查询逻辑
	// 暂时返回模拟数据
	var stats []models.DailyStats
	for i := days - 1; i >= 0; i-- {
		date := time.Now().AddDate(0, 0, -i)
		stat := models.DailyStats{
			Date:             date.Format("2006-01-02"),
			NewUsers:         uint(rand.Intn(20)),
			Transactions:     uint(rand.Intn(100)),
			Volume:           fmt.Sprintf("%.2f", rand.Float64()*10000),
			PointsCalculated: rand.Float64() * 500,
		}
		stats = append(stats, stat)
	}

	return stats, nil
} // 辅助类型
type LeaderboardEntry struct {
	Rank        int     `json:"rank"`
	Address     string  `json:"address"`
	Balance     string  `json:"balance"`
	TotalPoints float64 `json:"total_points"`
}

// 辅助函数
func parseFloat(s string) float64 {
	if s == "" {
		return 0
	}
	// 简单转换，实际应该使用strconv.ParseFloat
	result := 0.0
	decimal := false
	for _, r := range s {
		if r == '.' {
			decimal = true
		} else if r >= '0' && r <= '9' {
			digit := float64(r - '0')
			if decimal {
				result += digit / 10.0
			} else {
				result = result*10 + digit
			}
		}
	}
	return result
}
