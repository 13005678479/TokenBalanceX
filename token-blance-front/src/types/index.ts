// 用户相关类型
export interface User {
  address: string;
  balance: string;
  totalPoints: number;
  createdAt: string;
  updatedAt: string;
}

// 用户余额历史
export interface UserBalanceHistory {
  id: number;
  userAddress: string;
  oldBalance: string;
  newBalance: string;
  changeAmount: string;
  changeType: 'mint' | 'burn' | 'transfer_in' | 'transfer_out';
  txHash: string;
  blockNumber: number;
  timestamp: string;
}

// 积分记录
export interface PointsRecord {
  id: number;
  userAddress: string;
  points: number;
  balance: string;
  hours: number;
  rate: number;
  calculateDate: string;
  createdAt: string;
}

// 事件日志
export interface EventLog {
  id: number;
  eventName: string;
  userAddress: string;
  amount: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  data: string;
}

// 排行榜数据
export interface LeaderboardEntry {
  rank: number;
  address: string;
  balance: string;
  totalPoints: number;
  percentageChange?: number;
}

// 统计概览
export interface StatsOverview {
  totalUsers: number;
  totalSupply: string;
  totalPoints: number;
  activeUsers24h: number;
  transactions24h: number;
  totalTransactions: number;
}

// 每日统计
export interface DailyStats {
  date: string;
  newUsers: number;
  transactions: number;
  volume: string;
  pointsCalculated: number;
}

// API响应包装
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 分页数据
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 网络配置
export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  contractAddress: string;
  symbol: string;
  decimals: number;
}

// 合约交互参数
export interface ContractInteraction {
  to: string;
  amount: string;
  type: 'mint' | 'burn' | 'transfer';
}

// 交易状态
export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  confirmations: number;
  timestamp: string;
}

// 钱包信息
export interface WalletInfo {
  address: string;
  chainId: number;
  balance: string;
  connected: boolean;
}