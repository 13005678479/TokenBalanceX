package models

import (
	"time"
)

// UserBalanceHistory 用户余额变动记录表
type UserBalanceHistory struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserAddress    string    `gorm:"type:varchar(42);not null;index" json:"user_address"`
	OldBalance     string    `gorm:"type:varchar(78);not null" json:"old_balance"`
	NewBalance     string    `gorm:"type:varchar(78);not null" json:"new_balance"`
	ChangeAmount   string    `gorm:"type:varchar(78);not null" json:"change_amount"`
	ChangeType     string    `gorm:"type:enum('mint','burn','transfer_in','transfer_out');not null" json:"change_type"`
	TxHash         string    `gorm:"type:varchar(66);not null;uniqueIndex" json:"tx_hash"`
	BlockNumber    uint64    `gorm:"not null;index" json:"block_number"`
	Timestamp      time.Time `gorm:"not null;index" json:"timestamp"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`

	// 关联
	User User `gorm:"foreignKey:UserAddress" json:"user,omitempty"`
}

// TableName 指定表名
func (UserBalanceHistory) TableName() string {
	return "user_balance_history"
}