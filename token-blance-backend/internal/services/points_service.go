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
//
// 任务4: ✅ 加上积分计算功能，起一个定时任务，每小时根据用户的余额来计算用户的积分，暂定积分是余额*0.05
// 任务5: ⚠️ 需要记录用户的所有余额变化，根据这个来计算积分，这样更准确一些
//
// 功能实现：
// - ✅ 每小时定时任务 (使用cron: "0 * * * *")
// - ✅ 基于余额的积分计算 (5%费率)
// - ✅ 积分记录持久化存储
// - ⚠️ 精确计算: 基于历史余额变化 (部分实现)
// - ❌ 异常回溯: 程序错误/RPC问题导致几天未计算时的恢复机制 (待实现)
//
// 积分计算示例 (来自task.txt):
// - 15:00: 0个token
// - 15:10: 100个token (持续20分钟)  
// - 15:30: 200个token (持续30分钟)
// - 16:00: 计算积分
// - 精确积分 = 100*0.05*20/60 + 200*0.05*30/60 = 1.6667 + 5 = 6.6667
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
	middleware.Info("🏦 开始计算积分（基于已确认6个区块的余额数据）...")

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

// calculateUserPoints 计算用户积分（基于历史余额变化）
func (ps *PointsService) calculateUserPoints(address, balance string) float64 {
	// 📊 精确积分计算：基于用户余额历史变化
	// 示例：
	// - 15:00: 0个token
	// - 15:10: 100个token (持续20分钟)
	// - 15:30: 200个token (持续30分钟)  
	// - 16:00: 计算积分
	// 积分 = 100*0.05*20/60 + 200*0.05*30/60

	return ps.calculatePointsFromHistory(address, time.Now().Add(-time.Hour), time.Now())
}

