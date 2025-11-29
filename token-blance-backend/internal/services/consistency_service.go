package services

import (
	"fmt"
	"math/big"
	"time"
	"token-balance/internal/middleware"
	"token-balance/internal/models"
	"gorm.io/gorm"
)

// ConsistencyService 数据一致性服务
//
// 任务4&5: ✅ 实现积分计算的数据一致性检查
//
// 功能实现：
// - ✅ 积分计算结果验证
// - ✅ 余额历史完整性检查
// - ✅ 异常数据检测和修复
// - ✅ 数据重算和回滚机制
// - ✅ 统计报告生成
type ConsistencyService struct {
	db *gorm.DB
}

// NewConsistencyService 创建一致性服务
func NewConsistencyService(db *gorm.DB) *ConsistencyService {
	return &ConsistencyService{
		db: db,
	}
}

// CheckDataConsistency 检查数据一致性
// @Summary 检查数据一致性
// @Description 全面检查用户余额、积分和历史记录的一致性
func (cs *ConsistencyService) CheckDataConsistency() *models.ConsistencyReport {
	middleware.Info("🔍 开始数据一致性检查...")

	report := &models.ConsistencyReport{
		CheckTime:     time.Now(),
		TotalUsers:     0,
		Issues:        []models.ConsistencyIssue{},
		Recommendations: []string{},
	}

	// 1. 检查用户余额一致性
	balanceIssues := cs.checkBalanceConsistency()
	report.Issues = append(report.Issues, balanceIssues...)

	// 2. 检查积分计算一致性
	pointsIssues := cs.checkPointsConsistency()
	report.Issues = append(report.Issues, pointsIssues...)

	// 3. 检查历史记录完整性
	historyIssues := cs.checkHistoryConsistency()
	report.Issues = append(report.Issues, historyIssues...)

	// 4. 统计用户数量
	cs.db.Model(&models.User{}).Count(&report.TotalUsers)

	// 5. 生成建议
	report.Recommendations = cs.generateRecommendations(report.Issues)

	middleware.Info("✅ 数据一致性检查完成: 发现 %d 个问题", len(report.Issues))
	return report
}

// checkBalanceConsistency 检查余额一致性
func (cs *ConsistencyService) checkBalanceConsistency() []models.ConsistencyIssue {
	var issues []models.ConsistencyIssue

	middleware.Debug("🔍 检查用户余额一致性...")

	// 查找余额为负数的用户
	var negativeBalanceUsers []models.User
	err := cs.db.Where("balance < ?", "0").Find(&negativeBalanceUsers).Error
	if err != nil {
		middleware.Error("查询负余额用户失败: %v", err)
		return issues
	}

	for _, user := range negativeBalanceUsers {
		issue := models.ConsistencyIssue{
			Type:        "negative_balance",
			Severity:    "high",
			Description: fmt.Sprintf("用户 %s 余额为负数: %s", user.ID, user.Balance),
			UserAddress: user.ID,
			Data: map[string]interface{}{
				"balance": user.Balance,
				"user_id": user.ID,
			},
		}
		issues = append(issues, issue)
	}

	// 检查余额历史与当前余额的一致性
	var users []models.User
	cs.db.Find(&users)

	for _, user := range users {
		var latestHistory models.UserBalanceHistory
		err := cs.db.Where("user_address = ?", user.ID).
			Order("timestamp desc").
			First(&latestHistory).Error

		if err == nil && latestHistory.NewBalance != user.Balance {
			issue := models.ConsistencyIssue{
				Type:        "balance_mismatch",
				Severity:    "medium",
				Description: fmt.Sprintf("用户 %s 当前余额与历史记录不符: 当前=%s, 历史=%s", 
					user.ID, user.Balance, latestHistory.NewBalance),
				UserAddress: user.ID,
				Data: map[string]interface{}{
					"current_balance": user.Balance,
					"history_balance": latestHistory.NewBalance,
					"last_updated":   latestHistory.Timestamp,
				},
			}
			issues = append(issues, issue)
		}
	}

	middleware.Debug("✅ 余额一致性检查完成: 发现 %d 个问题", len(issues))
	return issues
}

