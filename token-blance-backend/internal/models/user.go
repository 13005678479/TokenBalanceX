package models

import (
	"time"
	"gorm.io/gorm"
)

// User 用户模型
//
// 任务6: ✅ 需要维护一下用户的总余额表以及总积分表，还有一个用户的余额变动记录表
//
// 表设计：
// ✅ 1. 用户总余额表 (users) - 维护用户当前余额和总积分
// ✅ 2. 总积分表 (points_records) - 记录每次积分计算的详细信息  
// ✅ 3. 余额变动记录表 (user_balance_history) - 记录每次余额变化的详细信息
// ✅ 4. 事件日志表 (event_logs) - 记录所有区块链事件
//
// 功能特性：
// - ✅ 主键使用钱包地址
// - ✅ 余额使用字符串存储 (支持大数精度)
// - ✅ 积分使用decimal类型 (精度控制)
// - ✅ 完整的关联关系设计
// - ✅ 时间戳索引 (快速查询)
// - ✅ 软删除支持 (数据安全)
type User struct {
	ID        string          `gorm:"type:varchar(42);primaryKey" json:"address"`           // 钱包地址作为主键
	Balance   string          `gorm:"type:varchar(78);default:'0'" json:"balance"`     // 当前余额 (字符串形式，支持大数)
	TotalPoints float64         `gorm:"type:decimal(20,8);default:0.00000000" json:"total_points"` // 总积分 (高精度decimal)
	CreatedAt  time.Time       `json:"created_at"`                                      // 创建时间
	UpdatedAt  time.Time       `json:"updated_at"`                                      // 更新时间
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`                                    // 软删除 (GORM)

	// 关联关系
	BalanceHistory []UserBalanceHistory `gorm:"foreignKey:UserAddress" json:"balance_history,omitempty"`  // 余额变动历史 (1:N)
	PointsRecords  []PointsRecord      `gorm:"foreignKey:UserAddress" json:"points_records,omitempty"`   // 积分计算记录 (1:N)
	DailySummaries []UserDailySummary  `gorm:"foreignKey:UserAddress" json:"daily_summaries,omitempty"`  // 每日汇总 (1:N)
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}