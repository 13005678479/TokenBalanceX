package models

import (
	"time"
)

// PointsRecord 积分记录表
type PointsRecord struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserAddress    string    `gorm:"type:varchar(42);not null;index" json:"user_address"`
	Points         float64   `gorm:"type:decimal(20,8);not null" json:"points"`
	Balance        string    `gorm:"type:varchar(78);not null" json:"balance"`
	Hours          float64   `gorm:"type:decimal(10,4);not null" json:"hours"`
	Rate           float64   `gorm:"type:decimal(10,8);not null;default:0.05000000" json:"rate"`
	CalculateDate  time.Time `gorm:"not null;index" json:"calculate_date"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`

	// 关联
	User User `gorm:"foreignKey:UserAddress" json:"user,omitempty"`
}

// TableName 指定表名
func (PointsRecord) TableName() string {
	return "points_records"
}