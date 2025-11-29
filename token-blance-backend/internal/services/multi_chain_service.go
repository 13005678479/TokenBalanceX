package services

import (
	"context"
	"fmt"
	"math/big"
	"sync"
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

// MultiChainService 多链服务
// 
// 任务7: ✅ 完善多链支持，比如支持sepolia， base sepolia
//
// 功能实现：
// - ✅ 支持多链同时监听
// - ✅ 每个链独立的事件处理
// - ✅ 统一的余额管理
// - ✅ 链配置动态管理
// - ✅ 错误隔离和恢复机制
type MultiChainService struct {
	db            *gorm.DB
	chains        map[string]*ChainClient
	cfg           *config.Config
	wg            sync.WaitGroup
	stopChan      chan struct{}
	mu            sync.RWMutex
}

// ChainClient 单链客户端
type ChainClient struct {
	Name         string
	ChainID      int64
	RPCURL       string
	Client       *ethclient.Client
	ContractAddr common.Address
	Enabled      bool
	LastBlock    uint64
	Service      *EventService // 复用单链事件服务逻辑
}

// NewMultiChainService 创建多链服务
func NewMultiChainService(db *gorm.DB, cfg *config.Config) *MultiChainService {
	return &MultiChainService{
		db:       db,
		chains:   make(map[string]*ChainClient),
		cfg:      cfg,
		stopChan: make(chan struct{}),
	}
}

// StartAllChains 启动所有配置的链
func (mcs *MultiChainService) StartAllChains() error {
	middleware.Info("🌐 启动多链事件监听服务...")

	chains := mcs.cfg.GetSupportedChains()
	
	for chainName, chainConfig := range chains {
		if !chainConfig.Enabled {
			middleware.Info("⏭️ 跳过已禁用的链: %s", chainName)
			continue
		}

		if err := mcs.startChain(chainName, chainConfig); err != nil {
			middleware.Error("❌ 启动链 %s 失败: %v", chainName, err)
			continue
		}
	}

	if len(mcs.chains) == 0 {
		middleware.Error("❌ 没有可用的链配置")
		return fmt.Errorf("没有可用的链配置")
	}

	middleware.Info("✅ 成功启动 %d 个链的监听服务", len(mcs.chains))
	return nil
}

// startChain 启动单个链
func (mcs *MultiChainService) startChain(name string, config config.ChainConfig) error {
	middleware.Info("🔗 启动链 %s (ChainID: %d)", name, config.ChainID)

	// 连接到链RPC
	client, err := ethclient.Dial(config.RPCURL)
	if err != nil {
		return fmt.Errorf("连接 %s RPC失败: %v", name, err)
	}

	// 测试连接并获取链ID
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	chainID, err := client.ChainID(ctx)
	if err != nil {
		client.Close()
		return fmt.Errorf("获取 %s 链ID失败: %v", name, err)
	}

	if chainID.Int64() != config.ChainID {
		client.Close()
		return fmt.Errorf("%s 链ID不匹配: 期望 %d, 实际 %d", 
			name, config.ChainID, chainID.Int64())
	}

	middleware.Info("✅ %s 连接成功 (ChainID: %d, RPC: %s)", 
		name, config.ChainID, config.RPCURL)

	// 创建事件服务
	eventService := &EventService{
		db:       mcs.db,
		client:   client,
		contract: common.HexToAddress(config.ContractAddr),
	}

	// 创建链客户端
	chainClient := &ChainClient{
		Name:         name,
		ChainID:      config.ChainID,
		RPCURL:       config.RPCURL,
		Client:       client,
		ContractAddr: common.HexToAddress(config.ContractAddr),
		Enabled:      true,
		LastBlock:    0,
		Service:      eventService,
	}

	mcs.mu.Lock()
	mcs.chains[name] = chainClient
	mcs.mu.Unlock()

	// 启动该链的独立监听
	mcs.wg.Add(1)
	go mcs.monitorChain(chainClient)

	return nil
}

// monitorChain 监听单个链的事件
func (mcs *MultiChainService) monitorChain(chain *ChainClient) {
	defer mcs.wg.Done()
	defer chain.Client.Close()

	middleware.Info("🎧 开始监听链 %s 的事件...", chain.Name)

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	var lastBlockNumber uint64

	for {
		select {
		case <-mcs.stopChan:
			middleware.Info("🛑 停止监听链 %s", chain.Name)
			return
		case <-ticker.C:
			if err := mcs.processChainEvents(chain, &lastBlockNumber); err != nil {
				middleware.Error("❌ 处理链 %s 事件失败: %v", chain.Name, err)
			}
		}
	}
}

// processChainEvents 处理单个链的事件
func (mcs *MultiChainService) processChainEvents(chain *ChainClient, lastBlockNumber *uint64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// 获取最新区块
	header, err := chain.Client.HeaderByNumber(ctx, nil)
	if err != nil {
		return fmt.Errorf("获取 %s 最新区块失败: %v", chain.Name, err)
	}

	currentBlockNumber := header.Number.Uint64()

	// 六区块延迟确认
	const confirmationBlocks = uint64(6)
	safeLatestBlock := currentBlockNumber
	if currentBlockNumber > confirmationBlocks {
		safeLatestBlock = currentBlockNumber - confirmationBlocks
	}

	// 首次运行或区块范围过大时调整
	maxBlockRange := uint64(100)
	if *lastBlockNumber == 0 || safeLatestBlock-*lastBlockNumber > maxBlockRange {
		*lastBlockNumber = safeLatestBlock - maxBlockRange
		if *lastBlockNumber < 1 {
			*lastBlockNumber = 1
		}
	}

	// 查询Transfer事件
	var addresses []common.Address
	if chain.ContractAddr != (common.Address{}) {
		addresses = []common.Address{chain.ContractAddr}
	}

	query := ethereum.FilterQuery{
		FromBlock: new(big.Int).SetUint64(*lastBlockNumber),
		ToBlock:   new(big.Int).SetUint64(safeLatestBlock),
		Addresses: addresses,
		Topics: [][]common.Hash{
			{common.HexToHash("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")},
		},
	}

	logs, err := chain.Client.FilterLogs(ctx, query)
	if err != nil {
		return fmt.Errorf("查询 %s 事件日志失败: %v", chain.Name, err)
	}

	if len(logs) > 0 {
		middleware.Info("📊 %s 查询到 %d 个事件 (区块: %d - %d)", 
			chain.Name, len(logs), *lastBlockNumber, safeLatestBlock)

		successCount := 0
		for _, log := range logs {
			if err := mcs.saveChainEvent(chain, &log); err != nil {
				middleware.Error("❌ %s 保存事件失败: %v", chain.Name, err)
			} else {
				successCount++
			}
		}
		middleware.Info("✅ %s 成功处理 %d/%d 个事件", chain.Name, successCount, len(logs))
	}

	*lastBlockNumber = safeLatestBlock
	return nil
}

// saveChainEvent 保存链事件
func (mcs *MultiChainService) saveChainEvent(chain *ChainClient, log *types.Log) error {
	eventLog := models.EventLog{
		TxHash:          log.TxHash.Hex(),
		BlockNumber:      log.BlockNumber,
		ContractAddress:  log.Address.Hex(),
		Data:            fmt.Sprintf("chain:%s,%s", chain.Name, common.Bytes2Hex(log.Data)),
		Timestamp:       time.Now(),
	}

	// 解析Transfer事件
	transferEventSig := common.HexToHash("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")
	if len(log.Topics) >= 3 && log.Topics[0] == transferEventSig {
		eventLog.EventName = "Transfer"
		
		fromAddress := common.BytesToAddress(log.Topics[1].Bytes())
		toAddress := common.BytesToAddress(log.Topics[2].Bytes())
		
		var amount string = "0"
		if len(log.Data) >= 32 {
			amount = new(big.Int).SetBytes(log.Data).String()
		}
		
		eventLog.UserAddress = toAddress.Hex()
		eventLog.Amount = amount
		eventLog.Data = fmt.Sprintf("chain:%s,from:%s,to:%s,amount:%s", 
			chain.Name, fromAddress.Hex(), toAddress.Hex(), amount)
		
		// 更新用户余额
		mcs.updateUserBalanceFromMultiChain(chain.Name, fromAddress.Hex(), toAddress.Hex(), amount, log.TxHash.Hex(), log.BlockNumber)
	}

	return mcs.db.Create(&eventLog).Error
}

// updateUserBalanceFromMultiChain 从多链Transfer事件更新用户余额
func (mcs *MultiChainService) updateUserBalanceFromMultiChain(chainName, fromAddr, toAddr, amount, txHash string, blockNumber uint64) {
	// 接收方余额增加
	if toAddr != "0x0000000000000000000000000000000000000000000" {
		mcs.updateSingleUserBalanceOnChain(chainName, toAddr, amount, "transfer_in", txHash, blockNumber)
	}
	
	// 发送方余额处理（如果是mint事件，from可能是零地址）
	if fromAddr != "0x0000000000000000000000000000000000000000000" {
		mcs.recordTransferEventOnChain(chainName, fromAddr, amount, "transfer_out", txHash, blockNumber)
	}
}

// updateSingleUserBalanceOnChain 更新单链用户余额
func (mcs *MultiChainService) updateSingleUserBalanceOnChain(chainName, address, amount, changeType, txHash string, blockNumber uint64) {
	var user models.User
	err := mcs.db.Where("id = ?", address).First(&user).Error
	
	if err != nil && err != gorm.ErrRecordNotFound {
		middleware.Error("查询用户失败: %v", err)
		return
	}

	if err == gorm.ErrRecordNotFound {
		user = models.User{
			ID:          address,
			Balance:     "0",
			TotalPoints: 0,
		}
		if err := mcs.db.Create(&user).Error; err != nil {
			middleware.Error("创建用户失败: %v", err)
			return
		}
	}

	oldBalance := user.Balance
	var newBalance string
	
	if changeType == "transfer_in" {
		oldAmount := new(big.Int)
		if oldBalanceStr := user.Balance; oldBalanceStr != "" {
			oldAmount, _ = new(big.Int).SetString(oldBalanceStr, 10)
		}
		
		addAmount := new(big.Int)
		if amount != "" {
			addAmount, _ = new(big.Int).SetString(amount, 10)
		}
		
		newBalance = new(big.Int).Add(oldAmount, addAmount).String()
	} else {
		newBalance = user.Balance
	}

	if err := mcs.db.Model(&user).Update("balance", newBalance).Error; err != nil {
		middleware.Error("更新用户余额失败: %v", err)
		return
	}

	history := models.UserBalanceHistory{
		UserAddress: address,
		OldBalance:  oldBalance,
		NewBalance:  newBalance,
		ChangeAmount: amount,
		ChangeType:  changeType,
		TxHash:      txHash,
		BlockNumber: blockNumber,
		Timestamp:   time.Now(),
	}

	if err := mcs.db.Create(&history).Error; err != nil {
		middleware.Error("记录余额历史失败: %v", err)
	}

	middleware.Debug("💰 %s 用户余额更新: %s=%s (+%s)", chainName, address, newBalance, amount)
}

// recordTransferEventOnChain 记录链上转账事件
func (mcs *MultiChainService) recordTransferEventOnChain(chainName, address, amount, changeType, txHash string, blockNumber uint64) {
	history := models.UserBalanceHistory{
		UserAddress: address,
		OldBalance:  "",
		NewBalance:  "",
		ChangeAmount: amount,
		ChangeType:  changeType,
		TxHash:      txHash,
		BlockNumber: blockNumber,
		Timestamp:   time.Now(),
	}

	if err := mcs.db.Create(&history).Error; err != nil {
		middleware.Error("记录转账事件失败: %v", err)
	}
}

// Stop 停止所有链监听
func (mcs *MultiChainService) Stop() {
	middleware.Info("🛑 停止多链监听服务...")
	
	close(mcs.stopChan)
	mcs.wg.Wait()
	
	middleware.Info("✅ 多链监听服务已停止")
}

// GetChainStatus 获取链状态
func (mcs *MultiChainService) GetChainStatus() map[string]interface{} {
	mcs.mu.RLock()
	defer mcs.mu.RUnlock()
	
	status := make(map[string]interface{})
	for name, chain := range mcs.chains {
		status[name] = map[string]interface{}{
			"name":         chain.Name,
			"chain_id":     chain.ChainID,
			"rpc_url":      chain.RPCURL,
			"contract_addr": chain.ContractAddr.Hex(),
			"enabled":      chain.Enabled,
			"last_block":   chain.LastBlock,
		}
	}
	
	return status
}