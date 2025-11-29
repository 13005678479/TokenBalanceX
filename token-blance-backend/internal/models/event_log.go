package models

import (
	"time"
)

// EventLog 事件日志表
type EventLog struct {
	ID              uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	EventName       string    `gorm:"type:varchar(50);not null;index" json:"event_name"`
	UserAddress     string    `gorm:"type:varchar(42);not null;index" json:"user_address"`
	ContractAddress string    `gorm:"type:varchar(42);not null;index" json:"contract_address"`
	Amount          string    `gorm:"type:varchar(78);not null" json:"amount"`
	TxHash          string    `gorm:"type:varchar(66);not null;uniqueIndex" json:"tx_hash"`
	BlockNumber     uint64    `gorm:"not null;index" json:"block_number"`
	Timestamp       time.Time `gorm:"not null;index" json:"timestamp"`
	Data            string    `gorm:"type:text" json:"data"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// TableName 指定表名
func (EventLog) TableName() string {
	return "event_logs"
}