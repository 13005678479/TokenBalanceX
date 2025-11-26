package services

import (
	"fmt"
	"time"

	"token-balance-backend/database"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{
		db: db,
	}
}

// GetUserBalance 获取用户当前余额
func (s *UserService) GetUserBalance(address string) (*database.User, error) {
	var user database.User
	if err := s.db.Where("address = ?", address).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 用户不存在，返回零余额用户
			return &database.User{
				Address:     address,
				Balance:     decimal.Zero,
				TotalPoints: decimal.Zero,
			}, nil
		}
		return nil, fmt.Errorf("查询用户余额失败: %w", err)
	}

	return &user, nil
}

// GetUserBalanceHistory 获取用户余额变动历史
func (s *UserService) GetUserBalanceHistory(address string, page, pageSize int) ([]database.UserBalanceHistory, int64, error) {
	var histories []database.UserBalanceHistory
	var total int64

	// 查询总数
	if err := s.db.Model(&database.UserBalanceHistory{}).Where("address = ?", address).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("查询余额历史总数失败: %w", err)
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := s.db.Where("address = ?", address).
		Order("timestamp DESC").
		Limit(pageSize).
		Offset(offset).
		Find(&histories).Error; err != nil {
		return nil, 0, fmt.Errorf("查询余额历史失败: %w", err)
	}

	return histories, total, nil
}

// GetUserPoints 获取用户积分信息
func (s *UserService) GetUserPoints(address string, page, pageSize int) (*database.User, []database.PointsRecord, int64, error) {
	var user database.User
	var pointsRecords []database.PointsRecord
	var total int64

	// 获取用户信息
	if err := s.db.Where("address = ?", address).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return &database.User{
				Address:     address,
				Balance:     decimal.Zero,
				TotalPoints: decimal.Zero,
			}, pointsRecords, 0, nil
		}
		return nil, nil, 0, fmt.Errorf("查询用户信息失败: %w", err)
	}

	// 查询积分记录总数
	if err := s.db.Model(&database.PointsRecord{}).Where("address = ?", address).Count(&total).Error; err != nil {
		return nil, nil, 0, fmt.Errorf("查询积分记录总数失败: %w", err)
	}

	// 分页查询积分记录
	offset := (page - 1) * pageSize
	if err := s.db.Where("address = ?", address).
		Order("start_time DESC").
		Limit(pageSize).
		Offset(offset).
		Find(&pointsRecords).Error; err != nil {
		return nil, nil, 0, fmt.Errorf("查询积分记录失败: %w", err)
	}

	return &user, pointsRecords, total, nil
}

