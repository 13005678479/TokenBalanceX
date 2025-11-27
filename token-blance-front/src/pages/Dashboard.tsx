'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { statsApi, userApi } from '@/services/api';
import { StatsOverview, User } from '@/types';
import { formatNumber, formatPercentage } from '@/utils/format';
import { TrendingUp, TrendingDown, Users, Coins, Award, Activity } from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';

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
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{formatPercentage(Math.abs(change))}</span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { address, isConnected } = useWeb3();
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<User | null>(null);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const [statsData, userData] = await Promise.all([
        statsApi.getOverview(),
        address ? userApi.getUser(address).catch(() => null) : Promise.resolve(null)
      ]);
      
      setStats(statsData);
      setUserInfo(userData);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchStats();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please connect your wallet to view the dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your token balance and points</p>
      </div>

      {/* 错误状态 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 用户信息卡片 */}
      {userInfo && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Your Account</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatNumber(userInfo.balance, 4)} TBX
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatNumber(userInfo.totalPoints, 2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="text-sm text-gray-900">
                  {new Date(userInfo.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats ? formatNumber(stats.totalUsers) : '0'}
          change={5.2}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          loading={loading}
        />
        
        <StatCard
          title="Total Supply"
          value={stats ? `${formatNumber(stats.totalSupply, 0)} TBX` : '0'}
          change={2.8}
          icon={<Coins className="w-6 h-6 text-green-600" />}
          loading={loading}
        />
        
        <StatCard
          title="Total Points"
          value={stats ? formatNumber(stats.totalPoints, 0) : '0'}
          change={12.5}
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
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">24h Transactions</span>
                <span className="font-semibold">{stats ? formatNumber(stats.transactions24h) : '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Transactions</span>
                <span className="font-semibold">{stats ? formatNumber(stats.totalTransactions) : '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg. User Balance</span>
                <span className="font-semibold">
                  {stats && stats.totalUsers > 0 
                    ? `${formatNumber(parseFloat(stats.totalSupply) / stats.totalUsers, 4)} TBX`
                    : '0 TBX'
                  }
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Network</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Points Calculation</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Event Sync</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Syncing
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;