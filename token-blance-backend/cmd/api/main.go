package main

import (
	"token-balance/config"
	_ "token-balance/docs" // 导入生成的docs包，用于Swagger文档
	"token-balance/internal/controllers"
	"token-balance/internal/middleware"
	"token-balance/internal/router"
	"token-balance/internal/services"
	"token-balance/pkg/database"

	"github.com/gin-gonic/gin"
)

// @title TokenBalanceX API
// @version 1.0
// @description TokenBalanceX区块链代币余额追踪和积分计算系统API
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1
// @schemes http https
// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization
// @description Bearer token for authentication
func main() {
	// 加载配置
	cfg := config.LoadConfig()

	// 设置Gin模式
	gin.SetMode(cfg.Server.Mode)

	// 设置受信任的代理（避免warning）
	if cfg.Server.Mode == "release" {
		// 生产环境：仅信任特定代理
		gin.DefaultWriter = nil
		gin.DefaultErrorWriter = nil
	}

	// 初始化数据库
	db := database.InitDB()
	database.AutoMigrate(db)

	// 初始化服务
	userService := services.NewUserService(db)
	eventService, err := services.NewEventService(db, cfg)
	if err != nil {
		middleware.Error("初始化事件服务失败: %v", err)
		// 继续运行，但事件服务可能不可用
	}
	pointsService := services.NewPointsService(db)
	statsService := services.NewStatsService(db)

	// 初始化控制器
	userController := controllers.NewUserController(userService)
	eventController := controllers.NewEventController(eventService)
	pointsController := controllers.NewPointsController(pointsService)
	statsController := controllers.NewStatsController(statsService)

	// 启动后台服务
	if eventService != nil {
		go eventService.StartEventListener()
	}
	go pointsService.StartPointsCalculation()

	// 设置路由
	router := router.SetupRouter(userController, eventController, pointsController, statsController)

	// 启动服务器
	middleware.Info("服务器启动在端口: %s", cfg.Server.Port)
	middleware.Info("Swagger文档地址: http://localhost:%s/swagger/index.html", cfg.Server.Port)

	if err := router.Run(":" + cfg.Server.Port); err != nil {
		middleware.Error("服务器启动失败: %v", err)
	}
}
