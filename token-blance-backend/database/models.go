package database

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// User 用户信息表
type User struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Address   string         `json:"address" gorm:"type:varchar(42);uniqueIndex;not null"`
	Balance   decimal.Decimal `json:"balance" gorm:"type:decimal(36,18);default:0"`
	TotalPoints decimal.Decimal `json:"total_points" gorm:"type:decimal(36,18);default:0"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// UserBalanceHistory 用户余额变动记录表
type UserBalanceHistory struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"user_id" gorm:"not null;index"`
	User        User           `json:"user" gorm:"foreignKey:UserID"`
	Address     string         `json:"address" gorm:"type:varchar(42);not null;index"`
	FromAddress string         `json:"from_address" gorm:"type:varchar(42)"`
	ToAddress   string         `json:"to_address" gorm:"type:varchar(42)"`
	Amount      decimal.Decimal `json:"amount" gorm:"type:decimal(36,18);not null"`
	BalanceBefore decimal.Decimal `json:"balance_before" gorm:"type:decimal(36,18);not null"`
	BalanceAfter  decimal.Decimal `json:"balance_after" gorm:"type:decimal(36,18);not null"`
	EventType   string         `json:"event_type" gorm:"type:enum('mint','burn','transfer');not null;index"`
	TxHash      string         `json:"tx_hash" gorm:"type:varchar(66);uniqueIndex;not null"`
	BlockNumber uint64         `json:"block_number" gorm:"not null;index"`
	LogIndex    uint           `json:"log_index" gorm:"not null"`
	BlockHash   string         `json:"block_hash" gorm:"type:varchar(66)"`
	Timestamp   time.Time      `json:"timestamp" gorm:"not null;index"`
	ChainID     int64          `json:"chain_id" gorm:"not null;index"`
	CreatedAt   time.Time      `json:"created_at"`
}

// PointsRecord 积分记录表
type PointsRecord struct {
	ID          uint            `json:"id" gorm:"primaryKey"`
	UserID      uint            `json:"user_id" gorm:"not null;index"`
	User        User            `json:"user" gorm:"foreignKey:UserID"`
	Address     string          `json:"address" gorm:"type:varchar(42);not null;index"`
	Points      decimal.Decimal `json:"points" gorm:"type:decimal(36,18);not null"`
	Balance     decimal.Decimal `json:"balance" gorm:"type:decimal(36,18);not null"`
	Duration    int             `json:"duration" gorm:"comment:持有时间（秒）"`
	Rate        decimal.Decimal `json:"rate" gorm:"type:decimal(10,8);not null;comment:积分费率"`
	StartTime   time.Time       `json:"start_time" gorm:"not null;index"`
	EndTime     time.Time       `json:"end_time" gorm:"not null;index"`
	Period      string          `json:"period" gorm:"type:varchar(20);not null;comment:计算周期"`
	ChainID     int64           `json:"chain_id" gorm:"not null;index"`
	CreatedAt   time.Time       `json:"created_at"`
}

// UserDailySummary 用户每日汇总表
type UserDailySummary struct {
	ID            uint            `json:"id" gorm:"primaryKey"`
	UserID        uint            `json:"user_id" gorm:"not null;index"`
	User          User            `json:"user" gorm:"foreignKey:UserID"`
	Address       string          `json:"address" gorm:"type:varchar(42);not null;index"`
	Date          time.Time       `json:"date" gorm:"type:date;not null;index"`
	OpeningBalance decimal.Decimal `json:"opening_balance" gorm:"type:decimal(36,18);default:0"`
	ClosingBalance decimal.Decimal `json:"closing_balance" gorm:"type:decimal(36,18);default:0"`
	PointsEarned  decimal.Decimal `json:"points_earned" gorm:"type:decimal(36,18);default:0"`
	TotalPoints   decimal.Decimal `json:"total_points" gorm:"type:decimal(36,18);default:0"`
	TransactionCount int         `json:"transaction_count" gorm:"default:0"`
	ChainID       int64          `json:"chain_id" gorm:"not null;index"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

// EventLog 事件日志表
type EventLog struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	TxHash      string    `json:"tx_hash" gorm:"type:varchar(66);uniqueIndex;not null"`
	BlockNumber uint64    `json:"block_number" gorm:"not null;index"`
	LogIndex    uint      `json:"log_index" gorm:"not null"`
	BlockHash   string    `json:"block_hash" gorm:"type:varchar(66)"`
	Address     string    `json:"address" gorm:"type:varchar(42);not null"`
	EventName   string    `json:"event_name" gorm:"type:varchar(50);not null;index"`
	Data        string    `json:"data" gorm:"type:text"`
	Topics      string    `json:"topics" gorm:"type:text"`
	Timestamp   time.Time `json:"timestamp" gorm:"not null;index"`
	IsProcessed bool      `json:"is_processed" gorm:"default:false;index"`
	ProcessedAt *time.Time `json:"processed_at"`
	ChainID     int64     `json:"chain_id" gorm:"not null;index"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// SystemStats 系统统计表
type SystemStats struct {
	ID              uint            `json:"id" gorm:"primaryKey"`
	Date            time.Time       `json:"date" gorm:"type:date;not null;uniqueIndex"`
	TotalUsers      int             `json:"total_users" gorm:"default:0"`
	ActiveUsers     int             `json:"active_users" gorm:"default:0"`
	TotalBalance    decimal.Decimal `json:"total_balance" gorm:"type:decimal(36,18);default:0"`
	TotalSupply     decimal.Decimal `json:"total_supply" gorm:"type:decimal(36,18);default:0"`
	TotalPoints     decimal.Decimal `json:"total_points" gorm:"type:decimal(36,18);default:0"`
	PointsGenerated decimal.Decimal `json:"points_generated" gorm:"type:decimal(36,18);default:0"`
	TransactionCount int            `json:"transaction_count" gorm:"default:0"`
	MintCount       int             `json:"mint_count" gorm:"default:0"`
	BurnCount       int             `json:"burn_count" gorm:"default:0"`
	TransferCount   int             `json:"transfer_count" gorm:"default:0"`
	ChainID         int64           `json:"chain_id" gorm:"not null;index"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

// TableName 设置表名
func (User) TableName() string {
	return "users"
}

func (UserBalanceHistory) TableName() string {
	return "user_balance_history"
}

func (PointsRecord) TableName() string {
	return "points_records"
}

func (UserDailySummary) TableName() string {
	return "user_daily_summary"
}

func (EventLog) TableName() string {
	return "event_logs"
}

func (SystemStats) TableName() string {
	return "system_stats"
}