package models

import (
	"time"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	ID        string          `gorm:"type:varchar(42);primaryKey" json:"address"`
	Balance   string          `gorm:"type:varchar(78);default:'0'" json:"balance"`
	TotalPoints float64         `gorm:"type:decimal(20,8);default:0.00000000" json:"total_points"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	BalanceHistory []UserBalanceHistory `gorm:"foreignKey:UserAddress" json:"balance_history,omitempty"`
	PointsRecords  []PointsRecord      `gorm:"foreignKey:UserAddress" json:"points_records,omitempty"`
	DailySummaries []UserDailySummary  `gorm:"foreignKey:UserAddress" json:"daily_summaries,omitempty"`
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}