# TokenBalanceX Backend

区块链代币余额追踪和积分计算系统的后端API服务。

## 技术栈

- **Go 1.21**
- **Gin Web Framework**
- **GORM + MySQL**
- **Swagger API文档**
- **JWT认证**
- **Cron定时任务**

## 项目结构

```
cmd/api/                 # 应用入口点
├── main.go             # 主函数
└── router.go            # 路由配置

internal/               # 内部代码
├── controllers/         # 控制器层
│   ├── user_controller.go      # 用户相关API
│   ├── event_controller.go     # 事件相关API
│   ├── points_controller.go    # 积分相关API
│   └── stats_controller.go     # 统计相关API
├── services/          # 服务层
│   ├── user_service.go        # 用户业务逻辑
│   ├── event_service.go       # 事件处理逻辑
│   ├── points_service.go     # 积分计算逻辑
│   └── stats_service.go      # 统计业务逻辑
├── middleware/         # 中间件
│   ├── logger.go        # 日志中间件
│   ├── auth.go          # 认证中间件
│   └── recovery.go      # 错误恢复中间件
└── models/           # 数据模型
    ├── user.go              # 用户模型
    ├── user_balance_history.go # 余额历史模型
    ├── points_record.go      # 积分记录模型
    ├── event_log.go         # 事件日志模型
    └── system_stats.go      # 系统统计模型

pkg/                   # 可导出的包
├── config/           # 配置管理
│   └── config.go       # 配置结构
├── database/          # 数据库
│   └── connection.go    # 数据库连接
└── utils/           # 工具函数

docs/                 # API文档
└── swagger.json      # Swagger规范
```

## 快速开始

### 1. 环境准备

确保系统已安装：
- Go 1.21+
- MySQL 8.0+

### 2. 数据库配置

创建MySQL数据库：
```sql
CREATE DATABASE token_balance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env` 并修改配置：
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=token_balance
```

### 4. 安装依赖

```bash
go mod download
```

### 5. 运行应用

```bash
# 开发模式
go run cmd/api/main.go

# 或者构建后运行
go build -o token-balance-server cmd/api/main.go
./token-balance-server
```

### 6. 访问Swagger文档

启动服务后访问：http://localhost:8080/swagger/index.html

## API接口

### 健康检查
- `GET /health` - 服务状态检查

### 用户管理
- `GET /api/v1/users/:address` - 获取用户余额
- `GET /api/v1/users/:address/history` - 获取用户余额历史
- `GET /api/v1/users/:address/points` - 获取用户积分记录

### 事件管理
- `GET /api/v1/events` - 获取最近事件
- `POST /api/v1/events/sync` - 手动同步事件

### 积分管理
- `GET /api/v1/points/leaderboard` - 获取积分排行榜
- `POST /api/v1/points/calculate` - 手动计算积分

### 统计信息
- `GET /api/v1/stats/overview` - 获取系统概览
- `GET /api/v1/stats/daily` - 获取每日统计

## 数据库表结构

### users 用户表
- `id`: 用户地址（主键）
- `balance`: 当前余额
- `total_points`: 总积分
- `created_at`: 创建时间
- `updated_at`: 更新时间
- `deleted_at`: 删除时间

### user_balance_history 余额变动历史
- `id`: 自增主键
- `user_address`: 用户地址
- `old_balance`: 变动前余额
- `new_balance`: 变动后余额
- `change_amount`: 变动数量
- `change_type`: 变动类型
- `tx_hash`: 交易哈希
- `block_number`: 区块号
- `timestamp`: 时间戳

### points_records 积分记录
- `id`: 自增主键
- `user_address`: 用户地址
- `points`: 获得积分
- `balance`: 当时余额
- `hours`: 持有时间
- `rate`: 积分费率
- `calculate_date`: 计算日期

### event_logs 事件日志
- `id`: 自增主键
- `event_name`: 事件名称
- `user_address`: 用户地址
- `amount`: 数量
- `tx_hash`: 交易哈希
- `block_number`: 区块号
- `timestamp`: 时间戳

### user_daily_summary 每日汇总
- `id`: 自增主键
- `user_address`: 用户地址
- `summary_date`: 汇总日期
- `opening_balance`: 开盘余额
- `closing_balance`: 收盘余额
- `volume_minted`: 铸造总量
- `volume_burned`: 销毁总量
- `transfer_in`: 转入总量
- `transfer_out`: 转出总量
- `points_earned`: 获得积分
- `average_balance`: 平均余额
- `hours_held`: 持有时间

### system_stats 系统统计
- `id`: 自增主键
- `total_users`: 总用户数
- `total_supply`: 总供应量
- `total_points`: 总积分
- `active_users_24h`: 24小时活跃用户
- `transactions_24h`: 24小时交易数
- `total_transactions`: 总交易数
- `statistics_date`: 统计日期

## 功能特性

- ✅ **RESTful API**: 标准的REST接口设计
- ✅ **Swagger文档**: 自动生成的API文档
- ✅ **数据库迁移**: 自动创建和更新表结构
- ✅ **事件监听**: 实时监听区块链事件
- ✅ **积分计算**: 定时计算用户积分
- ✅ **多链支持**: 支持多个以太坊网络
- ✅ **日志记录**: 完整的日志系统
- ✅ **错误处理**: 统一的错误处理机制

## 开发指南

### 添加新的API端点

1. 在对应的控制器中添加方法
2. 添加Swagger注释
3. 在路由中注册路由
4. 重新生成Swagger文档

### 数据库迁移

使用GORM的AutoMigrate功能自动处理：
```go
err := db.AutoMigrate(&YourModel{})
```

### 事件监听

服务会自动监听以下事件：
- Transfer: 代币转账
- Mint: 代币铸造
- Burn: 代币销毁

## 部署

### Docker部署

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main cmd/api/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
CMD ["./main"]
```

### 生产环境配置

- 设置 `SERVER_MODE=release`
- 配置生产数据库连接
- 启用HTTPS
- 配置反向代理

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MySQL服务状态
   - 验证连接参数
   - 确保数据库已创建

2. **事件监听失败**
   - 检查以太坊节点连接
   - 验证合约地址
   - 确认RPC端点可访问

3. **积分计算错误**
   - 检查用户余额数据
   - 验证计算逻辑
   - 查看定时任务日志

## 许可证

MIT License