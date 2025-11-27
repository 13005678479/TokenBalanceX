package database

import (
	"fmt"
	"log"

	"token-balance/config"
	"token-balance/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitDBWithConfig 使用配置初始化数据库连接
func InitDBWithConfig(cfg *config.Config) (*gorm.DB, error) {
	// 配置日志级别
	var logLevel logger.LogLevel
	switch cfg.LogLevel {
	case "silent":
		logLevel = logger.Silent
	case "error":
		logLevel = logger.Error
	case "warn":
		logLevel = logger.Warn
	case "info":
		logLevel = logger.Info
	default:
		logLevel = logger.Info
	}

	// 配置GORM
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	}

	// 连接数据库
	db, err := gorm.Open(mysql.Open(cfg.GetDBDSN()), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("连接数据库失败: %w", err)
	}

	// 获取底层的sqlDB对象
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("获取数据库实例失败: %w", err)
	}

	// 设置连接池
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	log.Println("数据库连接成功")
	return db, nil
}

// AutoMigrateWithConfig 自动迁移数据库表
func AutoMigrateWithConfig(db *gorm.DB) error {
	// 需要迁移的所有模型
	modelList := []interface{}{
		&models.User{},
		&models.UserBalanceHistory{},
		&models.PointsRecord{},
		&models.UserDailySummary{},
		&models.EventLog{},
		&models.SystemStats{},
	}

	// 执行迁移
	for _, model := range modelList {
		if err := db.AutoMigrate(model); err != nil {
			return fmt.Errorf("迁移表 %T 失败: %w", model, err)
		}
		log.Printf("表 %T 迁移成功", model)
	}

	// 创建索引
	if err := createIndexes(db); err != nil {
		return fmt.Errorf("创建索引失败: %w", err)
	}

	log.Println("数据库迁移完成")
	return nil
}

// createIndexes 创建必要的索引
func createIndexes(db *gorm.DB) error {
	// 用户表索引
	if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_users_address ON users(address)").Error; err != nil {
		log.Printf("创建用户地址索引失败: %v", err)
	}

	// 余额历史表索引
	indexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_user_balance_history_user_timestamp ON user_balance_history(user_id, timestamp)",
		"CREATE INDEX IF NOT EXISTS idx_user_balance_history_address_timestamp ON user_balance_history(address, timestamp)",
		"CREATE INDEX IF NOT EXISTS idx_user_balance_history_event_type ON user_balance_history(event_type)",
		"CREATE INDEX IF NOT EXISTS idx_user_balance_history_tx_hash ON user_balance_history(tx_hash)",
		"CREATE INDEX IF NOT EXISTS idx_user_balance_history_block_number ON user_balance_history(block_number)",
	}

	for _, index := range indexes {
		if err := db.Exec(index).Error; err != nil {
			log.Printf("创建索引失败: %s, 错误: %v", index, err)
		}
	}

	// 积分记录表索引
	pointsIndexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_points_records_user_period ON points_records(user_id, period)",
		"CREATE INDEX IF NOT EXISTS idx_points_records_address_period ON points_records(address, period)",
		"CREATE INDEX IF NOT EXISTS idx_points_records_start_end_time ON points_records(start_time, end_time)",
	}

	for _, index := range pointsIndexes {
		if err := db.Exec(index).Error; err != nil {
			log.Printf("创建积分索引失败: %s, 错误: %v", index, err)
		}
	}

	// 每日汇总表索引
	summaryIndexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_user_daily_summary_user_date ON user_daily_summary(user_id, date)",
		"CREATE INDEX IF NOT EXISTS idx_user_daily_summary_address_date ON user_daily_summary(address, date)",
	}

	for _, index := range summaryIndexes {
		if err := db.Exec(index).Error; err != nil {
			log.Printf("创建汇总索引失败: %s, 错误: %v", index, err)
		}
	}

	// 事件日志表索引
	eventIndexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_event_logs_processed ON event_logs(is_processed)",
		"CREATE INDEX IF NOT EXISTS idx_event_logs_event_name ON event_logs(event_name)",
		"CREATE INDEX IF NOT EXISTS idx_event_logs_timestamp ON event_logs(timestamp)",
		"CREATE INDEX IF NOT EXISTS idx_event_logs_block_number ON event_logs(block_number)",
	}

	for _, index := range eventIndexes {
		if err := db.Exec(index).Error; err != nil {
			log.Printf("创建事件索引失败: %s, 错误: %v", index, err)
		}
	}

	// 系统统计表索引
	statsIndexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_system_stats_date ON system_stats(date)",
		"CREATE INDEX IF NOT EXISTS idx_system_stats_chain_id ON system_stats(chain_id)",
	}

	for _, index := range statsIndexes {
		if err := db.Exec(index).Error; err != nil {
			log.Printf("创建统计索引失败: %s, 错误: %v", index, err)
		}
	}

	return nil
}