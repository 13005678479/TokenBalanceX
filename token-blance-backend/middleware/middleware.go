package middleware

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime/debug"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger 日志中间件
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 开始时间
		startTime := time.Now()

		// 处理请求
		c.Next()

		// 结束时间
		endTime := time.Now()

		// 执行时间
		latencyTime := endTime.Sub(startTime)

		// 请求方式
		reqMethod := c.Request.Method

		// 请求路由
		reqUri := c.Request.RequestURI

		// 状态码
		statusCode := c.Writer.Status()

		// 请求IP
		clientIP := c.ClientIP()

		// 日志格式
		log.Printf("[%s] %s %s %d %v %s",
			time.Now().Format("2006-01-02 15:04:05"),
			reqMethod,
			reqUri,
			statusCode,
			latencyTime,
			clientIP,
		)

		// 如果是错误状态码，记录错误堆栈
		if statusCode >= 500 {
			log.Printf("Error Stack: %s", debug.Stack())
		}
	}
}

// Recovery 恢复中间件
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// 记录错误日志
				log.Printf("Panic recovered: %v", err)
				log.Printf("Stack: %s", debug.Stack())

				// 返回500错误
				c.JSON(http.StatusInternalServerError, gin.H{
					"code":    500,
					"message": "Internal Server Error",
					"data":    nil,
				})

				// 阻止继续执行
				c.Abort()
			}
		}()

		c.Next()
	}
}

// CORS 跨域中间件
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		// 处理预检请求
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// RateLimit 限流中间件（简单实现）
func RateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 这里可以实现更复杂的限流逻辑
		// 比如使用Redis记录请求次数
		c.Next()
	}
}

// RequestSizeLimit 请求大小限制中间件
func RequestSizeLimit(maxSize int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查Content-Length
		if c.Request.ContentLength > maxSize {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{
				"code":    413,
				"message": "Request entity too large",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequestLogger 请求详情日志中间件
func RequestLogger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		// 只记录API请求
		if param.Path == "/health" {
			return ""
		}

		logMessage := "Time: %s, Method: %s, Path: %s, IP: %s, Status: %d, Latency: %v, Error: %s"

		return fmt.Sprintf(logMessage,
			param.TimeStamp.Format("2006-01-02 15:04:05"),
			param.Method,
			param.Path,
			param.ClientIP,
			param.StatusCode,
			param.Latency,
			param.ErrorMessage,
		)
	})
}

// SecureHeaders 安全头中间件
func SecureHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 设置安全相关的HTTP头
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Header("Content-Security-Policy", "default-src 'self'")

		c.Next()
	}
}

// FileLogger 文件日志中间件
func FileLogger() gin.HandlerFunc {
	// 确保日志目录存在
	if err := os.MkdirAll("logs", 0755); err != nil {
		log.Printf("创建日志目录失败: %v", err)
	}

	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		logEntry := fmt.Sprintf("[%s] %s %s %d %v %s",
			param.TimeStamp.Format("2006-01-02 15:04:05"),
			param.Method,
			param.Path,
			param.StatusCode,
			param.Latency,
			param.ClientIP,
		)

		// 异步写入文件
		go func() {
			if logFile, err := os.OpenFile("logs/access.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666); err == nil {
				defer logFile.Close()
				if _, err := logFile.WriteString(logEntry + "\n"); err != nil {
					log.Printf("写入日志文件失败: %v", err)
				}
			} else {
				log.Printf("打开日志文件失败: %v", err)
			}
		}()

		return ""
	})
}

// HealthCheck 健康检查中间件
func HealthCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.URL.Path == "/health" {
			c.JSON(200, gin.H{
				"status":  "ok",
				"message": "服务运行正常",
				"time":    time.Now().Format("2006-01-02 15:04:05"),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// APIVersion API版本中间件
func APIVersion(version string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("api_version", version)
		c.Next()
	}
}