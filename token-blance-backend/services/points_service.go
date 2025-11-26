package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"token-balance-backend/config"
	"token-balance-backend/database"

	"github.com/robfig/cron/v3"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type PointsService struct {
	db       *gorm.DB
	cfg      *config.Config
	cron     *cron.Cron
	ctx      context.Context
	cancel   context.CancelFunc
}

func NewPointsService(db *gorm.DB, cfg *config.Config) *PointsService {
	ctx, cancel := context.WithCancel(context.Background())
	
	return &PointsService{
		db:     db,
		cfg:    cfg,
		cron:   cron.New(cron.WithSeconds()),
		ctx:    ctx,
		cancel: cancel,
	}
}

func (s *PointsService) StartPointsCalculation() {
	log.Println("启动积分计算定时任务...")

	// 添加定时任务
	_, err := s.cron.AddFunc(s.cfg.PointsCronSchedule, s.calculateHourlyPoints)
	if err != nil {
		log.Printf("添加定时任务失败: %v", err)
		return
	}

	// 立即执行一次计算
	go s.calculateHourlyPoints()

	// 启动定时器
	s.cron.Start()
	log.Printf("积分计算定时任务已启动，执行周期: %s", s.cfg.PointsCronSchedule)
}

func (s *PointsService) calculateHourlyPoints() {
	log.Println("开始执行积分计算...")

	startTime := time.Now()
	
	// 计算上一小时的积分
	endTime := startTime.Truncate(time.Hour)
	startTimeOfPeriod := endTime.Add(-time.Hour)

	log.Printf("计算积分时间段: %s - %s", startTimeOfPeriod.Format("2006-01-02 15:04:05"), endTime.Format("2006-01-02 15:04:05"))

	// 获取所有用户
	var users []database.User
	if err := s.db.Find(&users).Error; err != nil {
		log.Printf("获取用户列表失败: %v", err)
		return
	}

	totalPointsGenerated := decimal.Zero
	usersProcessed := 0

	for _, user := range users {
		points, err := s.calculateUserPoints(user.Address, startTimeOfPeriod, endTime)
		if err != nil {
			log.Printf("计算用户 %s 积分失败: %v", user.Address, err)
			continue
		}

		if points.GreaterThan(decimal.Zero) {
			// 保存积分记录
			pointsRecord := database.PointsRecord{
				UserID:      user.ID,
				Address:     user.Address,
				Points:      points,
				Balance:     user.Balance,
				Duration:    int(endTime.Sub(startTimeOfPeriod).Seconds()),
				Rate:        s.cfg.PointsCalculationRate,
				StartTime:   startTimeOfPeriod,
				EndTime:     endTime,
				Period:      startTimeOfPeriod.Format("2006010215"), // YYYYMMDDHH
				ChainID:     s.cfg.Ethereum.ChainID,
			}

			if err := s.db.Create(&pointsRecord).Error; err != nil {
				log.Printf("保存积分记录失败: %v", err)
				continue
			}

			// 更新用户总积分
			user.TotalPoints = user.TotalPoints.Add(points)
			if err := s.db.Save(&user).Error; err != nil {
				log.Printf("更新用户总积分失败: %v", err)
				continue
			}

			totalPointsGenerated = totalPointsGenerated.Add(points)
			usersProcessed++

			log.Printf("用户 %s 获得积分: %s", user.Address, points.String())
		}
	}

	// 更新每日汇总
	s.updateDailySummary(endTime, totalPointsGenerated, usersProcessed)

	// 更新系统统计
	s.updateSystemStats(endTime, totalPointsGenerated, usersProcessed)

	elapsed := time.Since(startTime)
	log.Printf("积分计算完成，处理用户数: %d，生成积分: %s，耗时: %v", usersProcessed, totalPointsGenerated.String(), elapsed)
}

