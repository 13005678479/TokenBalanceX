package middleware

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"gopkg.in/natefinch/lumberjack.v2"
	"token-balance/config"
)

var logger *lumberjack.Logger

// InitLogger 初始化日志
func InitLogger(cfg *config.Config) {
	logger = &lumberjack.Logger{
		Filename:   "logs/app.log",
		MaxSize:    100,
		MaxBackups: 10,
		MaxAge:     30,
		Compress:   true,
	}

	// 同时输出到控制台
	log.SetFlags(log.LstdFlags | log.Lshortfile)
}

// Info 记录信息日志
func Info(msg string, args ...interface{}) {
	log.Printf("[INFO] "+msg, args...)
	if logger != nil {
		message := fmt.Sprintf("[INFO] "+msg+"\n", args...)
		logger.Write([]byte(message))
	}
}

// Debug 记录调试日志
func Debug(msg string, args ...interface{}) {
	log.Printf("[DEBUG] "+msg, args...)
	if logger != nil {
		message := fmt.Sprintf("[DEBUG] "+msg+"\n", args...)
		logger.Write([]byte(message))
	}
}

// Warn 记录警告日志
func Warn(msg string, args ...interface{}) {
	log.Printf("[WARN] "+msg, args...)
	if logger != nil {
		message := fmt.Sprintf("[WARN] "+msg+"\n", args...)
		logger.Write([]byte(message))
	}
}

// Error 记录错误日志
func Error(msg string, args ...interface{}) {
	log.Printf("[ERROR] "+msg, args...)
	if logger != nil {
		message := fmt.Sprintf("[ERROR] "+msg+"\n", args...)
		logger.Write([]byte(message))
	}
}

// LoggerMiddleware Gin日志中间件
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		Info("Request: %s %s", c.Request.Method, c.Request.URL.Path)
		c.Next()
	}
}