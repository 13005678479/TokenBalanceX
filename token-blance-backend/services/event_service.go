package services

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"strings"
	"time"

	"token-balance-backend/config"
	"token-balance-backend/database"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type EventService struct {
	db        *gorm.DB
	cfg       *config.Config
	client    *ethclient.Client
	contract  common.Address
	abi       abi.ABI
	ctx       context.Context
	cancel    context.CancelFunc
}

type TokenEvent struct {
	EventName    string
	UserAddress  common.Address
	Amount       *big.Int
	FromAddress  common.Address
	ToAddress    common.Address
	TxHash       common.Hash
	BlockNumber  uint64
	LogIndex     uint
	BlockHash    common.Hash
	Timestamp    time.Time
	Topics       []common.Hash
	Data         []byte
}

func NewEventService(db *gorm.DB, cfg *config.Config) *EventService {
	ctx, cancel := context.WithCancel(context.Background())
	
	return &EventService{
		db:     db,
		cfg:    cfg,
		ctx:    ctx,
		cancel: cancel,
	}
}

func (s *EventService) StartEventListener() {
	log.Println("启动事件监听服务...")
	
	// 初始化以太坊客户端和合约
	if err := s.initClient(); err != nil {
		log.Printf("初始化客户端失败: %v", err)
		return
	}

	// 初始化合约ABI
	if err := s.initContractABI(); err != nil {
		log.Printf("初始化合约ABI失败: %v", err)
		return
	}

	// 同步历史事件
	if err := s.syncHistoricalEvents(); err != nil {
		log.Printf("同步历史事件失败: %v", err)
	}

	// 启动实时监听
	go s.listenForNewEvents()
}

func (s *EventService) initClient() error {
	client, err := ethclient.Dial(s.cfg.Ethereum.RPCURL)
	if err != nil {
		return fmt.Errorf("连接以太坊客户端失败: %w", err)
	}

	s.client = client
	s.contract = common.HexToAddress(s.cfg.Ethereum.TokenContract.Address)

	// 验证合约是否存在
	code, err := client.CodeAt(context.Background(), s.contract, nil)
	if err != nil {
		return fmt.Errorf("获取合约代码失败: %w", err)
	}
	if len(code) == 0 {
		return fmt.Errorf("合约地址不存在: %s", s.contract.Hex())
	}

	log.Printf("成功连接到合约: %s", s.contract.Hex())
	return nil
}

func (s *EventService) initContractABI() error {
	// TokenBalance合约的ABI定义
	contractABI := `[{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "internalType": "address", "name": "to", "type": "address"},
			{"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
		],
		"name": "TokensMinted",
		"type": "event"
	}, {
		"anonymous": false,
		"inputs": [
			{"indexed": true, "internalType": "address", "name": "from", "type": "address"},
			{"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
		],
		"name": "TokensBurned",
		"type": "event"
	}, {
		"anonymous": false,
		"inputs": [
			{"indexed": true, "internalType": "address", "name": "from", "type": "address"},
			{"indexed": true, "internalType": "address", "name": "to", "type": "address"},
			{"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
			{"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
		],
		"name": "TokensTransferred",
		"type": "event"
	}]`

	parsedABI, err := abi.JSON(strings.NewReader(contractABI))
	if err != nil {
		return fmt.Errorf("解析合约ABI失败: %w", err)
	}

	s.abi = parsedABI
	return nil
}

func (s *EventService) syncHistoricalEvents() error {
	log.Println("开始同步历史事件...")

	// 获取当前最新区块
	latestBlock, err := s.client.BlockNumber(s.ctx)
	if err != nil {
		return fmt.Errorf("获取最新区块失败: %w", err)
	}

	// 从部署区块开始同步
	fromBlock := s.cfg.Ethereum.TokenContract.DeploymentBlock
	if fromBlock == 0 {
		fromBlock = 1
	}

	log.Printf("从区块 %d 同步到区块 %d", fromBlock, latestBlock)

	// 分批同步，每次处理1000个区块
	const batchSize = 1000
	for start := fromBlock; start <= latestBlock; start += batchSize {
		end := start + batchSize - 1
		if end > latestBlock {
			end = latestBlock
		}

		if err := s.syncBatch(start, end); err != nil {
			log.Printf("同步区块 %d-%d 失败: %v", start, end, err)
			continue
		}

		log.Printf("已同步区块 %d-%d", start, end)
	}

	log.Println("历史事件同步完成")
	return nil
}

