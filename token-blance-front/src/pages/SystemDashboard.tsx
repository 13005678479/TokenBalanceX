'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { statsApi, eventApi, pointsApi } from '@/services/api';
import { StatsOverview, DailyStats } from '@/types';
import { formatNumber, formatPercentage } from '@/utils/format';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Trophy,
  Target,
  Zap,
  Clock,
  Calendar,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { toast } from 'react-hot-toast';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DashboardState {
  stats: StatsOverview | null;
  dailyStats: DailyStats[];
  loading: boolean;
  error: string | null;
  timeRange: string;
  autoRefresh: boolean;
  refreshInterval: number;
}

const SystemDashboard: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<DashboardState>({
    stats: null,
    dailyStats: [],
    loading: true,
    error: null,
    timeRange: '7d',
    autoRefresh: true,
    refreshInterval: 30000 // 30秒
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 加载数据
  const loadData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [statsData, dailyData] = await Promise.all([
        statsApi.getOverview(),
        statsApi.getDailyStats(30)
      ]);
      
      setState(prev => ({
        ...prev,
        stats: statsData,
        dailyStats: dailyData,
        loading: false
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || '加载数据失败'
      }));
      toast.error('加载数据失败');
    }
  };

  // 初始加载
  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted]);

  // 自动刷新
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.autoRefresh) {
      interval = setInterval(loadData, state.refreshInterval);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.autoRefresh, state.refreshInterval]);

  // 处理时间范围筛选
  const filteredDailyStats = React.useMemo(() => {
    if (!state.dailyStats.length) return [];
    
    const now = new Date();
    const days = state.timeRange === '24h' ? 1 : 
               state.timeRange === '7d' ? 7 : 
               state.timeRange === '30d' ? 30 : 7;
    
    return state.dailyStats.slice(0, days);
  }, [state.dailyStats, state.timeRange]);

  // 图表数据准备
  const chartData = React.useMemo(() => {
    return filteredDailyStats.map(stat => ({
      date: stat.date,
      交易量: stat.transactions || 0,
      新用户: stat.newUsers || 0,
      积分计算: Math.round((stat.pointsCalculated || 0) * 100) / 100,
      代币总量: parseFloat(stat.tokenSupply || '0')
    }));
  }, [filteredDailyStats]);

  const pieData = React.useMemo(() => {
    if (!state.stats) return [];
    
    return [
      { name: '铸造事件', value: state.stats.mintEvents || 0, color: '#10B981' },
      { name: '销毁事件', value: state.stats.burnEvents || 0, color: '#EF4444' },
      { name: '转账事件', value: state.stats.transferEvents || 0, color: '#3B82F6' }
    ];
  }, [state.stats]);

  const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#6B7280'];

  const getChangeIcon = (value: number, threshold: number = 0) => {
    if (value > threshold) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (value < threshold) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const exportData = () => {
    const csvContent = [
      ['日期', '交易量', '新用户', '积分计算', '代币总量'].join(','),
      ...chartData.map(row => [
        row.date,
        row.交易量,
        row.新用户,
        row.积分计算,
        row.代币总量
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('仪表板数据已导出');
  };

  const updateState = (updates: Partial<DashboardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardBody className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
            <p className="text-gray-600 mb-4">{state.error}</p>
            <Button onClick={loadData} variant="outline">
              重试
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部控制栏 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">系统仪表板</h1>
            </div>
            <div className="flex items-center space-x-2">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={state.timeRange}
                onChange={(e) => updateState({ timeRange: e.target.value })}
              >
                <option value="24h">最近24小时</option>
                <option value="7d">最近7天</option>
                <option value="30d">最近30天</option>
              </select>
              <Button
                variant={state.autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => updateState({ autoRefresh: !state.autoRefresh })}
              >
                <div className={`w-4 h-4 mr-2 ${state.autoRefresh ? 'animate-pulse' : ''}`}>
                  {state.autoRefresh ? '🔄' : '⏸'}
                </div>
                {state.autoRefresh ? '自动刷新' : '手动'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={state.loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
                disabled={chartData.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 关键指标卡片 */}
        {state.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* 总用户数 */}
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full mr-4">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">总用户数</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(state.stats.totalUsers || 0)}
                    </p>
                    <div className="flex items-center mt-1">
                      {getChangeIcon(state.stats.userGrowth24h || 0)}
                      <span className={`text-sm ml-1 ${
                        (state.stats.userGrowth24h || 0) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(state.stats.userGrowth24h || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 总交易数 */}
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full mr-4">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">总交易数</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(state.stats.totalTransactions || 0)}
                    </p>
                    <div className="flex items-center mt-1">
                      {getChangeIcon(state.stats.transactionGrowth24h || 0)}
                      <span className={`text-sm ml-1 ${
                        (state.stats.transactionGrowth24h || 0) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(state.stats.transactionGrowth24h || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 总积分 */}
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-full mr-4">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">总积分</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(state.stats.totalPoints || 0)}
                    </p>
                    <div className="flex items-center mt-1">
                      {getChangeIcon(state.stats.pointsGrowth24h || 0)}
                      <span className={`text-sm ml-1 ${
                        (state.stats.pointsGrowth24h || 0) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(state.stats.pointsGrowth24h || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 代币总量 */}
            <Card>
              <CardBody className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-full mr-4">
                    <Target className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">代币总量</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(state.stats.totalSupply || 0, 4)}
                    </p>
                    <div className="flex items-center mt-1">
                      {getChangeIcon(state.stats.supplyGrowth24h || 0)}
                      <span className={`text-sm ml-1 ${
                        (state.stats.supplyGrowth24h || 0) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(state.stats.supplyGrowth24h || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 交易趋势图 */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <LineChart className="w-5 h-5 mr-2 text-blue-600" />
                交易趋势
              </h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="交易量" fill="#3B82F6" name="交易量" />
                  <Line yAxisId="right" type="monotone" dataKey="新用户" stroke="#10B981" strokeWidth={2} name="新用户" />
                  <Line yAxisId="right" type="monotone" dataKey="积分计算" stroke="#F59E0B" strokeWidth={2} name="积分计算" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* 事件类型分布 */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-green-600" />
                事件类型分布
              </h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>

        {/* 代币供应量趋势 */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BarChart className="w-5 h-5 mr-2 text-purple-600" />
              代币供应量趋势
            </h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="代币总量" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* 系统健康状态 */}
        {state.stats && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-600" />
                系统健康状态
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-green-800">API状态</div>
                    <div className="text-lg font-bold text-green-900">正常</div>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-blue-800">平均响应时间</div>
                    <div className="text-lg font-bold text-blue-900">
                      {state.stats.avgResponseTime || 0}ms
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                  <Zap className="w-5 h-5 text-yellow-600 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-yellow-800">最后更新</div>
                    <div className="text-lg font-bold text-yellow-900">
                      {new Date(state.stats.lastUpdated).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SystemDashboard;