package models

import (
	"time"
)

// UserDailySummary 用户每日汇总表
type UserDailySummary struct {
	ID               uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserAddress      string    `gorm:"type:varchar(42);not null;index" json:"user_address"`
	SummaryDate      time.Time `gorm:"type:date;not null;index" json:"summary_date"`
	OpeningBalance   string    `gorm:"type:varchar(78);not null" json:"opening_balance"`
	ClosingBalance   string    `gorm:"type:varchar(78);not null" json:"closing_balance"`
	VolumeMinted    string    `gorm:"type:varchar(78);not null;default:'0'" json:"volume_minted"`
	VolumeBurned     string    `gorm:"type:varchar(78);not null;default:'0'" json:"volume_burned"`
	TransferIn       string    `gorm:"type:varchar(78);not null;default:'0'" json:"transfer_in"`
	TransferOut      string    `gorm:"type:varchar(78);not null;default:'0'" json:"transfer_out"`
	PointsEarned     float64   `gorm:"type:decimal(20,8);not null;default:0.00000000" json:"points_earned"`
	AverageBalance   string    `gorm:"type:varchar(78);not null" json:"average_balance"`
	HoursHeld       float64   `gorm:"type:decimal(10,4);not null;default:0.0000" json:"hours_held"`
	CreatedAt        time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// 关联
	User User `gorm:"foreignKey:UserAddress" json:"user,omitempty"`
}

// TableName 指定表名
func (UserDailySummary) TableName() string {
	return "user_daily_summary"
}