func (s *EventService) syncBatch(startBlock, endBlock uint64) error {
	// 创建查询过滤器
	query := ethereum.FilterQuery{
		Addresses: []common.Address{s.contract},
		FromBlock: new(big.Int).SetUint64(startBlock),
		ToBlock:   new(big.Int).SetUint64(endBlock),
		Topics: [][]common.Hash{
			{
				s.abi.Events["TokensMinted"].ID,
				s.abi.Events["TokensBurned"].ID,
				s.abi.Events["TokensTransferred"].ID,
			},
		},
	}

	// 获取日志
	logs, err := s.client.FilterLogs(s.ctx, query)
	if err != nil {
		return fmt.Errorf("获取日志失败: %w", err)
	}

	// 处理每一条日志
	for _, vLog := range logs {
		event, err := s.parseLog(vLog)
		if err != nil {
			log.Printf("解析日志失败: %v", err)
			continue
		}

		if err := s.processEvent(event); err != nil {
			log.Printf("处理事件失败: %v", err)
			continue
		}
	}

	return nil
}

func (s *EventService) listenForNewEvents() {
	log.Println("开始监听新事件...")

	// 创建查询过滤器
	query := ethereum.FilterQuery{
		Addresses: []common.Address{s.contract},
		Topics: [][]common.Hash{
			{
				s.abi.Events["TokensMinted"].ID,
				s.abi.Events["TokensBurned"].ID,
				s.abi.Events["TokensTransferred"].ID,
			},
		},
	}

	// 订阅新事件
	logs := make(chan types.Log)
	sub, err := s.client.SubscribeFilterLogs(s.ctx, query, logs)
	if err != nil {
		log.Printf("订阅事件失败: %v", err)
		return
	}

	defer sub.Unsubscribe()

	for {
		select {
		case err := <-sub.Err():
			log.Printf("订阅错误: %v", err)
			return
		case vLog := <-logs:
			event, err := s.parseLog(vLog)
			if err != nil {
				log.Printf("解析实时日志失败: %v", err)
				continue
			}

			if err := s.processEvent(event); err != nil {
				log.Printf("处理实时事件失败: %v", err)
				continue
			}
		case <-s.ctx.Done():
			log.Println("停止事件监听")
			return
		}
	}
}

func (s *EventService) parseLog(vLog types.Log) (*TokenEvent, error) {
	event := &TokenEvent{
		TxHash:      vLog.TxHash,
		BlockNumber: vLog.BlockNumber,
		LogIndex:    vLog.Index,
		BlockHash:   vLog.BlockHash,
		Topics:      vLog.Topics,
		Data:        vLog.Data,
	}

	// 获取区块时间戳
	header, err := s.client.HeaderByNumber(s.ctx, new(big.Int).SetUint64(vLog.BlockNumber))
	if err != nil {
		return nil, fmt.Errorf("获取区块头失败: %w", err)
	}
	event.Timestamp = time.Unix(int64(header.Time), 0)

	// 根据事件ID解析事件
	switch vLog.Topics[0] {
	case s.abi.Events["TokensMinted"].ID:
		event.EventName = "mint"
		return s.parseMintEvent(vLog, event)
	case s.abi.Events["TokensBurned"].ID:
		event.EventName = "burn"
		return s.parseBurnEvent(vLog, event)
	case s.abi.Events["TokensTransferred"].ID:
		event.EventName = "transfer"
		return s.parseTransferEvent(vLog, event)
	default:
		return nil, fmt.Errorf("未知的事件ID: %s", vLog.Topics[0].Hex())
	}
}

func (s *EventService) parseMintEvent(vLog types.Log, event *TokenEvent) (*TokenEvent, error) {
	if len(vLog.Topics) < 2 {
		return nil, fmt.Errorf("mint事件主题数量不足")
	}

	// 解析参数
	var mintEvent struct {
		To        common.Address
		Amount    *big.Int
		Timestamp *big.Int
	}

	if err := s.abi.UnpackIntoInterface(&mintEvent, "TokensMinted", vLog.Data); err != nil {
		return nil, fmt.Errorf("解析mint事件参数失败: %w", err)
	}

	mintEvent.To = common.HexToAddress(vLog.Topics[1].Hex())

	event.UserAddress = mintEvent.To
	event.Amount = mintEvent.Amount
	event.FromAddress = common.Address{}
	event.ToAddress = mintEvent.To

	return event, nil
}

