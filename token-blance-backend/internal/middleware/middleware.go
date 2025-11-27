package middleware

import (
	"log"
	"os"
)

// Logger 记录日志到文件
func LoggerToFile(filename string) {
	logFile, err := os.OpenFile(filename, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatal("无法打开日志文件:", err)
	}
	
	// 设置日志输出到文件
	log.SetOutput(logFile)
}

// CORS 跨域中间件
func CORS() {
	// CORS middleware implementation
}