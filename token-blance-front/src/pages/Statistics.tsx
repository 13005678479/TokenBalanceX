'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { statsApi } from '@/services/api';
import { StatsOverview, DailyStats } from '@/types';
import { formatNumber, formatLargeNumber, formatDate } from '@/utils/format';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Coins, 
  Award, 
  Activity,
  Calendar,
  Download
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { useWeb3 } from '@/contexts/Web3Context';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, loading }) => {
  const isPositive = change && change > 0;

  return (
    <Card>
      <CardBody className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              {icon}
            </div>
            <div>
              <p className="text-sm text-gray-600">{title}</p>
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              )}
            </div>
          </div>
          
          {change !== undefined && (
            <div className={`flex items-center space-x-1 text-sm ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingUp size={16} className="transform rotate-180" />}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  actions?: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, loading, actions }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {actions && <div className="flex space-x-2">{actions}</div>}
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loading text="Loading chart data..." />
          </div>
        ) : (
          children
        )}
      </CardBody>
    </Card>
  );
};

const Statistics: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useWeb3();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  // 获取统计数据
  const fetchStats = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [overviewData, dailyData] = await Promise.all([
        statsApi.getOverview(),
        statsApi.getDailyStats(timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 90)
      ]);
      
      setStats(overviewData);
      setDailyStats(dailyData);
    } catch (err: any) {
      console.error('Failed to fetch statistics:', err);
      setError(err.message || 'Failed to load statistics');
      
      // 使用模拟数据作为后备
      const mockStats: StatsOverview = {
        totalUsers: 1248,
        totalSupply: '5000000',
        totalPoints: 15420.5,
        activeUsers24h: 89,
        transactions24h: 234,
        totalTransactions: 12567
      };
      
      const mockDaily: DailyStats[] = [
        { date: '2024-01-21', newUsers: 12, transactions: 45, volume: '15000', pointsCalculated: 125.5 },
        { date: '2024-01-22', newUsers: 8, transactions: 38, volume: '12000', pointsCalculated: 98.3 },
        { date: '2024-01-23', newUsers: 15, transactions: 52, volume: '18000', pointsCalculated: 156.7 },
        { date: '2024-01-24', newUsers: 6, transactions: 41, volume: '13500', pointsCalculated: 112.2 },
        { date: '2024-01-25', newUsers: 18, transactions: 67, volume: '22000', pointsCalculated: 189.4 },
        { date: '2024-01-26', newUsers: 9, transactions: 43, volume: '14500', pointsCalculated: 123.8 },
        { date: '2024-01-27', newUsers: 11, transactions: 49, volume: '16500', pointsCalculated: 142.6 }
      ];
      
      setStats(mockStats);
      setDailyStats(mockDaily);
    } finally {
      setLoading(false);
    }
  };

  // 导出数据
  const handleExport = (format: 'json' | 'csv') => {
    const exportData = {
      overview: stats,
      daily: dailyStats,
      exportDate: new Date().toISOString(),
      timeRange
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `statistics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // CSV export logic would go here
      console.log('CSV export not implemented yet');
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchStats();
    }
  }, [isConnected, timeRange]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Connect your wallet to view statistics</p>
      </div>
    );
  }

  // 准备图表数据
  const volumeChartData = dailyStats.map(item => ({
    date: formatDate(item.date, 'short'),
    volume: parseFloat(item.volume) / 1000, // Convert to thousands
    transactions: item.transactions
  }));

  const usersChartData = dailyStats.map(item => ({
    date: formatDate(item.date, 'short'),
    newUsers: item.newUsers,
    points: item.pointsCalculated
  }));

  const pieChartData = stats ? [
    { name: 'Active Users', value: stats.activeUsers24h },
    { name: 'New Users', value: Math.max(0, stats.totalUsers * 0.05 - stats.activeUsers24h) },
    { name: 'Inactive Users', value: Math.max(0, stats.totalUsers - stats.activeUsers24h - stats.totalUsers * 0.05) }
  ] : [];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
          <p className="text-gray-600 mt-2">Analytics and insights for the TokenBalanceX ecosystem</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            icon={<Download size={16} />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* 错误状态 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={stats ? formatLargeNumber(stats.totalUsers) : '0'}
          change={8.2}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          loading={loading}
        />
        
        <StatCard
          title="Total Supply"
          value={stats ? `${formatLargeNumber(stats.totalSupply)} TBX` : '0'}
          change={2.5}
          icon={<Coins className="w-6 h-6 text-green-600" />}
          loading={loading}
        />
        
        <StatCard
          title="Total Points"
          value={stats ? formatLargeNumber(stats.totalPoints) : '0'}
          change={15.3}
          icon={<Award className="w-6 h-6 text-purple-600" />}
          loading={loading}
        />
        
        <StatCard
          title="24h Active Users"
          value={stats ? formatNumber(stats.activeUsers24h) : '0'}
          change={-2.1}
          icon={<Activity className="w-6 h-6 text-orange-600" />}
          loading={loading}
        />
        
        <StatCard
          title="24h Transactions"
          value={stats ? formatNumber(stats.transactions24h) : '0'}
          change={5.8}
          icon={<Activity className="w-6 h-6 text-blue-600" />}
          loading={loading}
        />
        
        <StatCard
          title="Total Transactions"
          value={stats ? formatLargeNumber(stats.totalTransactions) : '0'}
          change={12.4}
          icon={<Activity className="w-6 h-6 text-gray-600" />}
          loading={loading}
        />
      </div>

      {/* 图表网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 交易量和交易数图表 */}
        <ChartCard
          title="Trading Volume & Transactions"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="volume" fill="#3b82f6" name="Volume (K TBX)" />
              <Bar yAxisId="right" dataKey="transactions" fill="#10b981" name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 用户和积分增长图表 */}
        <ChartCard
          title="User Growth & Points"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usersChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="newUsers" stroke="#8b5cf6" name="New Users" />
              <Line yAxisId="right" type="monotone" dataKey="points" stroke="#f59e0b" name="Points" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 用户活跃度饼图 */}
        <ChartCard
          title="User Activity Distribution"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 关键指标 */}
        <ChartCard
          title="Key Metrics"
          loading={loading}
        >
          <div className="space-y-4">
            {stats && (
              <>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Average Transaction Volume</span>
                  <span className="font-medium">
                    {formatNumber(parseFloat(stats.totalSupply) / stats.totalTransactions, 2)} TBX
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Points per User</span>
                  <span className="font-medium">
                    {formatNumber(stats.totalPoints / stats.totalUsers, 2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Daily Active Rate</span>
                  <span className="font-medium">
                    {((stats.activeUsers24h / stats.totalUsers) * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Transaction Frequency</span>
                  <span className="font-medium">
                    {((stats.transactions24h / stats.activeUsers24h)).toFixed(1)} per user
                  </span>
                </div>
              </>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default Statistics;