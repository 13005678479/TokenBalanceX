-- TokenBalanceX 数据库初始化脚本

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS token_balance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE token_balance;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(42) NOT NULL PRIMARY KEY,
    balance VARCHAR(78) NOT NULL DEFAULT '0',
    total_points DECIMAL(20,8) NOT NULL DEFAULT 0.00000000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户余额历史表
CREATE TABLE IF NOT EXISTS user_balance_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    old_balance VARCHAR(78) NOT NULL,
    new_balance VARCHAR(78) NOT NULL,
    change_amount VARCHAR(78) NOT NULL,
    change_type ENUM('mint','burn','transfer_in','transfer_out') NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    block_number BIGINT UNSIGNED NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_address (user_address),
    INDEX idx_timestamp (timestamp),
    INDEX idx_tx_hash (tx_hash),
    FOREIGN KEY (user_address) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 积分记录表
CREATE TABLE IF NOT EXISTS points_records (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    points DECIMAL(20,8) NOT NULL,
    balance VARCHAR(78) NOT NULL,
    hours DECIMAL(10,4) NOT NULL,
    rate DECIMAL(10,8) NOT NULL DEFAULT 0.05000000,
    calculate_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_address (user_address),
    INDEX idx_calculate_date (calculate_date),
    FOREIGN KEY (user_address) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 事件日志表
CREATE TABLE IF NOT EXISTS event_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(50) NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    amount VARCHAR(78) NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    block_number BIGINT UNSIGNED NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_name (event_name),
    INDEX idx_user_address (user_address),
    INDEX idx_timestamp (timestamp),
    INDEX idx_tx_hash (tx_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户每日汇总表
CREATE TABLE IF NOT EXISTS user_daily_summary (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    summary_date DATE NOT NULL,
    opening_balance VARCHAR(78) NOT NULL,
    closing_balance VARCHAR(78) NOT NULL,
    volume_minted VARCHAR(78) NOT NULL DEFAULT '0',
    volume_burned VARCHAR(78) NOT NULL DEFAULT '0',
    transfer_in VARCHAR(78) NOT NULL DEFAULT '0',
    transfer_out VARCHAR(78) NOT NULL DEFAULT '0',
    points_earned DECIMAL(20,8) NOT NULL DEFAULT 0.00000000,
    average_balance VARCHAR(78) NOT NULL,
    hours_held DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_address (user_address),
    INDEX idx_summary_date (summary_date),
    UNIQUE KEY uk_user_date (user_address, summary_date),
    FOREIGN KEY (user_address) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统统计表
CREATE TABLE IF NOT EXISTS system_stats (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    total_users INT UNSIGNED NOT NULL DEFAULT 0,
    total_supply VARCHAR(78) NOT NULL DEFAULT '0',
    total_points DECIMAL(20,8) NOT NULL DEFAULT 0.00000000,
    active_users_24h INT UNSIGNED NOT NULL DEFAULT 0,
    transactions_24h INT UNSIGNED NOT NULL DEFAULT 0,
    total_transactions INT UNSIGNED NOT NULL DEFAULT 0,
    statistics_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_statistics_date (statistics_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入一些示例数据（可选）
INSERT IGNORE INTO system_stats (total_users, total_supply, statistics_date) 
VALUES (0, '1000000', CURDATE());

-- 显示表结构信息
SELECT 'Database initialized successfully!' as message;