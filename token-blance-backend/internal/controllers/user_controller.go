package controllers

import (
	"net/http"
	"token-balance/internal/services"

	"github.com/gin-gonic/gin"
)

// UserController 用户控制器
type UserController struct {
	userService *services.UserService
}

// NewUserController 创建用户控制器
func NewUserController(userService *services.UserService) *UserController {
	return &UserController{
		userService: userService,
	}
}

// GetUserBalance 获取用户余额
// @Summary 获取用户余额
// @Description 根据用户地址获取当前余额和总积分
// @Tags User
// @Param address path string true "用户地址"
// @Produce json
// @Success 200 {object} models.User
// @Router /api/v1/users/{address} [get]
func (uc *UserController) GetUserBalance(c *gin.Context) {
	address := c.Param("address")
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "用户地址不能为空",
		})
		return
	}

	user, err := uc.userService.GetUserByAddress(address)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user,
	})
}

// GetUserBalanceHistory 获取用户余额历史
// @Summary 获取用户余额历史
// @Description 获取指定用户的余额变动记录
// @Tags User
// @Param address path string true "用户地址"
// @Param page query int false "页码" default(1)
// @Param pageSize query int false "每页数量" default(20)
// @Produce json
// @Success 200 {object} models.PaginatedData
// @Router /api/v1/users/{address}/history [get]
func (uc *UserController) GetUserBalanceHistory(c *gin.Context) {
	address := c.Param("address")
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("pageSize", "20")

	history, err := uc.userService.GetUserBalanceHistory(address, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    history,
	})
}

// GetUserPoints 获取用户积分
// @Summary 获取用户积分
// @Description 获取指定用户的积分记录
// @Tags User
// @Param address path string true "用户地址"
// @Produce json
// @Success 200 {object} []models.PointsRecord
// @Router /api/v1/users/{address}/points [get]
func (uc *UserController) GetUserPoints(c *gin.Context) {
	address := c.Param("address")
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "用户地址不能为空",
		})
		return
	}

	points, err := uc.userService.GetUserPoints(address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    points,
	})
}
