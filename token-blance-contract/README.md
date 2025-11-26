# TokenBalance 合约项目

这是一个基于Solidity和Hardhat的ERC20代币合约项目，支持minting和burning功能，用于追踪用户余额和计算积分。

## 功能特性

- ✅ 标准ERC20功能
- ✅ 代币铸造(Mint)功能
- ✅ 代币销毁(Burn)功能
- ✅ 批量铸造功能
- ✅ 自定义事件日志
- ✅ 最大供应量限制
- ✅ 所有者权限控制

## 合约信息

- **代币名称**: TokenBalance
- **代币符号**: TBK
- **最大供应量**: 1,000,000,000 TBK
- **Solidity版本**: 0.8.20

## 事件定义

合约定义了以下自定义事件用于追踪代币变动：

```solidity
event TokensMinted(address indexed to, uint256 amount, uint256 timestamp);
event TokensBurned(address indexed from, uint256 amount, uint256 timestamp);
event TokensTransferred(address indexed from, address indexed to, uint256 amount, uint256 timestamp);
```

## 环境配置

1. 复制并编辑环境变量文件：
```bash
cp constant.env.example constant.env
```

2. 编辑 `constant.env` 文件，填入你的私钥和RPC端点：
```
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
```

## 安装依赖

```bash
npm install
```

## 编译合约

```bash
npx hardhat compile
```

## 运行测试

```bash
npx hardhat test
```

## 部署合约

### 本地网络部署

1. 启动本地Hardhat网络：
```bash
npx hardhat node
```

2. 在另一个终端中部署：
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Sepolia测试网部署

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Base Sepolia测试网部署

```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

## 部署后验证

部署完成后，合约会自动进行以下验证：
1. 检查代币基本信息
2. 在本地网络中自动执行测试操作（铸造、转账、销毁）
3. 保存部署信息到 `deployment-{network}.json` 文件
4. 更新环境变量文件中的合约地址

## 合约交互示例

### 铸造代币

```javascript
// 铸造1000个代币到指定地址
await tokenBalance.mint("0xrecipient-address", ethers.parseEther("1000"));
```

### 销毁代币

```javascript
// 销毁100个代币
await tokenBalance.burn(ethers.parseEther("100"));
```

### 转账代币

```javascript
// 转账100个代币
await tokenBalance.transfer("0xrecipient-address", ethers.parseEther("100"));
```

### 批量铸造

```javascript
const recipients = ["0xaddress1", "0xaddress2"];
const amounts = [ethers.parseEther("100"), ethers.parseEther("200")];
await tokenBalance.batchMint(recipients, amounts);
```

## 项目结构

```
token-blance-contract/
├── contracts/           # Solidity合约文件
│   └── TokenBalance.sol
├── scripts/            # 部署脚本
│   └── deploy.js
├── test/               # 测试文件
│   └── TokenBalance.test.js
├── hardhat.config.js   # Hardhat配置
├── constant.env        # 环境变量
├── package.json        # 项目依赖
└── README.md          # 项目文档
```

## 操作记录

### 2024-01-XX 项目创建
- ✅ 创建基础项目结构
- ✅ 配置Hardhat开发环境
- ✅ 实现TokenBalance ERC20合约
- ✅ 添加mint/burn功能
- ✅ 创建部署脚本
- ✅ 编写单元测试
- ✅ 支持多网络部署（localhost, sepolia, base-sepolia）

### 后续步骤
- [ ] 部署到测试网络
- [ ] 验证合约功能
- [ ] 集成后端监听服务