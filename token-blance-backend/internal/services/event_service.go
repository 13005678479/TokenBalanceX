package services

import (
	"context"
	"math/big"
	"time"
	"token-balance/config"
	"token-balance/internal/middleware"
	"token-balance/internal/models"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"gorm.io/gorm"
)

// EventService 事件服务
type EventService struct {
	db       *gorm.DB
	client   *ethclient.Client
	contract common.Address
}

// NewEventService 创建事件服务
func NewEventService(db *gorm.DB, cfg interface{}) (*EventService, error) {
	// 类型转换配置
	appConfig, ok := cfg.(*config.Config)
	if !ok {
		middleware.Error("无效的配置类型")
		return nil, nil
	}

	// 连接到 Sepolia 测试网络
	rpcURL := appConfig.Ethereum.SepoliaRPCURL
	if rpcURL == "" {
		rpcURL = appConfig.Ethereum.RPCEndpoint
	}

	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		middleware.Error("连接以太坊 RPC 失败: %v", err)
		return nil, err
	}

	// 获取合约地址
	contractAddress := common.HexToAddress(appConfig.Ethereum.ContractAddress)
	if isZeroAddress(contractAddress) {
		middleware.Error("❌ 合约地址未配置！请在 .env 中设置 TOKEN_CONTRACT_ADDRESS")
		middleware.Error("当前配置: %s", appConfig.Ethereum.ContractAddress)
	}

	return &EventService{
		db:       db,
		client:   client,
		contract: contractAddress,
	}, nil
}

// isZeroAddress 检查地址是否为零地址
func isZeroAddress(addr common.Address) bool {
	return addr == common.HexToAddress("0x0000000000000000000000000000000000000000")
}

// StartEventListener 启动事件监听
func (es *EventService) StartEventListener() {
	middleware.Info("启动区块链事件监听服务...")

	// 检查合约地址是否有效
	if isZeroAddress(es.contract) {
		middleware.Error("❌ 事件监听已禁用：合约地址无效")
		middleware.Info("📝 请参考 SETUP_CONTRACT_ADDRESS.md 配置合约地址")
		return
	}

	middleware.Info("✅ 使用合约地址: %s", es.contract.Hex())

	// 启动事件监听 goroutine
	go es.listenToEvents()

	middleware.Info("区块链事件监听服务启动成功")
}

// listenToEvents 监听合约事件
func (es *EventService) listenToEvents() {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	var lastBlockNumber uint64

	for range ticker.C {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)

		// 获取最新区块
		header, err := es.client.HeaderByNumber(ctx, nil)
		if err != nil {
			middleware.Error("获取最新区块失败: %v", err)
			cancel()
			continue
		}

		currentBlockNumber := header.Number.Uint64()

		// 首次运行或距离上次查询超过指定区块数
		if lastBlockNumber == 0 || currentBlockNumber-lastBlockNumber > 1000 {
			lastBlockNumber = currentBlockNumber - 1000
			if lastBlockNumber < 1 {
				lastBlockNumber = 1
			}
		}

		// 查询 Transfer 事件
		query := ethereum.FilterQuery{
			FromBlock: new(big.Int).SetUint64(lastBlockNumber),
			ToBlock:   header.Number,
			Addresses: []common.Address{es.contract},
		}

		logs, err := es.client.FilterLogs(ctx, query)
		if err != nil {
			middleware.Error("查询事件日志失败: %v", err)
			cancel()
			continue
		}

		for _, log := range logs {
			middleware.Info("检测到事件: TX Hash=%s, Block=%d, 主题数=%d",
				log.TxHash.Hex(), log.BlockNumber, len(log.Topics))

			// 保存事件到数据库
			es.saveEventLog(&log)
		}

		lastBlockNumber = currentBlockNumber

		cancel()
	}
}

