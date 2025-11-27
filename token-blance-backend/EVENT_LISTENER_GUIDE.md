## TokenBalanceX - 事件监听诊断指南

如果你的应用没有监听到部署在 Sepolia 测试网的合约事件，请按以下步骤排查：

### 1. **检查配置** (`.env` 文件)

```env
# 必须设置为 Sepolia RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# 必须设置为你部署的合约地址
TOKEN_CONTRACT_ADDRESS=0xYourContractAddress

# Sepolia 链 ID 应为 11155111
# ETHEREUM_CHAIN_ID=11155111
```

### 2. **检查合约地址**

```bash
# 确保 TOKEN_CONTRACT_ADDRESS 是有效的合约地址
# 不应该是 0x0000000000000000000000000000000000000000

# 可以在 Sepolia Etherscan 上验证:
# https://sepolia.etherscan.io/address/0xYourContractAddress
```

### 3. **检查应用日志**

启动应用时查看是否有以下日志：

```
启动区块链事件监听服务...
区块链事件监听服务启动成功
检测到事件: TX Hash=0x..., Block=..., 主题数=...
事件已保存到数据库: Transfer, TX=0x...
```

### 4. **常见问题**

**问题**: 看到错误 "连接以太坊 RPC 失败"
- **原因**: RPC URL 无法访问或 Infura key 无效
- **解决**: 检查 `SEPOLIA_RPC_URL` 是否正确

**问题**: 日志显示 "合约地址无效，事件监听已禁用"
- **原因**: `TOKEN_CONTRACT_ADDRESS` 未设置或为 0 地址
- **解决**: 设置正确的合约地址

**问题**: 事件监听启动但没有检测到事件
- **原因**:
  1. 合约还没有发出事件
  2. 应用启动后的事件被错过（只监听新事件）
  3. 监听区间太小
- **解决**:
  1. 在你的合约上执行交易，确保发出事件
  2. 调用 `/api/v1/events/sync` 手动同步历史事件
  3. 检查数据库中的 `event_logs` 表

### 5. **手动测试**

```bash
# 1. 查询已保存的事件
curl http://localhost:8080/api/v1/events?page=1&pageSize=10

# 2. 手动同步事件
curl -X POST http://localhost:8080/api/v1/events/sync

# 3. 检查数据库
SELECT * FROM event_logs ORDER BY timestamp DESC LIMIT 10;
```

### 6. **事件监听工作流**

```
应用启动
    ↓
连接到 Sepolia RPC (SEPOLIA_RPC_URL)
    ↓
加载合约地址 (TOKEN_CONTRACT_ADDRESS)
    ↓
启动事件监听器 (每 15 秒查询一次)
    ↓
查询链上事件
    ↓
将事件保存到数据库
```

### 7. **支持的事件**

目前支持监听的事件：
- **Transfer**: `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`

### 8. **查看应用日志**

```bash
# 启动应用并查看详细日志
go run cmd/api/main.go

# 查看日志文件（如果配置了）
tail -f logs/app.log
```

### 9. **数据库检查**

```sql
-- 查看已保存的事件
SELECT id, event_name, tx_hash, block_number, timestamp 
FROM event_logs 
ORDER BY timestamp DESC 
LIMIT 20;

-- 统计事件数量
SELECT event_name, COUNT(*) as count 
FROM event_logs 
GROUP BY event_name;
```

### 需要帮助?

检查以下内容：
1. ✅ `SEPOLIA_RPC_URL` 是否有效
2. ✅ `TOKEN_CONTRACT_ADDRESS` 是否正确
3. ✅ 合约是否发出了事件
4. ✅ 数据库是否连接正常
5. ✅ 应用日志中是否有错误信息