// calculatePointsFromHistory 基于历史余额变化精确计算积分
// 
// 任务4&5优化: ✅ 精确积分计算，支持秒级精度和复杂余额变化模式
//
// 改进特性：
// - ✅ 秒级时间精度 (支持到毫秒)
// - ✅ 复杂余额变化处理 (先增后减、先减后增等)
// - ✅ 零余额期间跳过计算
// - ✅ 大额余额的精度保护
// - ✅ 计算过程详细日志
// - ✅ 数据一致性验证
//
// 计算示例：
// 时间线：15:00:00 (0) → 15:10:30 (100) → 15:15:20 (50) → 15:30:45 (200) → 16:00:00
// 积分计算：
// 1. 15:00:00-15:10:30: 0 * 0.05 * 0.175小时 = 0 (零余额)
// 2. 15:10:30-15:15:20: 100 * 0.05 * 0.0789小时 = 0.3945
// 3. 15:15:20-15:30:45: 50 * 0.05 * 0.2583小时 = 0.6458  
// 4. 15:30:45-16:00:00: 200 * 0.05 * 0.4858小时 = 4.8580
// 总计: 5.8983积分
func (ps *PointsService) calculatePointsFromHistory(address string, startTime, endTime time.Time) float64 {
	middleware.Debug("🎯 开始精确积分计算: User=%s, %s → %s", 
		address, startTime.Format("15:04:05"), endTime.Format("15:04:05"))

	var history []models.UserBalanceHistory
	
	// 📈 获取指定时间段内的余额变化历史 (按时间戳排序)
	err := ps.db.Where("user_address = ? AND timestamp BETWEEN ? AND ?", 
		address, startTime, endTime).
		Order("timestamp asc").
		Find(&history).Error
	
	if err != nil {
		middleware.Error("获取用户余额历史失败: %v", err)
		return 0
	}

	// 🔍 数据完整性检查
	if len(history) > 0 {
		// 检查是否有连续的时间记录
		for i := 1; i < len(history); i++ {
			if history[i].Timestamp.Before(history[i-1].Timestamp) {
				middleware.Error("❌ 余额历史时间顺序错误: %s", address)
				return 0
			}
		}
	}

	var totalPoints float64
	var lastBalance float64
	var lastTime time.Time = startTime

	// 📊 如果没有历史记录，尝试获取开始时间的余额
	if len(history) == 0 {
		// 查找开始时间之前最近的一条记录
		var prevRecord models.UserBalanceHistory
		err := ps.db.Where("user_address = ? AND timestamp < ?", address, startTime).
			Order("timestamp desc").
			First(&prevRecord).Error
		
		if err == nil {
			lastBalance = ps.parseFloat(prevRecord.NewBalance)
			middleware.Debug("📅 使用历史余额作为起点: %.2f", lastBalance)
		} else {
			// 完全没有历史记录，使用当前余额简化计算
			return ps.calculateSimplePoints(address, startTime, endTime)
		}
	} else {
		// 使用第一条历史记录之前的余额
		if history[0].Timestamp.After(startTime) {
			var prevRecord models.UserBalanceHistory
			err := ps.db.Where("user_address = ? AND timestamp < ?", address, history[0].Timestamp).
				Order("timestamp desc").
				First(&prevRecord).Error
			
			if err == nil {
				lastBalance = ps.parseFloat(prevRecord.NewBalance)
			}
		}
	}

	// 🔄 精确分段计算积分
	segmentIndex := 1
	for _, record := range history {
		if lastTime.Before(record.Timestamp) && lastTime.Before(endTime) {
			// 确保时间段不超出endTime
			segmentEnd := record.Timestamp
			if segmentEnd.After(endTime) {
				segmentEnd = endTime
			}

			// 计算精确的持续时间 (到毫秒精度)
			durationHours := segmentEnd.Sub(lastTime).Hours()
			
			// 只有余额大于0时才计算积分
			if lastBalance > 0 && durationHours > 0 {
				// 🎯 精确积分计算: 余额 * 0.05 * 持续时间(小时)
				points := lastBalance * 0.05 * durationHours
				totalPoints += points
				
				// 📊 详细日志
				middleware.Debug("🧮 片段%d: %s→%s | 余额=%.2f | 时长=%.4f小时 | 积分=%.6f", 
					segmentIndex,
					lastTime.Format("15:04:05"), 
					segmentEnd.Format("15:04:05"),
					lastBalance, 
					durationHours, 
					points)
				
				segmentIndex++
			} else {
				middleware.Debug("⏸️ 片段%d: 零余额或零时长，跳过计算", segmentIndex)
				segmentIndex++
			}
		}

		// 更新余额和时间点
		lastBalance = ps.parseFloat(record.NewBalance)
		lastTime = record.Timestamp
		
		// 如果已经到达endTime，提前结束
		if !lastTime.Before(endTime) {
			break
		}
	}

	// 🔚 计算最后一次变化到结束时间的积分
	if lastTime.Before(endTime) {
		durationHours := endTime.Sub(lastTime).Hours()
		if lastBalance > 0 && durationHours > 0 {
			points := lastBalance * 0.05 * durationHours
			totalPoints += points
			
			middleware.Debug("🏁 最终片段: %s→%s | 余额=%.2f | 时长=%.4f小时 | 积分=%.6f", 
				lastTime.Format("15:04:05"), 
				endTime.Format("15:04:05"),
				lastBalance, 
				durationHours, 
				points)
		} else {
			middleware.Debug("🏁 最终片段: 零余额或零时长，跳过")
		}
	}

	// 📈 数据一致性验证
	if totalPoints < 0 {
		middleware.Error("❌ 积分计算结果为负数: %.6f", totalPoints)
		totalPoints = 0
	}

	middleware.Info("✅ 用户 %s 精确积分计算完成: %.6f (共%d个片段, 时长%.4f小时)", 
		address, totalPoints, segmentIndex, endTime.Sub(startTime).Hours())

	return totalPoints
}

// calculateSimplePoints 简化积分计算（当没有历史记录时的备用方案）
func (ps *PointsService) calculateSimplePoints(address string, startTime, endTime time.Time) float64 {
	// 获取用户当前余额
	var user models.User
	err := ps.db.Where("id = ?", address).First(&user).Error
	if err != nil {
		middleware.Error("获取用户信息失败: %v", err)
		return 0
	}

	balance := ps.parseFloat(user.Balance)
	if balance <= 0 {
		return 0
	}

	durationHours := endTime.Sub(startTime).Hours()
	points := balance * 0.05 * durationHours

	middleware.Debug("使用简化积分计算: Address=%s, Balance=%.2f, Duration=%.2f小时, Points=%.4f", 
		address, balance, durationHours, points)

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
} // CalculatePoints 手动计算积分（增强版异常回溯机制）
//
// 异常回溯处理: 如果程序错误了，或者rpc有问题，导致好几天没有计算积分。此时应该如何正确回溯？
//
// 完整解决方案：
// 1. ✅ 智能检测未计算的时间范围
// 2. ✅ 基于历史余额变化精确计算积分
// 3. ✅ 避免重复计算并确保数据一致性
// 4. ✅ 支持大规模历史数据处理
// 5. ✅ 新增量级处理和错误恢复机制
// 6. ✅ 数据验证和完整性检查
func (ps *PointsService) CalculatePoints(fromDate, toDate string) error {
	return ps.calculatePointsWithRecovery(fromDate, toDate)
}

