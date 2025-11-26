# TokenBalanceX 项目

一个完整的区块链代币余额追踪和积分计算系统，包含智能合约和后端服务。

## 项目概述

本项目实现了一个基于以太坊的ERC20代币系统，能够：
- 部署带mint和burn功能的ERC20合约
- 实时监听合约事件并重建用户余额
- 基于用户余额和持有时间计算积分
- 支持多链部署（Sepolia、Base Sepolia）
- 提供完整的RESTful API和统计数据

## 系统架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   智能合约      │    │   事件监听服务   │    │   积分计算服务   │
│  (ERC20 Token)  │───▶│  (Event Service) │───▶│ (Points Service)│
│  • Mint        │    │  • 实时监听      │    │  • 定时计算      │
│  • Burn        │    │  • 余额重建      │    │  • 积分累计      │
│  • Transfer    │    │  • 多链支持      │    │  • 历史回溯      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   数据库存储     │
                       │  (MySQL + GORM)  │
                       │  • 用户信息       │
                       │  • 余额历史       │
                       │  • 积分记录       │
                       │  • 系统统计       │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   RESTful API    │
                       │  (Gin Framework) │
                       │  • 用户查询       │
                       │  • 历史记录       │
                       │  • 积分排行       │
                       │  • 统计报表       │
                       └──────────────────┘
```

## 项目结构

```
TokenBalanceX/
├── task.txt                      # 项目需求文档
├── README.md                     # 项目总览文档
├── token-blance-contract/        # 合约端项目
│   ├── contracts/               # Solidity合约
│   ├── scripts/                 # 部署脚本
│   ├── test/                   # 测试文件
│   ├── hardhat.config.js       # Hardhat配置
│   ├── constant.env            # 环境变量
│   └── README.md              # 合约文档
└── token-blance-backend/         # 后端项目
    ├── config/                 # 配置包
    ├── database/               # 数据库包
    ├── services/              # 服务层
    ├── handlers/              # 处理器层
    ├── middleware/            # 中间件
    ├── main.go               # 主入口
    ├── .env                  # 环境变量
    └── README.md             # 后端文档
```

## 快速开始

### 1. 部署智能合约

```bash
# 进入合约目录
cd token-blance-contract

# 安装依赖
npm install

# 启动本地区块链（新终端）
npx hardhat node

# 部署合约（另一个终端）
npx hardhat run scripts/deploy.js --network localhost
```

### 2. 启动后端服务

```bash
# 进入后端目录
cd token-blance-backend

# 安装依赖
go mod tidy

# 配置数据库（MySQL）
# 编辑 .env 文件，设置数据库连接信息

# 启动服务
go run main.go
```

### 3. 测试API接口

```bash
# 健康检查
curl http://localhost:8080/health

# 获取用户余额
curl http://localhost:8080/api/v1/users/0x...

# 获取积分排行榜
curl http://localhost:8080/api/v1/points/leaderboard
```

## 核心功能

### 智能合约功能

- ✅ **ERC20标准功能**: 完整的ERC20代币实现
- ✅ **Mint功能**: 合约所有者可以铸造代币
- ✅ **Burn功能**: 用户可以销毁自己持有的代币
- ✅ **Transfer功能**: 标准的代币转账功能
- ✅ **批量铸造**: 支持一次铸造给多个地址
- ✅ **事件日志**: 完整的事件记录用于追踪
- ✅ **权限控制**: 使用OpenZeppelin的Ownable

### 后端服务功能

- ✅ **事件监听**: 实时监听合约的mint、burn、transfer事件
- ✅ **余额重建**: 根据事件历史重建用户当前余额
- ✅ **积分计算**: 基于余额和持有时间计算积分
- ✅ **定时任务**: 每小时自动计算积分
- ✅ **多链支持**: 支持Sepolia和Base Sepolia测试网
- ✅ **RESTful API**: 完整的REST接口
- ✅ **数据统计**: 丰富的统计和报表功能

## 积分计算逻辑

### 计算公式
```
积分 = 余额 × 积分费率 × 持有时间（小时）
```

### 计算示例
用户在以下时间点的余额变化：
- 15:00: 0个token
- 15:10: 100个token  
- 15:30: 200个token

16:00启动积分计算时：
```
积分 = 100 × 0.05 × 20/60 + 200 × 0.05 × 30/60 = 1.6667 + 5 = 6.6667
```

### 回溯处理
如果系统中断几天，可以通过API手动回溯计算：
```bash
curl -X POST http://localhost:8080/api/v1/points/calculate \
  -d "from_date=2024-01-01&to_date=2024-01-03"
