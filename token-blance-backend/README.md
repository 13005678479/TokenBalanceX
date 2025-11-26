# TokenBalance 后端服务

这是一个基于Gin框架的Go后端服务，用于监听以太坊ERC20代币合约事件，追踪用户余额，并计算积分。

## 功能特性

- ✅ 合约事件监听（mint、burn、transfer）
- ✅ 用户余额重建和追踪
- ✅ 积分计算和定时任务
- ✅ 多链支持（Sepolia、Base Sepolia）
- ✅ RESTful API接口
- ✅ 数据库统计和报表
- ✅ 日志记录和监控

## 技术栈

- **Web框架**: Gin
- **数据库**: MySQL + GORM
- **以太坊客户端**: go-ethereum
- **定时任务**: robfig/cron
- **数值处理**: shopspring/decimal
- **配置管理**: dotenv

## 项目结构

```
token-blance-backend/
├── main.go                 # 主入口文件
├── go.mod                  # Go模块文件
├── .env                    # 环境变量配置
├── config/                 # 配置包
│   └── config.go
├── database/               # 数据库包
│   ├── models.go           # 数据模型
│   └── database.go        # 数据库连接
├── services/              # 服务层
│   ├── event_service.go    # 事件监听服务
│   ├── points_service.go   # 积分计算服务
│   └── user_service.go    # 用户服务
├── handlers/              # 处理器层
│   ├── handler.go         # 基础处理器
│   ├── user_handler.go    # 用户相关处理器
│   ├── event_handler.go   # 事件相关处理器
│   ├── points_handler.go  # 积分相关处理器
│   └── stats_handler.go  # 统计相关处理器
├── middleware/            # 中间件
│   └── middleware.go
├── logs/                 # 日志目录
└── README.md            # 项目文档
```

## 环境配置

复制并编辑环境变量文件：

```bash
# 服务器配置
SERVER_PORT=8080
GIN_MODE=debug

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=token_balance
DB_CHARSET=utf8mb4

# 以太坊配置
ETHEREUM_RPC_URL=http://127.0.0.1:8545
ETHEREUM_CHAIN_ID=31337
ETHEREUM_CONFIRMATION_BLOCKS=6

# 合约配置
TOKEN_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
TOKEN_CONTRACT_DEPLOYMENT_BLOCK=2

# 多链配置
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# 积分计算配置
POINTS_CALCULATION_RATE=0.05
POINTS_CRON_SCHEDULE=0 * * * *

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## 数据库设计

### 核心表结构

1. **users** - 用户信息表
   - address: 用户地址
   - balance: 当前余额
   - total_points: 总积分

2. **user_balance_history** - 用户余额变动记录表
   - address: 用户地址
   - amount: 变动数量
   - balance_before/balance_after: 变动前后余额
   - event_type: 事件类型（mint/burn/transfer）
   - tx_hash: 交易哈希

3. **points_records** - 积分记录表
   - address: 用户地址
   - points: 积分数量
   - balance: 计算时余额
   - duration: 持有时间（秒）
   - start_time/end_time: 计算时间段

4. **system_stats** - 系统统计表
   - total_users: 总用户数
   - active_users: 活跃用户数
   - total_balance: 总余额
   - total_points: 总积分

## API 接口

### 健康检查
- `GET /health` - 服务健康状态

### 用户相关
- `GET /api/v1/users/:address` - 获取用户余额
- `GET /api/v1/users/:address/history` - 获取余额变动历史
- `GET /api/v1/users/:address/points` - 获取用户积分信息

### 事件相关
- `GET /api/v1/events/` - 获取最近事件列表
- `POST /api/v1/events/sync` - 手动同步事件

### 积分相关
- `GET /api/v1/points/leaderboard` - 获取积分排行榜
- `POST /api/v1/points/calculate` - 手动计算积分

### 统计相关
- `GET /api/v1/stats/overview` - 获取系统概览
- `GET /api/v1/stats/daily` - 获取每日统计

## 积分计算逻辑

积分计算基于用户的代币余额和持有时间：

```
积分 = 余额 × 积分费率 × 持有时间（小时）
```

### 示例场景
- 用户15:00有0个token
- 15:10有100个token  
- 15:30有200个token
- 16:00计算积分：

```
积分 = 100 × 0.05 × 20/60 + 200 × 0.05 × 30/60 = 1.6667 + 5 = 6.6667
```

## 安装和运行

1. 安装依赖：
```bash
go mod tidy
```

2. 配置数据库：
- 创建MySQL数据库 `token_balance`
- 执行自动迁移（启动时自动执行）

3. 启动服务：
```bash
go run main.go
```

4. 或编译后运行：
```bash
go build -o token-balance-server
./token-balance-server
```

## 部署说明

### 1. 数据库部署
```sql
CREATE DATABASE token_balance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 服务部署
- 修改 `.env` 文件中的配置
- 使用 `screen` 或 `systemd` 管理进程

### 3. 反向代理配置（Nginx示例）
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 监控和日志

### 日志文件
- `logs/access.log` - 访问日志
- `logs/app.log` - 应用日志

### 监控指标
- 事件监听状态
- 积分计算任务状态
- 数据库连接状态
- API响应时间

## 故障恢复

### 事件监听中断
如果事件监听中断，可以手动同步：
```bash
curl -X POST http://localhost:8080/api/v1/events/sync \
  -d "from_block=1000&to_block=2000"
```

### 积分计算中断
如果积分计算中断，可以回溯计算：
```bash
curl -X POST http://localhost:8080/api/v1/points/calculate \
  -d "from_date=2024-01-01&to_date=2024-01-02"
```

## 操作记录

### 2024-01-XX 项目创建
- ✅ 创建基础项目结构
- ✅ 实现数据库模型
- ✅ 开发事件监听服务
- ✅ 实现积分计算逻辑
- ✅ 创建RESTful API
- ✅ 添加多链支持
- ✅ 实现统计和报表功能

### 后续计划
- [ ] 添加缓存机制
- [ ] 实现WebSocket实时推送
- [ ] 添加更多监控指标
- [ ] 性能优化