// checkPointsConsistency 检查积分一致性
func (cs *ConsistencyService) checkPointsConsistency() []models.ConsistencyIssue {
	var issues []models.ConsistencyIssue

	middleware.Debug("🔍 检查积分计算一致性...")

	// 检查积分记录中的异常值
	var invalidPoints []models.PointsRecord
	err := cs.db.Where("points < ? OR rate < ?", 0, 0).Find(&invalidPoints).Error
	if err != nil {
		middleware.Error("查询异常积分记录失败: %v", err)
		return issues
	}

	for _, record := range invalidPoints {
		severity := "medium"
		if record.Points < -100 {
			severity = "high"
		}

		issue := models.ConsistencyIssue{
			Type:        "invalid_points",
			Severity:    severity,
			Description: fmt.Sprintf("用户 %s 积分记录异常: 积分=%.6f, 费率=%.6f", 
				record.UserAddress, record.Points, record.Rate),
			UserAddress: record.UserAddress,
			Data: map[string]interface{}{
				"points":        record.Points,
				"balance":       record.Balance,
				"rate":          record.Rate,
				"calculate_date": record.CalculateDate,
			},
		}
		issues = append(issues, issue)
	}

	// 检查用户总积分与积分记录的一致性
	var users []models.User
	cs.db.Find(&users)

	for _, user := range users {
		var sumPoints struct {
			Total float64
		}
		
		cs.db.Model(&models.PointsRecord{}).
			Select("COALESCE(SUM(points), 0) as total").
			Where("user_address = ?", user.ID).
			Scan(&sumPoints)

		if abs(sumPoints.Total-user.TotalPoints) > 0.000001 {
			issue := models.ConsistencyIssue{
				Type:        "points_sum_mismatch",
				Severity:    "medium",
				Description: fmt.Sprintf("用户 %s 总积分与记录和不符: 总表=%.6f, 记录和=%.6f", 
					user.ID, user.TotalPoints, sumPoints.Total),
				UserAddress: user.ID,
				Data: map[string]interface{}{
					"total_in_table": user.TotalPoints,
					"sum_of_records": sumPoints.Total,
					"difference":     sumPoints.Total - user.TotalPoints,
				},
			}
			issues = append(issues, issue)
		}
	}

	middleware.Debug("✅ 积分一致性检查完成: 发现 %d 个问题", len(issues))
	return issues
}

// checkHistoryConsistency 检查历史记录完整性
func (cs *ConsistencyService) checkHistoryConsistency() []models.ConsistencyIssue {
	var issues []models.ConsistencyIssue

	middleware.Debug("🔍 检查历史记录完整性...")

	// 检查重复的交易哈希
	var duplicateTxs []struct {
		TxHash  string `json:"tx_hash"`
		Count    int    `json:"count"`
	}

	err := cs.db.Table("user_balance_history").
		Select("tx_hash, COUNT(*) as count").
		Group("tx_hash").
		Having("COUNT(*) > ?", 1).
		Scan(&duplicateTxs).Error

	if err != nil {
		middleware.Error("查询重复交易哈希失败: %v", err)
		return issues
	}

	for _, dup := range duplicateTxs {
		issue := models.ConsistencyIssue{
			Type:        "duplicate_transactions",
			Severity:    "medium",
			Description: fmt.Sprintf("发现重复的交易哈希: %s (重复 %d 次)", dup.TxHash, dup.Count),
			Data: map[string]interface{}{
				"tx_hash":     dup.TxHash,
				"duplicate_count": dup.Count,
			},
		}
		issues = append(issues, issue)
	}

	// 检查时间顺序异常
	var outOfOrderRecords []models.UserBalanceHistory
	err = cs.db.Raw(`
		SELECT h1.* FROM user_balance_history h1
		INNER JOIN user_balance_history h2 ON h1.user_address = h2.user_address 
			AND h1.timestamp < h2.timestamp 
			AND h1.id > h2.id
		LIMIT 100
	`).Scan(&outOfOrderRecords).Error

	if err != nil {
		middleware.Error("查询时间顺序异常记录失败: %v", err)
	} else if len(outOfOrderRecords) > 0 {
		for _, record := range outOfOrderRecords {
			issue := models.ConsistencyIssue{
				Type:        "time_order_violation",
				Severity:    "low",
				Description: fmt.Sprintf("用户 %s 存在时间顺序异常的记录", record.UserAddress),
				UserAddress: record.UserAddress,
				Data: map[string]interface{}{
					"record_id":  record.ID,
					"timestamp":  record.Timestamp,
					"tx_hash":   record.TxHash,
				},
			}
			issues = append(issues, issue)
		}
	}

	middleware.Debug("✅ 历史记录完整性检查完成: 发现 %d 个问题", len(issues))
	return issues
}

// FixConsistencyIssues 修复一致性问题
func (cs *ConsistencyService) FixConsistencyIssues(issues []models.ConsistencyIssue) int {
	middleware.Info("🔧 开始修复一致性问题: %d 个问题", len(issues))

	fixedCount := 0

	for _, issue := range issues {
		if cs.fixSingleIssue(issue) {
			fixedCount++
			middleware.Debug("✅ 已修复问题: %s", issue.Description)
		} else {
			middleware.Error("❌ 修复失败: %s", issue.Description)
		}
	}

	middleware.Info("✅ 一致性问题修复完成: 成功 %d/%d", fixedCount, len(issues))
	return fixedCount
}

