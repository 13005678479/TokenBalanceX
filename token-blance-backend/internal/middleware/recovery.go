package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RecoveryMiddleware 恢复中间件
func RecoveryMiddleware() gin.HandlerFunc {
	return gin.Recovery()
}

// ErrorHandler 错误处理中间件
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// 处理请求过程中发生的错误
		if len(c.Errors) > 0 {
			lastError := c.Errors.Last()
			switch e := lastError.Err.(type) {
			case *gin.Error:
				// Gin框架错误
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": e.Error(),
				})
			default:
				// 其他类型错误
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Internal server error",
				})
			}
		}
	}
}