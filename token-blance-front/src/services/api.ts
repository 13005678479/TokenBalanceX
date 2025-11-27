import axios from 'axios';
import { ApiResponse, PaginatedData, User, UserBalanceHistory, PointsRecord, EventLog, LeaderboardEntry, StatsOverview, DailyStats } from '@/types';
import { API_BASE_URL } from '@/lib/constants';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    return Promise.reject(error);
  }
);

// 用户相关API
export const userApi = {
  // 获取用户信息
  getUser: async (address: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/api/v1/users/${address}`);
    return response.data.data;
  },

  // 获取用户余额历史
  getUserHistory: async (
    address: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<PaginatedData<UserBalanceHistory>> => {
    const response = await api.get<ApiResponse<PaginatedData<UserBalanceHistory>>>(
      `/api/v1/users/${address}/history?page=${page}&pageSize=${pageSize}`
    );
    return response.data.data;
  },

  // 获取用户积分信息
  getUserPoints: async (address: string): Promise<PointsRecord[]> => {
    const response = await api.get<ApiResponse<PointsRecord[]>>(`/api/v1/users/${address}/points`);
    return response.data.data;
  },
};

// 事件相关API
export const eventApi = {
  // 获取最近事件列表
  getEvents: async (
    page: number = 1, 
    pageSize: number = 20
  ): Promise<PaginatedData<EventLog>> => {
    const response = await api.get<ApiResponse<PaginatedData<EventLog>>>(
      `/api/v1/events?page=${page}&pageSize=${pageSize}`
    );
    return response.data.data;
  },

  // 手动同步事件
  syncEvents: async (): Promise<void> => {
    await api.post('/api/v1/events/sync');
  },
};

// 积分相关API
export const pointsApi = {
  // 获取积分排行榜
  getLeaderboard: async (
    limit: number = 50
  ): Promise<LeaderboardEntry[]> => {
    const response = await api.get<ApiResponse<LeaderboardEntry[]>>(
      `/api/v1/points/leaderboard?limit=${limit}`
    );
    return response.data.data;
  },

  // 手动计算积分
  calculatePoints: async (
    fromDate?: string, 
    toDate?: string
  ): Promise<void> => {
    const params: any = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    
    await api.post('/api/v1/points/calculate', params);
  },
};

// 统计相关API
export const statsApi = {
  // 获取系统概览
  getOverview: async (): Promise<StatsOverview> => {
    const response = await api.get<ApiResponse<StatsOverview>>('/api/v1/stats/overview');
    return response.data.data;
  },

  // 获取每日统计
  getDailyStats: async (
    days: number = 30
  ): Promise<DailyStats[]> => {
    const response = await api.get<ApiResponse<DailyStats[]>>(
      `/api/v1/stats/daily?days=${days}`
    );
    return response.data.data;
  },
};

// 健康检查
export const healthApi = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;