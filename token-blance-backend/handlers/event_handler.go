package handlers

import (
	"strconv"

	"token-balance-backend/database"

	"github.com/gin-gonic/gin"
)

// GetRecentEvents 获取最近的事件列表
func (h *Handler) GetRecentEvents(c *gin.Context) {
	page, size, err := GetPaginationParams(c)
	if err != nil {
		BadRequest(c, "分页参数错误: "+err.Error())
		return
	}

	eventType := c.Query("event_type") // mint, burn, transfer
	address := c.Query("address")
	fromBlock := c.Query("from_block")
	toBlock := c.Query("to_block")

	var events []database.EventLog
	var total int64

	// 构建查询条件
	query := h.db.Model(&database.EventLog{})

	if eventType != "" {
		query = query.Where("event_name = ?", eventType)
	}
	if address != "" {
		query = query.Where("address = ? OR topics LIKE ?", address, "%"+address+"%")
	}
	if fromBlock != "" {
		if blockNum, err := strconv.ParseUint(fromBlock, 10, 64); err == nil {
			query = query.Where("block_number >= ?", blockNum)
		}
	}
	if toBlock != "" {
		if blockNum, err := strconv.ParseUint(toBlock, 10, 64); err == nil {
			query = query.Where("block_number <= ?", blockNum)
		}
	}

	// 查询总数
	if err := query.Count(&total).Error; err != nil {
		InternalError(c, "查询事件总数失败: "+err.Error())
		return
	}

	// 分页查询
	offset := (page - 1) * size
	if err := query.Order("timestamp DESC, block_number DESC").
		Limit(size).
		Offset(offset).
		Find(&events).Error; err != nil {
		InternalError(c, "查询事件列表失败: "+err.Error())
		return
	}

	// 格式化事件列表
	var formattedEvents []gin.H
	for _, event := range events {
		formattedEvents = append(formattedEvents, gin.H{
			"id":           event.ID,
			"tx_hash":      event.TxHash,
			"block_number": event.BlockNumber,
			"log_index":    event.LogIndex,
			"block_hash":   event.BlockHash,
			"address":      event.Address,
			"event_name":   event.EventName,
			"data":         event.Data,
			"topics":       event.Topics,
			"timestamp":    event.Timestamp,
			"is_processed": event.IsProcessed,
			"processed_at": event.ProcessedAt,
			"chain_id":     event.ChainID,
			"created_at":   event.CreatedAt,
			"updated_at":   event.UpdatedAt,
		})
	}

	SuccessWithPagination(c, formattedEvents, total, page, size)
}

// SyncEvents 手动同步事件
func (h *Handler) SyncEvents(c *gin.Context) {
	// 获取同步参数
	fromBlockStr := c.PostForm("from_block")
	toBlockStr := c.PostForm("to_block")

	var fromBlock, toBlock uint64
	var err error

	if fromBlockStr != "" {
		fromBlock, err = strconv.ParseUint(fromBlockStr, 10, 64)
		if err != nil {
			BadRequest(c, "from_block 参数错误: "+err.Error())
			return
		}
	} else {
		// 如果没有指定，从合约部署区块开始
		fromBlock = uint64(h.eventService.GetDeploymentBlock())
	}

	if toBlockStr != "" {
		toBlock, err = strconv.ParseUint(toBlockStr, 10, 64)
		if err != nil {
			BadRequest(c, "to_block 参数错误: "+err.Error())
			return
		}
	} else {
		// 如果没有指定，使用最新区块
		toBlock, err = h.eventService.GetLatestBlockNumber()
		if err != nil {
			InternalError(c, "获取最新区块失败: "+err.Error())
			return
		}
	}

	// 启动同步（在goroutine中）
	go func() {
		if err := h.eventService.SyncEventsFromToBlock(fromBlock, toBlock); err != nil {
			// 这里可以记录错误到日志
			return
		}
	}()

	Success(c, gin.H{
		"message":    "事件同步已启动",
		"from_block": fromBlock,
		"to_block":   toBlock,
		"status":     "processing",
	})
}

// GetEventStats 获取事件统计信息
func (h *Handler) GetEventStats(c *gin.Context) {
	// 统计各类型事件的数量
	var stats struct {
		TotalEvents    int64 `json:"total_events"`
		MintEvents     int64 `json:"mint_events"`
		BurnEvents     int64 `json:"burn_events"`
		TransferEvents int64 `json:"transfer_events"`
		ProcessedEvents int64 `json:"processed_events"`
		UnprocessedEvents int64 `json:"unprocessed_events"`
	}

	// 总事件数
	h.db.Model(&database.EventLog{}).Count(&stats.TotalEvents)

	// 各类型事件数
	h.db.Model(&database.EventLog{}).Where("event_name = 'mint'").Count(&stats.MintEvents)
	h.db.Model(&database.EventLog{}).Where("event_name = 'burn'").Count(&stats.BurnEvents)
	h.db.Model(&database.EventLog{}).Where("event_name = 'transfer'").Count(&stats.TransferEvents)

	// 处理状态统计
	h.db.Model(&database.EventLog{}).Where("is_processed = ?", true).Count(&stats.ProcessedEvents)
	h.db.Model(&database.EventLog{}).Where("is_processed = ?", false).Count(&stats.UnprocessedEvents)

	// 获取最新和最早的区块信息
	var latestEvent, earliestEvent database.EventLog
	h.db.Order("block_number DESC").First(&latestEvent)
	h.db.Order("block_number ASC").First(&earliestEvent)

	result := gin.H{
		"stats": stats,
		"latest_block": gin.H{
			"block_number": latestEvent.BlockNumber,
			"timestamp":    latestEvent.Timestamp,
		},
		"earliest_block": gin.H{
			"block_number": earliestEvent.BlockNumber,
			"timestamp":    earliestEvent.Timestamp,
		},
	}

	// 如果没有事件，返回空信息
	if stats.TotalEvents == 0 {
		result["latest_block"] = nil
		result["earliest_block"] = nil
	}

	Success(c, result)
}

// GetUnprocessedEvents 获取未处理的事件
func (h *Handler) GetUnprocessedEvents(c *gin.Context) {
	page, size, err := GetPaginationParams(c)
	if err != nil {
		BadRequest(c, "分页参数错误: "+err.Error())
		return
	}

	var events []database.EventLog
	var total int64

	// 查询未处理事件
	query := h.db.Model(&database.EventLog{}).Where("is_processed = ?", false)

	// 查询总数
	if err := query.Count(&total).Error; err != nil {
		InternalError(c, "查询未处理事件总数失败: "+err.Error())
		return
	}

	// 分页查询
	offset := (page - 1) * size
	if err := query.Order("timestamp ASC, block_number ASC").
		Limit(size).
		Offset(offset).
		Find(&events).Error; err != nil {
		InternalError(c, "查询未处理事件失败: "+err.Error())
		return
	}

	// 格式化事件列表
	var formattedEvents []gin.H
	for _, event := range events {
		formattedEvents = append(formattedEvents, gin.H{
			"id":           event.ID,
			"tx_hash":      event.TxHash,
			"block_number": event.BlockNumber,
			"log_index":    event.LogIndex,
			"block_hash":   event.BlockHash,
			"address":      event.Address,
			"event_name":   event.EventName,
			"data":         event.Data,
			"topics":       event.Topics,
			"timestamp":    event.Timestamp,
			"chain_id":     event.ChainID,
			"created_at":   event.CreatedAt,
		})
	}

	SuccessWithPagination(c, formattedEvents, total, page, size)
}