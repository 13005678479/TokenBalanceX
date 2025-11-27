package config

import (
	"os"
	"strconv"
)

// Config 应用配置
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	LogLevel string
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port string
	Mode string
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

// JWTConfig JWT配置
type JWTConfig struct {
	Secret string
	Expire int
}

// LogConfig 日志配置结构体
type LogConfig struct {
	LogLevel    string
	LogFilePath string
	MaxFileSize int64
	MaxBackups  int
	MaxAge      int
}

// LoadConfig 加载配置
func LoadConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
			Mode: getEnv("SERVER_MODE", "debug"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "106.52.240.187"),
			Port:     getEnv("DB_PORT", "33306"),
			User:     getEnv("DB_USER", "root"),
			Password: getEnv("DB_PASSWORD", "password@2023"),
			DBName:   getEnv("DB_NAME", "token_balance"),
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", "yn98cryb98y4bcr9n2u49crnu43x9cru"),
			Expire: getEnvAsInt("JWT_EXPIRE", 24),
		},
		LogLevel: getEnv("LOG_LEVEL", "info"),
	}
}

// GetLogConfig 获取日志配置
func GetLogConfig() *LogConfig {
	logLevel := getEnv("LOG_LEVEL", "INFO")
	logFilePath := getEnv("LOG_FILE_PATH", "logs/app.log")
	maxFileSize, _ := strconv.ParseInt(getEnv("LOG_MAX_FILE_SIZE", "10485760"), 10, 64) // 10MB
	maxBackups, _ := strconv.Atoi(getEnv("LOG_MAX_BACKUPS", "5"))
	maxAge, _ := strconv.Atoi(getEnv("LOG_MAX_AGE", "30"))

	return &LogConfig{
		LogLevel:    logLevel,
		LogFilePath: logFilePath,
		MaxFileSize: maxFileSize,
		MaxBackups:  maxBackups,
		MaxAge:      maxAge,
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// GetDSN 获取数据库连接字符串
func (c *Config) GetDSN() string {
	return c.Database.User + ":" + c.Database.Password + 
		"@tcp(" + c.Database.Host + ":" + c.Database.Port + ")/" + 
		c.Database.DBName + "?charset=utf8mb4&parseTime=True&loc=Local"
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}