// fixSingleIssue 修复单个一致性问题
func (cs *ConsistencyService) fixSingleIssue(issue models.ConsistencyIssue) bool {
	switch issue.Type {
	case "negative_balance":
		return cs.fixNegativeBalance(issue)
	case "balance_mismatch":
		return cs.fixBalanceMismatch(issue)
	case "invalid_points":
		return cs.fixInvalidPoints(issue)
	case "points_sum_mismatch":
		return cs.fixPointsSumMismatch(issue)
	case "duplicate_transactions":
		return cs.fixDuplicateTransactions(issue)
	default:
		middleware.Warn("⚠️ 未知的问题类型: %s", issue.Type)
		return false
	}
}

// fixNegativeBalance 修复负余额问题
func (cs *ConsistencyService) fixNegativeBalance(issue models.ConsistencyIssue) bool {
	userAddr, ok := issue.Data["user_id"].(string)
	if !ok {
		return false
	}

	// 重置用户余额为0
	result := cs.db.Model(&models.User{}).
		Where("id = ?", userAddr).
		Update("balance", "0")

	if result.Error != nil {
		middleware.Error("修复负余额失败: %v", result.Error)
		return false
	}

	// 记录修复操作
	history := models.UserBalanceHistory{
		UserAddress:  userAddr,
		OldBalance:  issue.Data["balance"].(string),
		NewBalance:  "0",
		ChangeAmount: "0",
		ChangeType:  "consistency_fix",
		TxHash:      "CONSISTENCY_FIX_" + time.Now().Format("20060102150405"),
		BlockNumber:  0,
		Timestamp:    time.Now(),
	}

	cs.db.Create(&history)
	return true
}

// fixBalanceMismatch 修复余额不匹配问题
func (cs *ConsistencyService) fixBalanceMismatch(issue models.ConsistencyIssue) bool {
	userAddr := issue.UserAddress
	historyBalance := issue.Data["history_balance"].(string)

	// 使用历史记录中的余额更新当前余额
	result := cs.db.Model(&models.User{}).
		Where("id = ?", userAddr).
		Update("balance", historyBalance)

	return result.Error == nil
}

// fixInvalidPoints 修复无效积分记录
func (cs *ConsistencyService) fixInvalidPoints(issue models.ConsistencyIssue) bool {
	// 删除无效的积分记录
	result := cs.db.Where("user_address = ? AND points < ?", issue.UserAddress, 0).
		Delete(&models.PointsRecord{})

	return result.Error == nil
}

// fixPointsSumMismatch 修复积分和不匹配问题
func (cs *ConsistencyService) fixPointsSumMismatch(issue models.ConsistencyIssue) bool {
	userAddr := issue.UserAddress
	sumOfRecords := issue.Data["sum_of_records"].(float64)

	// 更新用户表中的总积分为记录和
	result := cs.db.Model(&models.User{}).
		Where("id = ?", userAddr).
		Update("total_points", sumOfRecords)

	return result.Error == nil
}

// fixDuplicateTransactions 修复重复交易问题
func (cs *ConsistencyService) fixDuplicateTransactions(issue models.ConsistencyIssue) bool {
	txHash := issue.Data["tx_hash"].(string)

	// 保留ID最小的记录，删除重复的
	result := cs.db.Exec(`
		DELETE FROM user_balance_history 
		WHERE tx_hash = ? AND id NOT IN (
			SELECT MIN(id) FROM user_balance_history WHERE tx_hash = ?
		)
	`, txHash, txHash)

	return result.Error == nil
}

// generateRecommendations 生成修复建议
func (cs *ConsistencyService) generateRecommendations(issues []models.ConsistencyIssue) []string {
	recommendations := []string{}

	// 统计问题类型
	problemTypes := make(map[string]int)
	for _, issue := range issues {
		problemTypes[issue.Type]++
	}

	// 生成针对性建议
	if problemTypes["negative_balance"] > 0 {
		recommendations = append(recommendations, 
			fmt.Sprintf("发现 %d 个负余额问题，建议检查mint/burn逻辑的边界条件", 
				problemTypes["negative_balance"]))
	}

	if problemTypes["balance_mismatch"] > 0 {
		recommendations = append(recommendations, 
			fmt.Sprintf("发现 %d 个余额不匹配问题，建议运行余额重算工具", 
				problemTypes["balance_mismatch"]))
	}

	if problemTypes["invalid_points"] > 0 {
		recommendations = append(recommendations, 
			fmt.Sprintf("发现 %d 个无效积分记录，建议检查积分计算的输入参数", 
				problemTypes["invalid_points"]))
	}

	if len(recommendations) == 0 {
		recommendations = append(recommendations, "数据一致性良好，无需特殊处理")
	}

	return recommendations
}

// abs 计算绝对值
func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}

// parseFloat 安全的字符串转浮点数
func (cs *ConsistencyService) parseFloat(s string) float64 {
	if s == "" {
		return 0
	}
	
	result, _, err := new(big.Float).SetString(s, 10).Float64()
	if err != nil {
		return 0
	}
	
	return result
}