func (s *EventService) parseBurnEvent(vLog types.Log, event *TokenEvent) (*TokenEvent, error) {
	if len(vLog.Topics) < 2 {
		return nil, fmt.Errorf("burn事件主题数量不足")
	}

	// 解析参数
	var burnEvent struct {
		From      common.Address
		Amount    *big.Int
		Timestamp *big.Int
	}

	if err := s.abi.UnpackIntoInterface(&burnEvent, "TokensBurned", vLog.Data); err != nil {
		return nil, fmt.Errorf("解析burn事件参数失败: %w", err)
	}

	burnEvent.From = common.HexToAddress(vLog.Topics[1].Hex())

	event.UserAddress = burnEvent.From
	event.Amount = burnEvent.Amount
	event.FromAddress = burnEvent.From
	event.ToAddress = common.Address{}

	return event, nil
}

func (s *EventService) parseTransferEvent(vLog types.Log, event *TokenEvent) (*TokenEvent, error) {
	if len(vLog.Topics) < 3 {
		return nil, fmt.Errorf("transfer事件主题数量不足")
	}

	// 解析参数
	var transferEvent struct {
		Amount    *big.Int
		Timestamp *big.Int
	}

	if err := s.abi.UnpackIntoInterface(&transferEvent, "TokensTransferred", vLog.Data); err != nil {
		return nil, fmt.Errorf("解析transfer事件参数失败: %w", err)
	}

	from := common.HexToAddress(vLog.Topics[1].Hex())
	to := common.HexToAddress(vLog.Topics[2].Hex())

	event.UserAddress = from // 发送方
	event.Amount = transferEvent.Amount
	event.FromAddress = from
	event.ToAddress = to

	return event, nil
}

func (s *EventService) processEvent(event *TokenEvent) error {
	// 检查事件是否已经处理过
	var existingLog database.EventLog
	if err := s.db.Where("tx_hash = ? AND log_index = ?", event.TxHash.Hex(), event.LogIndex).First(&existingLog).Error; err == nil {
		// 事件已经处理过
		return nil
	}

	// 保存事件日志
	eventLog := database.EventLog{
		TxHash:      event.TxHash.Hex(),
		BlockNumber: event.BlockNumber,
		LogIndex:    event.LogIndex,
		BlockHash:   event.BlockHash.Hex(),
		Address:     s.contract.Hex(),
		EventName:   event.EventName,
		Data:        fmt.Sprintf("0x%x", event.Data),
		Topics:      fmt.Sprintf("%v", event.Topics),
		Timestamp:   event.Timestamp,
		IsProcessed:  false,
		ChainID:     s.cfg.Ethereum.ChainID,
	}

	if err := s.db.Create(&eventLog).Error; err != nil {
		return fmt.Errorf("保存事件日志失败: %w", err)
	}

	// 处理用户余额变动
	if err := s.updateUserBalance(event); err != nil {
		return fmt.Errorf("更新用户余额失败: %w", err)
	}

	// 标记事件为已处理
	now := time.Now()
	eventLog.IsProcessed = true
	eventLog.ProcessedAt = &now
	if err := s.db.Save(&eventLog).Error; err != nil {
		return fmt.Errorf("更新事件处理状态失败: %w", err)
	}

	log.Printf("处理事件成功: %s %s -> %d", event.EventName, event.UserAddress.Hex(), event.Amount)
	return nil
}