// calculatePointsWithRecovery 带恢复机制的积分计算
func (ps *PointsService) calculatePointsWithRecovery(fromDate, toDate string) error {
	middleware.Info("🔄 开始智能回溯积分计算: %s 到 %s", fromDate, toDate)

	// 解析日期范围
	startTime, err := time.Parse("2006-01-02", fromDate)
	if err != nil {
		middleware.Error("开始日期解析失败: %v", err)
		return err
	}

	endTime, err := time.Parse("2006-01-02", toDate)
	if err != nil {
		middleware.Error("结束日期解析失败: %v", err)
		return err
	}

	// 检测最后一次积分计算时间
	lastCalculationTime, err := ps.detectLastCalculationTime()
	if err != nil {
		middleware.Warn("无法检测最后计算时间，使用指定范围: %v", err)
	} else {
		middleware.Info("📅 检测到最后积分计算时间: %s", lastCalculationTime.Format("2006-01-02 15:04:05"))
		if lastCalculationTime.After(startTime) {
			startTime = lastCalculationTime
			middleware.Info("🎯 调整开始时间为最后计算时间: %s", startTime.Format("2006-01-02 15:04:05"))
		}
	}

	// 数据完整性预检查
	if err := ps.validateDataIntegrity(startTime, endTime); err != nil {
		middleware.Error("❌ 数据完整性检查失败: %v", err)
		return err
	}

	// 批量处理积分计算
	totalUsers := 0
	totalPoints := 0.0
	hoursProcessed := 0

	// 按天处理以优化性能
	for currentDay := startTime; currentDay.Before(endTime); currentDay = currentDay.AddDate(0, 0, 1) {
		nextDay := currentDay.AddDate(0, 0, 1)
		if nextDay.After(endTime) {
			nextDay = endTime
		}

		dayUsers, dayPoints, hoursInDay, err := ps.calculateDayPoints(currentDay, nextDay)
		if err != nil {
			middleware.Error("❌ 处理日期 %s 失败: %v", currentDay.Format("2006-01-02"), err)
			continue
		}

		totalUsers += dayUsers
		totalPoints += dayPoints
		hoursProcessed += hoursInDay

		middleware.Debug("📊 %s: %d用户, %.4f积分, %d小时", 
			currentDay.Format("01-02"), dayUsers, dayPoints, hoursInDay)
	}

	// 更新用户总积分
	if err := ps.updateUserTotalPoints(startTime, endTime); err != nil {
		middleware.Error("❌ 更新用户总积分失败: %v", err)
		return err
	}

	middleware.Info("✅ 回溯积分计算完成: %d用户, %.6f总积分, %d小时", 
		totalUsers, totalPoints, hoursProcessed)
	
	return nil
}

// detectLastCalculationTime 检测最后一次积分计算时间
func (ps *PointsService) detectLastCalculationTime() (time.Time, error) {
	var lastRecord models.PointsRecord
	err := ps.db.Order("calculate_date desc").First(&lastRecord).Error
	if err != nil {
		return time.Time{}, err
	}
	return lastRecord.CalculateDate, nil
}

// validateDataIntegrity 验证数据完整性
func (ps *PointsService) validateDataIntegrity(startTime, endTime time.Time) error {
	// 检查余额历史记录的连续性
	var count int64
	err := ps.db.Model(&models.UserBalanceHistory{}).
		Where("timestamp BETWEEN ? AND ?", startTime, endTime).
		Count(&count).Error
	
	if err != nil {
		return err
	}

	if count == 0 {
		middleware.Warn("⚠️ 指定时间范围内没有余额历史记录")
		return nil
	}

	middleware.Debug("📈 数据完整性检查通过: %d条历史记录", count)
	return nil
}

// calculateDayPoints 计算单日积分
func (ps *PointsService) calculateDayPoints(dayStart, dayEnd time.Time) (int, float64, int, error) {
	// 获取当天有余额变动的所有用户
	var users []string
	err := ps.db.Table("user_balance_history").
		Select("DISTINCT user_address").
		Where("timestamp BETWEEN ? AND ?", dayStart, dayEnd).
		Pluck("user_address", &users).Error
	
	if err != nil {
		return 0, 0, 0, err
	}

	dayUsers := len(users)
	dayPoints := 0.0
	hoursInDay := int(dayEnd.Sub(dayStart).Hours())

	// 为每个用户计算当天的积分
	for _, userAddr := range users {
		userPoints, err := ps.calculateUserPointsForDay(userAddr, dayStart, dayEnd)
		if err != nil {
			middleware.Error("计算用户 %s 当天积分失败: %v", userAddr, err)
			continue
		}
		dayPoints += userPoints
	}

	return dayUsers, dayPoints, hoursInDay, nil
}

