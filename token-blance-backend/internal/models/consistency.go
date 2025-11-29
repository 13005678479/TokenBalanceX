package models

import (
	"time"
)

// ConsistencyReport 数据一致性报告
//
// 任务4&5: ✅ 积分计算的数据一致性检查报告模型
//
// 报告内容：
// - ✅ 问题列表和分类
// - ✅ 严重程度评估
// - ✅ 修复建议
// - ✅ 统计信息
type ConsistencyReport struct {
	CheckTime      time.Time              `json:"check_time"`
	TotalUsers     int64                  `json:"total_users"`
	Issues         []ConsistencyIssue      `json:"issues"`
	Recommendations []string               `json:"recommendations"`
}

// ConsistencyIssue 一致性问题
//
// 问题类型：
// - negative_balance: 负余额
// - balance_mismatch: 余额不匹配
// - invalid_points: 无效积分
// - points_sum_mismatch: 积分和不匹配
// - duplicate_transactions: 重复交易
// - time_order_violation: 时间顺序异常
type ConsistencyIssue struct {
	ID          uint                   `gorm:"primaryKey;autoIncrement" json:"id"`
	Type        string                 `json:"type"`        // 问题类型
	Severity    string                 `json:"severity"`    // 严重程度: low, medium, high, critical
	Description string                 `json:"description"` // 问题描述
	UserAddress string                 `json:"user_address"` // 相关用户地址
	Data        map[string]interface{}   `gorm:"type:json" json:"data"` // 详细数据
	Status      string                 `json:"status"` // 状态: open, fixing, fixed, ignored
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
	ResolvedAt  *time.Time             `json:"resolved_at,omitempty"`
}

// TableName 指定表名
func (ConsistencyReport) TableName() string {
	return "consistency_reports"
}

// TableName 指定表名
func (ConsistencyIssue) TableName() string {
	return "consistency_issues"
}

// UserDailySummary 用户每日汇总
//
// 任务4&5优化: ✅ 用户每日积分和余额汇总
//
// 用途：
// - 快速查询用户历史数据
// - 生成统计报表
// - 数据分析和趋势预测
type UserDailySummary struct {
	ID            uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserAddress    string    `gorm:"type:varchar(42);not null;index" json:"user_address"`
	Date          time.Time `gorm:"type:date;not null;index" json:"date"`
	OpeningBalance string    `gorm:"type:varchar(78);default:'0'" json:"opening_balance"` // 开盘余额
	ClosingBalance string    `gorm:"type:varchar(78);default:'0'" json:"closing_balance"` // 收盘余额
	NetChange     string    `gorm:"type:varchar(78);default:'0'" json:"net_change"`      // 净变化
	PointsEarned  float64   `gorm:"type:decimal(20,8);default:0.00000000" json:"points_earned"` // 当日积分
	Transactions  int       `gorm:"default:0" json:"transactions"`                             // 交易次数
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// 关联
	User User `gorm:"foreignKey:UserAddress" json:"user,omitempty"`
}

// TableName 指定表名
func (UserDailySummary) TableName() string {
	return "user_daily_summaries"
}

// SystemStats 系统统计
//
// 多链支持的系统统计
type SystemStats struct {
	ID              uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ChainName       string    `gorm:"type:varchar(50);not null;index" json:"chain_name"`     // 链名称
	TotalUsers      int64     `gorm:"default:0" json:"total_users"`                        // 总用户数
	ActiveUsers     int64     `gorm:"default:0" json:"active_users"`                       // 活跃用户数(24h)
	TotalBalance    string    `gorm:"type:varchar(78);default:'0'" json:"total_balance"`   // 总余额
	TotalPoints     float64   `gorm:"type:decimal(20,8);default:0.00000000" json:"total_points"` // 总积分
	Transactions24h int       `gorm:"default:0" json:"transactions_24h"`                   // 24小时交易数
	BlocksProcessed int64     `gorm:"default:0" json:"blocks_processed"`                   // 已处理区块数
	LastBlockTime  time.Time `json:"last_block_time"`                                 // 最后区块时间
	Status          string    `gorm:"type:varchar(20);default:'active'" json:"status"` // 状态
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName 指定表名
func (SystemStats) TableName() string {
	return "system_stats"
}

// ChainSyncStatus 链同步状态
//
// 多链同步状态跟踪
type ChainSyncStatus struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ChainName      string    `gorm:"type:varchar(50);not null;uniqueIndex" json:"chain_name"`
	ChainID        int64     `gorm:"not null" json:"chain_id"`
	LastBlock      uint64    `gorm:"default:0" json:"last_block"`           // 最后处理的区块
	LatestBlock    uint64    `gorm:"default:0" json:"latest_block"`         // 链上最新区块
	BlockDelay     uint64    `gorm:"default:0" json:"block_delay"`         // 区块延迟
	EventsLast24h  int       `gorm:"default:0" json:"events_last_24h"`    // 24小时事件数
	LastError      string    `gorm:"type:text" json:"last_error"`           // 最后错误信息
	LastErrorTime  *time.Time `json:"last_error_time,omitempty"`       // 最后错误时间
	Status         string    `gorm:"type:varchar(20);default:'syncing'" json:"status"` // 状态
	CreatedAt      time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName 指定表名
func (ChainSyncStatus) TableName() string {
	return "chain_sync_status"
}