```

## 部署到测试网

### Sepolia测试网部署

1. **配置环境变量**:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_sepolia_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

2. **部署合约**:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

3. **配置后端**:
```env
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
ETHEREUM_CHAIN_ID=11155111
TOKEN_CONTRACT_ADDRESS=deployed_contract_address
```

### Base Sepolia测试网部署

1. **配置环境变量**:
```env
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

2. **部署合约**:
```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

3. **配置后端**:
```env
ETHEREUM_RPC_URL=https://sepolia.base.org
ETHEREUM_CHAIN_ID=84532
```

## API文档

### 用户相关接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/users/:address` | 获取用户余额 |
| GET | `/api/v1/users/:address/history` | 获取余额变动历史 |
| GET | `/api/v1/users/:address/points` | 获取用户积分信息 |

### 事件相关接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/events/` | 获取最近事件列表 |
| POST | `/api/v1/events/sync` | 手动同步事件 |

### 积分相关接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/points/leaderboard` | 获取积分排行榜 |
| POST | `/api/v1/points/calculate` | 手动计算积分 |

### 统计相关接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/v1/stats/overview` | 获取系统概览 |
| GET | `/api/v1/stats/daily` | 获取每日统计 |

## 数据库设计

### 核心表结构

1. **users** - 用户信息表
2. **user_balance_history** - 用户余额变动记录表  
3. **points_records** - 积分记录表
4. **user_daily_summary** - 用户每日汇总表
5. **event_logs** - 事件日志表
6. **system_stats** - 系统统计表

详细的表结构和字段说明请参考：
- [合约端文档](./token-blance-contract/README.md)
- [后端文档](./token-blance-backend/README.md)

## 监控和运维

### 日志文件
- `token-blance-contract/`: 合约部署和测试日志
- `token-blance-backend/logs/`: 后端服务日志

### 监控指标
- 事件监听状态
- 积分计算任务状态
- 数据库连接状态
- API响应时间

### 健康检查
```bash
curl http://localhost:8080/health
```

## Git配置和忽略文件

项目包含了完整的.gitignore配置，保护敏感信息并保持代码库整洁：

### 根目录 .gitignore
- 通用系统文件（.DS_Store, Thumbs.db等）
- IDE配置文件
- 环境变量和配置文件
- 日志和临时文件
- 编译输出和依赖目录

### 合约端 .gitignore
- Hardhat缓存和构建产物
- Node.js依赖和配置
- 部署和测试文件
- 私钥和敏感配置

### 后端 .gitignore
- Go编译输出和依赖
- 数据库文件和日志
- 配置文件和证书
- 测试和性能分析文件

### 注意事项
⚠️ **重要**: 以下文件已被忽略，不会提交到版本控制：
- 所有包含私钥、API密钥的配置文件
- 环境变量文件 (.env, constant.env)
- 部署文件 (deployment-*.json)
- 日志文件和临时文件
- 数据库文件和证书

## 操作记录

### 合约端开发记录
- ✅ 创建Hardhat项目结构
- ✅ 实现TokenBalance ERC20合约
- ✅ 添加mint/burn/transfer功能
- ✅ 创建部署脚本和测试
- ✅ 支持多网络部署

### 后端开发记录
- ✅ 创建Gin项目结构
- ✅ 实现数据库模型和连接
- ✅ 开发事件监听服务
- ✅ 实现积分计算逻辑
- ✅ 创建RESTful API
- ✅ 添加多链支持和统计功能

## 技术栈

### 合约端
- **开发框架**: Hardhat
- **智能合约**: Solidity 0.8.20
- **合约库**: OpenZeppelin
- **测试框架**: Mocha + Chai

### 后端
- **Web框架**: Gin
- **ORM框架**: GORM
- **数据库**: MySQL
- **以太坊**: go-ethereum
- **定时任务**: robfig/cron
- **数值计算**: shopspring/decimal

## 性能优化

1. **数据库优化**
   - 合理的索引设计
   - 分页查询
   - 连接池管理

2. **事件处理**
   - 批量处理事件
   - 异步处理
   - 错误重试机制

3. **API优化**
   - 响应缓存
   - 并发控制
   - 请求限流

## 安全考虑

1. **智能合约安全**
   - 使用OpenZeppelin库
   - 权限控制
   - 输入验证

2. **后端安全**
   - SQL注入防护
   - XSS防护
   - CORS配置
   - 请求大小限制

## 未来扩展

- [ ] 添加前端可视化界面
- [ ] 实现WebSocket实时推送
- [ ] 支持更多区块链网络
- [ ] 添加分布式缓存
- [ ] 实现微服务架构
- [ ] 添加机器学习积分预测

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：
- 创建Issue
- 提交Pull Request
- 发送邮件

---

**注意**: 本项目仅用于学习和演示目的，生产环境使用前请进行充分测试。