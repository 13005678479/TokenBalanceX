package controllers

import (
	"math/big"
	"net/http"
	"time"
	"token-balance/internal/middleware"
	"token-balance/internal/models"
	"token-balance/internal/services"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/gin-gonic/gin"
)

// EventController 事件控制器
type EventController struct {
	eventService *services.EventService
}

// NewEventController 创建事件控制器
func NewEventController(eventService *services.EventService) *EventController {
	return &EventController{
		eventService: eventService,
	}
}

// GetRecentEvents 获取最近事件
// @Summary 获取最近事件
// @Description 获取最近的区块链事件记录
// @Tags Events
// @Param page query int false "页码" default(1)
// @Param pageSize query int false "每页数量" default(20)
// @Produce json
// @Success 200 {object} models.PaginatedData
// @Router /api/v1/events [get]
func (ec *EventController) GetRecentEvents(c *gin.Context) {
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("pageSize", "20")

	events, err := ec.eventService.GetRecentEvents(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    events,
	})
}

// SyncEvents 同步事件
// @Summary 同步区块链事件
// @Description 手动触发区块链事件同步
// @Tags Events
// @Produce json
// @Success 200 {object} models.SwaggerResponse
// @Router /api/v1/events/sync [post]
func (ec *EventController) SyncEvents(c *gin.Context) {
	err := ec.eventService.SyncEvents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "事件同步已启动",
	})
}

// GetEvents 获取事件列表（别名）
func (ec *EventController) GetEvents(c *gin.Context) {
	ec.GetRecentEvents(c)
}

// GetEventByID 获取单个事件（暂时返回错误）
func (ec *EventController) GetEventByID(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"success": false,
		"message": "此端点暂未实现",
	})
}

// saveEventLog 保存事件日志到数据库
func (es *EventService) saveEventLog(log *types.Log) {
	// 创建事件日志对象
	eventLog := models.EventLog{
		TxHash:      log.TxHash.Hex(),
		BlockNumber: log.BlockNumber,
		Data:        common.Bytes2Hex(log.Data),
		Timestamp:   time.Now(),
		Amount:      "0",       // 默认值
		EventName:   "Unknown", // 默认值
	}

	// 识别事件类型和用户地址
	if len(log.Topics) > 0 {
		// Transfer 事件签名: keccak256("Transfer(address,address,uint256)")
		transferEventSig := common.HexToHash("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")

		if log.Topics[0] == transferEventSig {
			eventLog.EventName = "Transfer"
			// Topics[1] = from (address), Topics[2] = to (address)
			if len(log.Topics) > 2 {
				// 记录接收方地址作为用户地址
				eventLog.UserAddress = common.BytesToAddress(log.Topics[2][:]).Hex()
			}

			// 从Data部分解析金额（uint256）
			if len(log.Data) >= 32 {
				amount := new(big.Int).SetBytes(log.Data[:32])
				eventLog.Amount = amount.String()
			}
		}
	}

	// 确保必需字段都有值
	if eventLog.UserAddress == "" {
		eventLog.UserAddress = "0x0000000000000000000000000000000000000000" // 默认地址
	}

	// 保存到数据库
	if err := es.db.Create(&eventLog).Error; err != nil {
		middleware.Error("保存事件日志失败: %v", err)
		return
	}

	middleware.Info("事件已保存到数据库: %s, TX=%s, 金额=%s", eventLog.EventName, eventLog.TxHash, eventLog.Amount)
}
