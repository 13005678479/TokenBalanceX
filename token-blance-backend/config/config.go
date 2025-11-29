package config

import (
	"bufio"
	"os"
	"strconv"
	"strings"
)

// Config 应用程序配置结构
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Ethereum EthereumConfig
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
	DBName   string
	Password string
}

// EthereumConfig 以太坊配置
type EthereumConfig struct {
	RPCEndpoint     string
	ChainID         int64
	ContractAddress string
	PrivateKey      string
	SepoliaRPCURL   string
	// 🔗 多链支持配置
	BaseSepoliaRPCURL string
}

// ChainConfig 链配置
//
// 任务7: ❌ 需要支持多链逻辑，比如支持sepolia， base sepolia
//
// 当前状态：
// ❌ 仅支持Sepolia单链 (已完成架构设计，未完全实现)
// ✅ 配置结构设计完成
// ✅ 环境变量支持
// ❌ 多链事件监听 (待实现)
// ❌ 链切换逻辑 (待实现)
//
// 支持的链配置：
// - ✅ Sepolia (ChainID: 11155111) - 以太坊测试网
// - ⚠️ Base Sepolia (ChainID: 84532) - Base测试网 (架构完成，未激活)
//
// 使用方式：
// 1. 在.env中配置对应RPC地址
// 2. 调用GetSupportedChains()获取配置
// 3. 为每个链创建独立的事件监听器
type ChainConfig struct {
	Name         string `json:"name"`         // 链名称 ("Sepolia", "Base Sepolia")
	RPCURL       string `json:"rpc_url"`      // RPC端点地址
	ChainID      int64  `json:"chain_id"`     // 链ID (用于网络识别)
	ContractAddr  string `json:"contract_address"` // 代币合约地址 (每链可以不同)
	Enabled      bool   `json:"enabled"`      // 是否启用该链
}

// GetSupportedChains 获取支持的链配置
func (c *Config) GetSupportedChains() map[string]ChainConfig {
	chains := make(map[string]ChainConfig)
	
	// Sepolia 测试网
	if c.Ethereum.SepoliaRPCURL != "" {
		chains["sepolia"] = ChainConfig{
			Name:         "Sepolia",
			RPCURL:       c.Ethereum.SepoliaRPCURL,
			ChainID:      11155111,
			ContractAddr:  c.Ethereum.ContractAddress,
			Enabled:      true,
		}
	}
	
	// Base Sepolia 测试网
	if c.Ethereum.BaseSepoliaRPCURL != "" {
		chains["base-sepolia"] = ChainConfig{
			Name:         "Base Sepolia",
			RPCURL:       c.Ethereum.BaseSepoliaRPCURL,
			ChainID:      84532,
			ContractAddr:  c.Ethereum.ContractAddress,
			Enabled:      true,
		}
	}
	
	return chains
}

// JWTConfig JWT配置
type JWTConfig struct {
	Secret string
	Expire int // 过期时间（小时）
}

// LoadConfig 加载配置
func LoadConfig() *Config {
	// 尝试加载.env文件
	loadEnvFile(".env")

	return &Config{
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
			Mode: getEnv("SERVER_MODE", "debug"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "3306"),
			User:     getEnv("DB_USER", "root"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "token_balance"),
		},
		Ethereum: EthereumConfig{
			RPCEndpoint:      getEnv("ETHEREUM_RPC", "http://localhost:8545"),
			ChainID:          getEnvInt64("ETHEREUM_CHAIN_ID", 31337),
			ContractAddress:  getEnv("TOKEN_CONTRACT_ADDRESS", ""),
			PrivateKey:       getEnv("PRIVATE_KEY", ""),
			SepoliaRPCURL:    getEnv("SEPOLIA_RPC_URL", "https://sepolia.infura.io/v3/"),
			BaseSepoliaRPCURL: getEnv("BASE_SEPOLIA_RPC_URL", ""),
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", "token-balance-secret-key"),
			Expire: getEnvInt("JWT_EXPIRE", 24),
		},
		LogLevel: getEnv("LOG_LEVEL", "info"),
	}
}

// GetDSN 获取数据库连接字符串
func (c *DatabaseConfig) GetDSN() string {
	return c.User + ":" + c.Password + "@tcp(" + c.Host + ":" + c.Port + ")/" + c.DBName + "?charset=utf8mb4&parseTime=True&loc=Local"
}

// GetDBDSN 获取数据库连接字符串（用于Config结构）
func (c *Config) GetDBDSN() string {
	return c.Database.User + ":" + c.Database.Password + "@tcp(" + c.Database.Host + ":" + c.Database.Port + ")/" + c.Database.DBName + "?charset=utf8mb4&parseTime=True&loc=Local"
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvInt 获取整数环境变量
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// getEnvInt64 获取64位整数环境变量
func getEnvInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// loadEnvFile 从.env文件加载环境变量
func loadEnvFile(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		// .env文件不存在或无法读取，使用系统环境变量
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		// 跳过注释和空行
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// 解析 KEY=VALUE
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])
			// 只有在环境变量未设置时才从.env文件中读取
			if os.Getenv(key) == "" {
				os.Setenv(key, value)
			}
		}
	}
}
