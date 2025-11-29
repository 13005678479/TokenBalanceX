package router

import (
	"token-balance/docs"
	"token-balance/internal/controllers"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// SetupRouter 设置路由
func SetupRouter(
	userController *controllers.UserController,
	eventController *controllers.EventController,
	pointsController *controllers.PointsController,
	statsController *controllers.StatsController,
	multiChainController *controllers.MultiChainController,
) *gin.Engine {
	r := gin.New()

	// 使用日志中间件
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// CORS中间件
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 配置Swagger文档
	docs.SwaggerInfo.BasePath = "/api/v1"
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "服务运行正常",
		})
	})

	// API v1路由组
	v1 := r.Group("/api/v1")
	{
		// 用户相关路由
		user := v1.Group("/users")
		{
			user.GET("/:address", userController.GetUserBalance)
			user.GET("/:address/history", userController.GetUserBalanceHistory)
			user.GET("/:address/points", userController.GetUserPoints)
		}

		// 事件相关路由
		events := v1.Group("/events")
		{
			events.GET("/", eventController.GetEvents)
			events.GET("/:id", eventController.GetEventByID)
		}

		// 积分相关路由
		points := v1.Group("/points")
		{
			points.GET("/leaderboard", pointsController.GetPointsLeaderboard)
			points.GET("/user/:address", pointsController.GetUserPointsSummary)
		}

		// 统计相关路由
		stats := v1.Group("/stats")
		{
			stats.GET("/system", statsController.GetSystemStats)
			stats.GET("/daily", statsController.GetDailyStats)
		}

		// 多链相关路由 (任务7: 完善多链支持)
		multiChain := v1.Group("/multichain")
		{
			multiChain.GET("/status", multiChainController.GetChainStatus)
			multiChain.POST("/start/:chain", multiChainController.StartChain)
			multiChain.POST("/stop/:chain", multiChainController.StopChain)
			multiChain.GET("/events/:chain", multiChainController.GetChainEvents)
		}
	}

	return r
}