func (s *PointsService) calculateUserPoints(address string, startTime, endTime time.Time) (decimal.Decimal, error) {
	// 获取用户在时间段内的余额变动历史
	var histories []database.UserBalanceHistory
	query := s.db.Where("address = ? AND timestamp >= ? AND timestamp < ?", address, startTime, endTime).
		Order("timestamp ASC").
		Find(&histories)

	if query.Error != nil {
		return decimal.Zero, fmt.Errorf("查询余额历史失败: %w", query.Error)
	}

	if len(histories) == 0 {
		// 没有余额变动，使用当前余额计算
		var user database.User
		if err := s.db.Where("address = ?", address).First(&user).Error; err != nil {
			return decimal.Zero, err
		}

		// 如果用户余额为0，不产生积分
		if user.Balance.LessThanOrEqual(decimal.Zero) {
			return decimal.Zero, nil
		}

		// 使用整个时间段的余额计算积分
		duration := endTime.Sub(startTime)
		hours := decimal.NewFromFloat(duration.Hours())
		points := user.Balance.Mul(s.cfg.PointsCalculationRate).Mul(hours)

		return points, nil
	}

	// 计算基于余额变动的积分
	totalPoints := decimal.Zero
	
	// 获取初始余额
	var initialBalance decimal.Decimal
	if len(histories) > 0 && histories[0].BalanceBefore.GreaterThan(decimal.Zero) {
		initialBalance = histories[0].BalanceBefore
	} else {
		// 查询此时间点之前的余额
		var prevHistory database.UserBalanceHistory
		if err := s.db.Where("address = ? AND timestamp < ?", address, startTime).
			Order("timestamp DESC").
			First(&prevHistory).Error; err == nil {
			initialBalance = prevHistory.BalanceAfter
		} else {
			initialBalance = decimal.Zero
		}
	}

	// 处理每个时间段
	periodStart := startTime
	
	for i, history := range histories {
		// 计算从periodStart到当前事件时间的积分
		periodEnd := history.Timestamp
		if periodEnd.After(endTime) {
			periodEnd = endTime
		}

		if initialBalance.GreaterThan(decimal.Zero) && periodEnd.After(periodStart) {
			duration := periodEnd.Sub(periodStart)
			hours := decimal.NewFromFloat(duration.Hours())
			points := initialBalance.Mul(s.cfg.PointsCalculationRate).Mul(hours)
			totalPoints = totalPoints.Add(points)
		}

		// 更新下一阶段的初始余额
		if history.EventType == "transfer" && history.Address == address {
			// 这是转出事件
			initialBalance = history.BalanceAfter
		} else if history.EventType != "transfer_receive" {
			// mint 或 burn 事件
			initialBalance = history.BalanceAfter
		}

		periodStart = periodEnd

		// 如果这是最后一个事件并且还有剩余时间
		if i == len(histories)-1 && periodStart.Before(endTime) {
			if initialBalance.GreaterThan(decimal.Zero) {
				duration := endTime.Sub(periodStart)
				hours := decimal.NewFromFloat(duration.Hours())
				points := initialBalance.Mul(s.cfg.PointsCalculationRate).Mul(hours)
				totalPoints = totalPoints.Add(points)
			}
		}
	}

	return totalPoints, nil
}

func (s *PointsService) updateDailySummary(date time.Time, pointsGenerated decimal.Decimal, usersProcessed int) {
	targetDate := date.Truncate(time.Hour * 24)
	
	var summary database.UserDailySummary
	if err := s.db.Where("date = ? AND chain_id = ?", targetDate, s.cfg.Ethereum.ChainID).First(&summary).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 创建新的每日汇总
			summary = database.UserDailySummary{
				Date:           targetDate,
				PointsEarned:   pointsGenerated,
				ChainID:        s.cfg.Ethereum.ChainID,
			}
			s.db.Create(&summary)
		} else {
			log.Printf("查询每日汇总失败: %v", err)
			return
		}
	} else {
		// 更新现有汇总
		summary.PointsEarned = summary.PointsEarned.Add(pointsGenerated)
		s.db.Save(&summary)
	}
}

func (s *PointsService) updateSystemStats(date time.Time, pointsGenerated decimal.Decimal, usersProcessed int) {
	targetDate := date.Truncate(time.Hour * 24)
	
	var stats database.SystemStats
	if err := s.db.Where("date = ? AND chain_id = ?", targetDate, s.cfg.Ethereum.ChainID).First(&stats).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 创建新的系统统计
			stats = database.SystemStats{
				Date:            targetDate,
				ActiveUsers:     usersProcessed,
				PointsGenerated: pointsGenerated,
				ChainID:         s.cfg.Ethereum.ChainID,
			}
			s.db.Create(&stats)
		} else {
			log.Printf("查询系统统计失败: %v", err)
			return
		}
	} else {
		// 更新现有统计
		stats.ActiveUsers = usersProcessed
		stats.PointsGenerated = stats.PointsGenerated.Add(pointsGenerated)
		s.db.Save(&stats)
	}
}

