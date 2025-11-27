package models

import (
	"time"
)

// SystemStats 系统统计表
type SystemStats struct {
	ID                uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	TotalUsers        uint      `gorm:"type:int unsigned;default:0" json:"total_users"`
	TotalSupply       string    `gorm:"type:varchar(78);default:'0'" json:"total_supply"`
	TotalPoints       float64   `gorm:"type:decimal(20,8);default:0.00000000" json:"total_points"`
	ActiveUsers24h    uint      `gorm:"type:int unsigned;default:0" json:"active_users_24h"`
	Transactions24h  uint      `gorm:"type:int unsigned;default:0" json:"transactions_24h"`
	TotalTransactions uint      `gorm:"type:int unsigned;default:0" json:"total_transactions"`
	StatisticsDate   time.Time `gorm:"type:date;index" json:"statistics_date"`
	CreatedAt        time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName 指定表名
func (SystemStats) TableName() string {
	return "system_stats"
}