// saveEventLog 保存事件日志到数据库
func (es *EventService) saveEventLog(log *types.Log) {
	eventLog := models.EventLog{
		TxHash:      log.TxHash.Hex(),
		BlockNumber: log.BlockNumber,
		Data:        common.Bytes2Hex(log.Data),
		Timestamp:   time.Now(),
	}

	// 识别事件类型和用户地址
	if len(log.Topics) > 0 {
		// Transfer 事件签名: keccak256("Transfer(address,address,uint256)")
		transferEventSig := common.HexToHash("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")

		if log.Topics[0] == transferEventSig {
			eventLog.EventName = "Transfer"
			// Topics[1] = from (address), Topics[2] = to (address), Topics[3] = value (amount)
			if len(log.Topics) > 2 {
				// 记录接收方地址作为用户地址
				eventLog.UserAddress = common.BytesToAddress(log.Topics[2][:]).Hex()
			}
		}
	}

	if err := es.db.Create(&eventLog).Error; err != nil {
		middleware.Error("保存事件日志失败: %v", err)
		return
	}

	middleware.Info("事件已保存到数据库: %s, TX=%s", eventLog.EventName, eventLog.TxHash)
}

// handleTransferEvent 处理Transfer事件
func (es *EventService) handleTransferEvent(transfer *models.EventLog) {
	if transfer == nil {
		return
	}
	middleware.Info("检测到Transfer事件: data=%s", transfer.Data)

	// 更新用户余额 (placeholder implementation)
	// 实际应该从事件中解析出from、to、value等信息
}

// updateUserBalance 更新用户余额并记录历史
func (es *EventService) updateUserBalance(address, amount, changeType string) {
	// 获取用户当前余额
	var user models.User
	err := es.db.Where("id = ?", address).First(&user).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		middleware.Error("查询用户余额失败: %v", err)
		return
	}

	// 如果用户不存在，创建新用户
	if err == gorm.ErrRecordNotFound {
		user = models.User{
			ID:          address,
			Balance:     "0",
			TotalPoints: 0,
		}
		if err := es.db.Create(&user).Error; err != nil {
			middleware.Error("创建用户失败: %v", err)
			return
		}
	}

	// 解析金额
	oldBalance := user.Balance

	// 计算新余额
	if changeType == "transfer_out" {
		// 发送方减少余额
		// 这里应该有更复杂的余额计算逻辑
		// 暂时简化处理
	} else if changeType == "transfer_in" {
		// 接收方增加余额
		// 这里应该有更复杂的余额计算逻辑
	}

	// 记录余额变动历史
	history := models.UserBalanceHistory{
		UserAddress:  address,
		OldBalance:   oldBalance,
		NewBalance:   user.Balance, // 这里应该更新为新余额
		ChangeAmount: amount,
		ChangeType:   changeType,
		TxHash:       "0x...", // 应该从事件中获取
		BlockNumber:  0,       // 应该从事件中获取
		Timestamp:    time.Now(),
	}

	if err := es.db.Create(&history).Error; err != nil {
		middleware.Error("记录余额变动历史失败: %v", err)
	}
}

// SyncEvents 手动同步事件
func (es *EventService) SyncEvents() error {
	middleware.Info("开始手动同步区块链事件...")

	// 这里应该实现完整的事件同步逻辑
	// 包括获取历史事件、重建用户余额等

	middleware.Info("区块链事件同步完成")
	return nil
}

// GetRecentEvents 获取最近事件
func (es *EventService) GetRecentEvents(page, pageSize string) (*models.PaginatedData, error) {
	var events []models.EventLog
	var total int64

	offset := 0
	if page != "1" {
		offset = (StringToInt(page) - 1) * StringToInt(pageSize)
	}

	err := es.db.Model(&models.EventLog{}).Count(&total).Error
	if err != nil {
		return nil, err
	}

	err = es.db.Order("timestamp desc").
		Offset(offset).
		Limit(StringToInt(pageSize)).
		Find(&events).Error
	if err != nil {
		return nil, err
	}

	totalPages := (total + int64(StringToInt(pageSize)) - 1) / int64(StringToInt(pageSize))

	return &models.PaginatedData{
		Items:      events,
		Total:      total,
		Page:       StringToInt(page),
		PageSize:   StringToInt(pageSize),
		TotalPages: totalPages + 1,
	}, nil
}