// GetUsersByBalance 获取按余额排序的用户列表
func (s *UserService) GetUsersByBalance(page, pageSize int, order string) ([]database.User, int64, error) {
	var users []database.User
	var total int64

	// 查询总数
	if err := s.db.Model(&database.User{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("查询用户总数失败: %w", err)
	}

	// 排序字段验证
	orderBy := "balance DESC"
	if order == "asc" {
		orderBy = "balance ASC"
	} else if order == "points_desc" {
		orderBy = "total_points DESC"
	} else if order == "points_asc" {
		orderBy = "total_points ASC"
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := s.db.Order(orderBy).
		Limit(pageSize).
		Offset(offset).
		Find(&users).Error; err != nil {
		return nil, 0, fmt.Errorf("查询用户列表失败: %w", err)
	}

	return users, total, nil
}

// GetPointsLeaderboard 获取积分排行榜
func (s *UserService) GetPointsLeaderboard(page, pageSize int) ([]database.User, int64, error) {
	var users []database.User
	var total int64

	// 查询总数
	if err := s.db.Model(&database.User{}).Where("total_points > 0").Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("查询用户总数失败: %w", err)
	}

	// 分页查询积分排行榜
	offset := (page - 1) * pageSize
	if err := s.db.Where("total_points > 0").
		Order("total_points DESC, updated_at ASC").
		Limit(pageSize).
		Offset(offset).
		Find(&users).Error; err != nil {
		return nil, 0, fmt.Errorf("查询积分排行榜失败: %w", err)
	}

	return users, total, nil
}

// GetUserDailySummary 获取用户每日汇总
func (s *UserService) GetUserDailySummary(address string, days int) ([]database.UserDailySummary, error) {
	var summaries []database.UserDailySummary

	// 计算开始日期
	startDate := time.Now().AddDate(0, 0, -days).Truncate(24 * time.Hour)

	// 查询每日汇总
	if err := s.db.Where("address = ? AND date >= ?", address, startDate).
		Order("date ASC").
		Find(&summaries).Error; err != nil {
		return nil, fmt.Errorf("查询用户每日汇总失败: %w", err)
	}

	return summaries, nil
}

// GetSystemStats 获取系统统计信息
func (s *UserService) GetSystemStats() (*database.SystemStats, error) {
	var stats database.SystemStats
	
	// 获取今天的统计数据
	today := time.Now().Truncate(24 * time.Hour)
	if err := s.db.Where("date = ?", today).First(&stats).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 如果今天还没有统计数据，返回空的统计信息
			return &database.SystemStats{
				Date:            today,
				TotalUsers:      0,
				ActiveUsers:     0,
				TotalBalance:    decimal.Zero,
				TotalSupply:     decimal.Zero,
				TotalPoints:     decimal.Zero,
				PointsGenerated: decimal.Zero,
				TransactionCount: 0,
				MintCount:       0,
				BurnCount:       0,
				TransferCount:   0,
			}, nil
		}
		return nil, fmt.Errorf("查询系统统计失败: %w", err)
	}

	return &stats, nil
}

// GetDailyStats 获取每日统计数据
func (s *UserService) GetDailyStats(days int) ([]database.SystemStats, error) {
	var stats []database.SystemStats

	// 计算开始日期
	startDate := time.Now().AddDate(0, 0, -days).Truncate(24 * time.Hour)

	// 查询每日统计
	if err := s.db.Where("date >= ?", startDate).
		Order("date ASC").
		Find(&stats).Error; err != nil {
		return nil, fmt.Errorf("查询每日统计失败: %w", err)
	}

	return stats, nil
}

// UpdateUserBalance 手动更新用户余额（用于数据修复）
func (s *UserService) UpdateUserBalance(address string, balance decimal.Decimal) error {
	var user database.User
	if err := s.db.Where("address = ?", address).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 创建新用户
			user = database.User{
				Address:     address,
				Balance:     balance,
				TotalPoints: decimal.Zero,
			}
			return s.db.Create(&user).Error
		}
		return fmt.Errorf("查询用户失败: %w", err)
	}

	// 更新余额
	user.Balance = balance
	return s.db.Save(&user).Error
}

// CalculateTotalSupply 计算总供应量
func (s *UserService) CalculateTotalSupply() (decimal.Decimal, error) {
	var totalSupply decimal.Decimal
	
	// 使用SUM函数计算所有用户余额的总和
	if err := s.db.Model(&database.User{}).
		Select("COALESCE(SUM(balance), 0)").
		Scan(&totalSupply).Error; err != nil {
		return decimal.Zero, fmt.Errorf("计算总供应量失败: %w", err)
	}

	return totalSupply, nil
}

// CalculateTotalPoints 计算总积分
func (s *UserService) CalculateTotalPoints() (decimal.Decimal, error) {
	var totalPoints decimal.Decimal
	
	// 使用SUM函数计算所有用户积分的总和
	if err := s.db.Model(&database.User{}).
		Select("COALESCE(SUM(total_points), 0)").
		Scan(&totalPoints).Error; err != nil {
		return decimal.Zero, fmt.Errorf("计算总积分失败: %w", err)
	}

	return totalPoints, nil
}

// GetActiveUserCount 获取活跃用户数（有余额的用户）
func (s *UserService) GetActiveUserCount() (int64, error) {
	var count int64
	
	// 计算有余额的用户数量
	if err := s.db.Model(&database.User{}).
		Where("balance > 0").
		Count(&count).Error; err != nil {
		return 0, fmt.Errorf("计算活跃用户数失败: %w", err)
	}

	return count, nil
}