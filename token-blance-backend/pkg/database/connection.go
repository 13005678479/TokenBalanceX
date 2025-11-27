package database

import (
	"token-balance/config"
	"token-balance/internal/middleware"
	"token-balance/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var db *gorm.DB

func InitDB() *gorm.DB {
	if db != nil {
		return db
	}

	middleware.Info("正在初始化数据库连接...")

	// 加载配置
	cfg := config.LoadConfig()

	// 构建数据库连接字符串
	dsn := cfg.Database.User + ":" + cfg.Database.Password +
		"@tcp(" + cfg.Database.Host + ":" + cfg.Database.Port + ")/" +
		cfg.Database.DBName + "?charset=utf8mb4&parseTime=True&loc=Local"

	middleware.Debug("数据库连接字符串: %s", dsn)

	var err error
	db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		middleware.Error("数据库连接失败: %v", err)
		panic(err)
	}

	middleware.Info("数据库连接成功")
	return db
}

// AutoMigrate 自动迁移数据库表
func AutoMigrate(db *gorm.DB) {
	middleware.Info("开始执行数据库迁移...")

	err := db.AutoMigrate(
		&models.User{},
		&models.UserBalanceHistory{},
		&models.PointsRecord{},
		&models.EventLog{},
		&models.UserDailySummary{},
		&models.SystemStats{},
	)

	if err != nil {
		middleware.Error("数据库迁移失败: %v", err)
		panic(err)
	}

	middleware.Info("数据库迁移完成")
}

// GetDB 获取数据库实例
func GetDB() *gorm.DB {
	return db
}