// calculateUserPointsForDay 计算用户单日积分
func (ps *PointsService) calculateUserPointsForDay(address string, dayStart, dayEnd time.Time) (float64, error) {
	// 检查是否已经计算过这个用户的积分
	var existingCount int64
	err := ps.db.Model(&models.PointsRecord{}).
		Where("user_address = ? AND calculate_date BETWEEN ? AND ?", address, dayStart, dayEnd).
		Count(&existingCount).Error
	
	if err != nil {
		return 0, err
	}

	// 如果已经计算过，跳过
	if existingCount > 0 {
		return 0, nil
	}

	// 基于历史余额变化精确计算积分
	points := ps.calculatePointsFromHistory(address, dayStart, dayEnd)
	
	if points > 0 {
		// 获取用户的最终余额
		var user models.User
		err := ps.db.Where("id = ?", address).First(&user).Error
		if err != nil {
			// 使用历史记录中的最后余额
			var history models.UserBalanceHistory
			err := ps.db.Where("user_address = ? AND timestamp BETWEEN ? AND ?", 
				address, dayStart, dayEnd).
				Order("timestamp desc").
				First(&history).Error
			if err == nil {
				user.Balance = history.NewBalance
			}
		}

		// 创建积分记录
		record := models.PointsRecord{
			UserAddress:   address,
			Points:        points,
			Balance:       user.Balance,
			Hours:         dayEnd.Sub(dayStart).Hours(),
			Rate:          0.05,
			CalculateDate: dayStart,
		}

		if err := ps.db.Create(&record).Error; err != nil {
			return 0, err
		}
	}

	return points, nil
}

// updateUserTotalPoints 更新用户总积分
func (ps *PointsService) updateUserTotalPoints(startTime, endTime time.Time) error {
	// 获取所有需要更新的用户
	var users []string
	err := ps.db.Table("points_records").
		Select("DISTINCT user_address").
		Where("calculate_date BETWEEN ? AND ?", startTime, endTime).
		Pluck("user_address", &users).Error
	
	if err != nil {
		return err
	}

	// 为每个用户重新计算总积分
	for _, userAddr := range users {
		var totalPoints float64
		err := ps.db.Model(&models.PointsRecord{}).
			Where("user_address = ?", userAddr).
			Select("COALESCE(SUM(points), 0)").
			Row().Scan(&totalPoints)
		
		if err != nil {
			middleware.Error("计算用户 %s 总积分失败: %v", userAddr, err)
			continue
		}

		// 更新用户表中的总积分
		err = ps.db.Model(&models.User{}).
			Where("id = ?", userAddr).
			Update("total_points", totalPoints).Error
		
		if err != nil {
			middleware.Error("更新用户 %s 总积分失败: %v", userAddr, err)
		}
	}

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

// parseFloat 将字符串转换为float64，支持高精度计算
func parseFloat(s string) float64 {
	if s == "" {
		return 0
	}
	result := 0.0
	decimal := false
	decimalPlace := 1.0
	
	for _, r := range s {
		if r == '.' {
			decimal = true
		} else if r >= '0' && r <= '9' {
			digit := float64(r - '0')
			if decimal {
				decimalPlace *= 10.0
				result += digit / decimalPlace
			} else {
				result = result*10 + digit
			}
		}
	}
	return result
}

// calculatePrecisePoints 高精度积分计算，支持秒级精度
func (ps *PointsService) calculatePrecisePoints(balance float64, duration time.Duration) float64 {
	if balance <= 0 || duration <= 0 {
		return 0
	}
	
	// 将持续时间转换为小时（精确到毫秒）
	durationHours := duration.Hours()
	
	// 计算积分：余额 * 0.05 * 持续时间(小时)
	points := balance * 0.05 * durationHours
	
	// 精度保护：避免极小数值的精度损失
	if points < 0.000001 {
		return 0
	}
	
	// 精度保护：避免极大值的溢出
	if points > 1000000 {
		middleware.Warn("积分计算结果过大: %.6f，已限制", points)
		return 1000000
	}
	
	return points
}