// RecalculateMissingPoints 回溯计算缺失的积分
func (s *PointsService) RecalculateMissingPoints(fromDate, toDate time.Time) error {
	log.Printf("开始回溯计算积分: %s - %s", fromDate.Format("2006-01-02"), toDate.Format("2006-01-02"))

	current := fromDate.Truncate(time.Hour * 24)
	end := toDate.Truncate(time.Hour * 24)

	for current.Before(end) || current.Equal(end) {
		hourStart := current
		hourEnd := current.Add(time.Hour)

		// 检查这个小时是否已经计算过积分
		var existingRecord database.PointsRecord
		err := s.db.Where("start_time = ? AND end_time = ? AND chain_id = ?", hourStart, hourEnd, s.cfg.Ethereum.ChainID).First(&existingRecord).Error
		if err == gorm.ErrRecordNotFound {
			// 没有计算过，执行计算
			s.calculatePointsForHour(hourStart, hourEnd)
		}

		current = hourStart.Add(time.Hour)
	}

	log.Println("回溯积分计算完成")
	return nil
}

func (s *PointsService) calculatePointsForHour(startTime, endTime time.Time) {
	// 获取所有用户
	var users []database.User
	if err := s.db.Find(&users).Error; err != nil {
		log.Printf("获取用户列表失败: %v", err)
		return
	}

	for _, user := range users {
		points, err := s.calculateUserPoints(user.Address, startTime, endTime)
		if err != nil {
			log.Printf("计算用户 %s 积分失败: %v", user.Address, err)
			continue
		}

		if points.GreaterThan(decimal.Zero) {
			// 保存积分记录
			pointsRecord := database.PointsRecord{
				UserID:      user.ID,
				Address:     user.Address,
				Points:      points,
				Balance:     user.Balance,
				Duration:    int(endTime.Sub(startTime).Seconds()),
				Rate:        s.cfg.PointsCalculationRate,
				StartTime:   startTime,
				EndTime:     endTime,
				Period:      startTime.Format("2006010215"),
				ChainID:     s.cfg.Ethereum.ChainID,
			}

			if err := s.db.Create(&pointsRecord).Error; err != nil {
				log.Printf("保存积分记录失败: %v", err)
				continue
			}

			// 更新用户总积分
			user.TotalPoints = user.TotalPoints.Add(points)
			if err := s.db.Save(&user).Error; err != nil {
				log.Printf("更新用户总积分失败: %v", err)
			}
		}
	}
}

func (s *PointsService) Stop() {
	if s.cron != nil {
		s.cron.Stop()
	}
	if s.cancel != nil {
		s.cancel()
	}
	log.Println("积分计算服务已停止")
}

// CalculateUserPointsFromTo 为指定用户计算指定时间段的积分
func (s *PointsService) CalculateUserPointsFromTo(address string, startTime, endTime time.Time) error {
	log.Printf("计算用户 %s 积分: %s - %s", address, startTime.Format("2006-01-02 15:04:05"), endTime.Format("2006-01-02 15:04:05"))

	points, err := s.calculateUserPoints(address, startTime, endTime)
	if err != nil {
		return fmt.Errorf("计算用户积分失败: %w", err)
	}

	if points.GreaterThan(decimal.Zero) {
		// 获取用户信息
		var user database.User
		if err := s.db.Where("address = ?", address).First(&user).Error; err != nil {
			return fmt.Errorf("获取用户信息失败: %w", err)
		}

		// 保存积分记录
		pointsRecord := database.PointsRecord{
			UserID:      user.ID,
			Address:     address,
			Points:      points,
			Balance:     user.Balance,
			Duration:    int(endTime.Sub(startTime).Seconds()),
			Rate:        s.cfg.PointsCalculationRate,
			StartTime:   startTime,
			EndTime:     endTime,
			Period:      startTime.Format("2006010215"),
			ChainID:     s.cfg.Ethereum.ChainID,
		}

		if err := s.db.Create(&pointsRecord).Error; err != nil {
			return fmt.Errorf("保存积分记录失败: %w", err)
		}

		// 更新用户总积分
		user.TotalPoints = user.TotalPoints.Add(points)
		if err := s.db.Save(&user).Error; err != nil {
			return fmt.Errorf("更新用户总积分失败: %w", err)
		}

		log.Printf("用户 %s 积分计算完成: %s", address, points.String())
	}

	return nil
}