func (s *EventService) updateUserBalance(event *TokenEvent) error {
	tx := s.db.Begin()

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	userAddr := event.UserAddress.Hex()

	// 获取或创建用户
	var user database.User
	if err := tx.Where("address = ?", userAddr).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 创建新用户
			user = database.User{
				Address:     userAddr,
				Balance:     decimal.Zero,
				TotalPoints: decimal.Zero,
			}
			if err := tx.Create(&user).Error; err != nil {
				tx.Rollback()
				return fmt.Errorf("创建用户失败: %w", err)
			}
		} else {
			tx.Rollback()
			return fmt.Errorf("查询用户失败: %w", err)
		}
	}

	// 计算余额变动
	amountDecimal := decimal.NewFromBigInt(event.Amount, -18) // 假设18位小数
	balanceBefore := user.Balance

	switch event.EventName {
	case "mint":
		user.Balance = user.Balance.Add(amountDecimal)
	case "burn":
		user.Balance = user.Balance.Sub(amountDecimal)
	case "transfer":
		user.Balance = user.Balance.Sub(amountDecimal)
		// 如果是转账，还需要更新接收方
		if err := s.updateTransferRecipient(tx, event.ToAddress.Hex(), amountDecimal); err != nil {
			tx.Rollback()
			return fmt.Errorf("更新接收方余额失败: %w", err)
		}
	}

	// 保存用户余额
	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("保存用户余额失败: %w", err)
	}

	// 记录余额变动历史
	history := database.UserBalanceHistory{
		UserID:        user.ID,
		Address:       userAddr,
		FromAddress:   event.FromAddress.Hex(),
		ToAddress:     event.ToAddress.Hex(),
		Amount:        amountDecimal,
		BalanceBefore: balanceBefore,
		BalanceAfter:  user.Balance,
		EventType:     event.EventName,
		TxHash:        event.TxHash.Hex(),
		BlockNumber:   event.BlockNumber,
		LogIndex:      event.LogIndex,
		BlockHash:     event.BlockHash.Hex(),
		Timestamp:     event.Timestamp,
		ChainID:       s.cfg.Ethereum.ChainID,
	}

	if err := tx.Create(&history).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("创建余额历史记录失败: %w", err)
	}

	return tx.Commit().Error
}

func (s *EventService) updateTransferRecipient(tx *gorm.DB, recipientAddr string, amount decimal.Decimal) error {
	// 获取或创建接收方用户
	var recipient database.User
	if err := tx.Where("address = ?", recipientAddr).First(&recipient).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 创建新用户
			recipient = database.User{
				Address:     recipientAddr,
				Balance:     decimal.Zero,
				TotalPoints: decimal.Zero,
			}
			if err := tx.Create(&recipient).Error; err != nil {
				return fmt.Errorf("创建接收方用户失败: %w", err)
			}
		} else {
			return fmt.Errorf("查询接收方用户失败: %w", err)
		}
	}

	// 更新接收方余额
	balanceBefore := recipient.Balance
	recipient.Balance = recipient.Balance.Add(amount)

	if err := tx.Save(&recipient).Error; err != nil {
		return fmt.Errorf("保存接收方余额失败: %w", err)
	}

	// 记录接收方余额变动历史
	history := database.UserBalanceHistory{
		UserID:        recipient.ID,
		Address:       recipientAddr,
		FromAddress:   "", // 这里可以从上下文获取发送方地址
		ToAddress:     recipientAddr,
		Amount:        amount,
		BalanceBefore: balanceBefore,
		BalanceAfter:  recipient.Balance,
		EventType:     "transfer_receive",
		TxHash:        "", // 这里可以从上下文获取tx hash
		BlockNumber:   0,
		LogIndex:      0,
		BlockHash:     "",
		Timestamp:     time.Now(),
		ChainID:       s.cfg.Ethereum.ChainID,
	}

	if err := tx.Create(&history).Error; err != nil {
		return fmt.Errorf("创建接收方余额历史记录失败: %w", err)
	}

	return nil
}

func (s *EventService) Stop() {
	if s.cancel != nil {
		s.cancel()
	}
	log.Println("事件监听服务已停止")
}

// GetDeploymentBlock 获取合约部署区块号
func (s *EventService) GetDeploymentBlock() uint64 {
	return s.cfg.Ethereum.TokenContract.DeploymentBlock
}

// GetLatestBlockNumber 获取最新区块号
func (s *EventService) GetLatestBlockNumber() (uint64, error) {
	return s.client.BlockNumber(s.ctx)
}

// SyncEventsFromToBlock 同步指定范围的区块事件
func (s *EventService) SyncEventsFromToBlock(fromBlock, toBlock uint64) error {
	log.Printf("同步区块事件: %d - %d", fromBlock, toBlock)
	
	// 分批同步
	const batchSize = 1000
	for start := fromBlock; start <= toBlock; start += batchSize {
		end := start + batchSize - 1
		if end > toBlock {
			end = toBlock
		}

		if err := s.syncBatch(start, end); err != nil {
			log.Printf("同步区块 %d-%d 失败: %v", start, end, err)
			continue
		}

		log.Printf("已同步区块 %d-%d", start, end)
	}

	return nil
}