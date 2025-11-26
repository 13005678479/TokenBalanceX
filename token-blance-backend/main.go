package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"token-balance-backend/config"
	"token-balance-backend/database"
	"token-balance-backend/handlers"
	"token-balance-backend/middleware"
	"token-balance-backend/services"
)

func main() {
	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("未找到.env文件，使用默认配置")
	}

	// 初始化配置
	cfg := config.LoadConfig()

	// 设置Gin模式
	gin.SetMode(cfg.GinMode)

	// 初始化数据库
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatal("数据库连接失败:", err)
	}

	// 自动迁移数据库表
	if err := database.AutoMigrate(db); err != nil {
		log.Fatal("数据库迁移失败:", err)
	}

	// 初始化服务
	eventService := services.NewEventService(db, cfg)
	pointsService := services.NewPointsService(db, cfg)
	userService := services.NewUserService(db)

	// 初始化处理器
	handler := handlers.NewHandler(eventService, pointsService, userService, db)

	// 启动事件监听服务
	go eventService.StartEventListener()

	// 启动积分计算定时任务
	go pointsService.StartPointsCalculation()

	// 创建日志目录
	if err := os.MkdirAll("logs", 0755); err != nil {
		log.Printf("创建日志目录失败: %v", err)
	}

	// 设置路由
	router := setupRouter(handler, cfg)

	// 启动服务器
	log.Printf("服务器启动在端口 %s", cfg.ServerPort)
	if err := router.Run(":" + cfg.ServerPort); err != nil {
		log.Fatal("服务器启动失败:", err)
	}
}

func setupRouter(handler *handlers.Handler, cfg *config.Config) *gin.Engine {
	router := gin.New()

	// 中间件
	router.Use(middleware.Logger())
	router.Use(middleware.Recovery())
	router.Use(middleware.CORS())

	// 健康检查
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "服务运行正常",
		})
	})

	// API v1 路由组
	v1 := router.Group("/api/v1")
	{
		// 用户相关接口
		users := v1.Group("/users")
		{
			users.GET("/:address", handler.GetUserBalance)
			users.GET("/:address/history", handler.GetUserBalanceHistory)
			users.GET("/:address/points", handler.GetUserPoints)
		}

		// 事件相关接口
		events := v1.Group("/events")
		{
			events.GET("/", handler.GetRecentEvents)
			events.POST("/sync", handler.SyncEvents)
		}

		// 积分相关接口
		points := v1.Group("/points")
		{
			points.GET("/leaderboard", handler.GetPointsLeaderboard)
			points.POST("/calculate", handler.CalculatePoints)
		}

		// 统计相关接口
		stats := v1.Group("/stats")
		{
			stats.GET("/overview", handler.GetStatsOverview)
			stats.GET("/daily", handler.GetDailyStats)
		}
	}

	return router
}