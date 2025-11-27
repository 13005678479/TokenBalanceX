'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { pointsApi } from '@/services/api';
import { LeaderboardEntry } from '@/types';
import { formatNumber, calculateGrowthRate, debounce } from '@/utils/format';
import { formatAddress } from '@/utils/web3';
import { 
  Trophy, Crown, Medal, Award, TrendingUp, TrendingDown, 
  Filter, Download, RefreshCw, ExternalLink, Calendar,
  Users, Target, Zap
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import { toast } from 'react-hot-toast';

interface LeaderboardState {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  timeRange: string;
  address: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  autoRefresh: boolean;
  refreshingInterval: number;
}

const PointsLeaderboard: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { address: currentUserAddress } = useWeb3();
  const [state, setState] = useState<LeaderboardState>({
    entries: [],
    loading: true,
    error: null,
    page: 1,
    pageSize: 50,
    total: 0,
    timeRange: 'all',
    address: '',
    sortBy: 'totalPoints',
    sortOrder: 'desc',
    autoRefresh: false,
    refreshingInterval: 30000 // 30秒
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPoints: 0,
    avgPoints: 0,
    topPoints: 0,
    activeUsers24h: 0,
    newPoints24h: 0
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 加载排行榜数据
  const loadLeaderboard = useCallback(async (resetPage = false) => {
    try {
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null,
        page: resetPage ? 1 : prev.page 
      }));
      
      const limit = resetPage ? state.pageSize : state.pageSize * state.page;
      const entries = await pointsApi.getLeaderboard(limit);
      
      setState(prev => ({
        ...prev,
        entries: resetPage ? entries : [...prev.entries, ...entries],
        loading: false,
        total: entries.length || 0
      }));
      
      // 计算统计信息
      if (resetPage && entries.length > 0) {
        const points = entries.map(e => Number(e.totalPoints)).filter(p => !isNaN(p));
        const totalPoints = points.reduce((sum, p) => sum + p, 0);
        const avgPoints = totalPoints / points.length;
        const topPoints = Math.max(...points);
        
        setStats({
          totalUsers: entries.length,
          totalPoints,
          avgPoints,
          topPoints,
          activeUsers24h: entries.filter(e => {
            const lastActive = new Date(e.lastActive);
            const dayAgo = new Date();
            dayAgo.setDate(dayAgo.getDate() - 1);
            return lastActive >= dayAgo;
          }).length,
          newPoints24h: entries.reduce((sum, e) => {
            const lastActive = new Date(e.lastActive);
            const dayAgo = new Date();
            dayAgo.setDate(dayAgo.getDate() - 1);
            if (lastActive >= dayAgo) {
              return sum + Number(e.todayPoints || 0);
            }
            return sum;
          }, 0)
        });
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || '加载排行榜失败'
      }));
      toast.error('加载排行榜失败');
    }
  }, [state.pageSize, state.refreshingInterval]);

  // 初始加载
  useEffect(() => {
    if (mounted) {
      loadLeaderboard(true);
    }
  }, [mounted, loadLeaderboard]);

  // 自动刷新
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.autoRefresh) {
      interval = setInterval(() => {
        loadLeaderboard(true);
      }, state.refreshingInterval);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.autoRefresh, state.refreshingInterval, loadLeaderboard]);

  // 筛选和排序逻辑
  const filteredEntries = useMemo(() => {
    let filtered = [...state.entries];
    
    // 地址筛选
    if (state.address.trim()) {
      filtered = filtered.filter(entry => 
        entry.address.toLowerCase().includes(state.address.toLowerCase())
      );
    }
    
    // 时间范围筛选 (这里需要后端支持时间范围查询)
    // 暂时在前端模拟筛选
    if (state.timeRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.lastActive);
        
        switch (state.timeRange) {
          case '24h':
            return (now.getTime() - entryDate.getTime()) <= 24 * 60 * 60 * 1000;
          case '7d':
            return (now.getTime() - entryDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
          case '30d':
            return (now.getTime() - entryDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
          default:
            return true;
        }
      });
    }
    
    // 排序
    filtered.sort((a, b) => {
      let aValue: any = a[state.sortBy as keyof LeaderboardEntry];
      let bValue: any = b[state.sortBy as keyof LeaderboardEntry];
      
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';
      
      // 处理数字字段
      if (typeof aValue === 'string') {
        aValue = Number(aValue) || 0;
      }
      if (typeof bValue === 'string') {
        bValue = Number(bValue) || 0;
      }
      
      if (state.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [state.entries, state.address, state.timeRange, state.sortBy, state.sortOrder]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-lg';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg';
      default:
        return rank <= 10 
          ? 'bg-blue-100 text-blue-800 border border-blue-200'
          : 'bg-gray-100 text-gray-800';
    }
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (growth < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  const exportData = () => {
    const csvContent = [
      ['排名', '地址', '总积分', '今日积分', '本周积分', '本月积分', '最后活跃时间', '增长率'].join(','),
      ...filteredEntries.map(entry => [
        (filteredEntries.indexOf(entry) + 1).toString(),
        entry.address,
        entry.totalPoints,
        entry.todayPoints || '0',
        entry.weekPoints || '0',
        entry.monthPoints || '0',
        entry.lastActive,
        calculateGrowthRate(entry.todayPoints, entry.yesterdayPoints) + '%'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaderboard_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('排行榜数据已导出');
  };

  const loadMore = () => {
    if (state.loading) return;
    loadLeaderboard();
  };

  const resetFilters = () => {
    setState(prev => ({
      ...prev,
      timeRange: 'all',
      address: '',
      sortBy: 'totalPoints',
      sortOrder: 'desc'
    }));
  };

  const updateState = (updates: Partial<LeaderboardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 统计概览 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
              <div className="text-sm opacity-90">总用户数</div>
            </div>
            
            <div className="text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatNumber(stats.totalPoints)}</div>
              <div className="text-sm opacity-90">总积分</div>
            </div>
            
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatNumber(Math.round(stats.avgPoints))}</div>
              <div className="text-sm opacity-90">平均积分</div>
            </div>
            
            <div className="text-center">
              <Crown className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatNumber(stats.topPoints)}</div>
              <div className="text-sm opacity-90">最高积分</div>
            </div>
            
            <div className="text-center">
              <Zap className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatNumber(stats.activeUsers24h)}</div>
              <div className="text-sm opacity-90">24h活跃用户</div>
            </div>
            
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatNumber(stats.newPoints24h)}</div>
              <div className="text-sm opacity-90">24h新增积分</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 筛选和控制面板 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">积分排行榜</h3>
              </div>
              <div className="flex items-center space-x-2">
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
                  onClick={() => loadLeaderboard(true)}
                  disabled={state.loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
                  刷新
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportData}
                  disabled={filteredEntries.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* 地址搜索 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">搜索地址</label>
                <Input
                  placeholder="输入钱包地址..."
                  value={state.address}
                  onChange={(e) => updateState({ address: e.target.value })}
                />
              </div>

              {/* 时间范围 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">时间范围</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={state.timeRange}
                  onChange={(e) => updateState({ timeRange: e.target.value })}
                >
                  <option value="all">全部时间</option>
                  <option value="24h">最近24小时</option>
                  <option value="7d">最近7天</option>
                  <option value="30d">最近30天</option>
                </select>
              </div>

              {/* 排序字段 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">排序方式</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={state.sortBy}
                  onChange={(e) => updateState({ sortBy: e.target.value })}
                >
                  <option value="totalPoints">总积分</option>
                  <option value="todayPoints">今日积分</option>
                  <option value="weekPoints">本周积分</option>
                  <option value="monthPoints">本月积分</option>
                  <option value="lastActive">最后活跃</option>
                </select>
              </div>

              {/* 排序顺序 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">排序顺序</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={state.sortOrder}
                  onChange={(e) => updateState({ sortOrder: e.target.value as 'asc' | 'desc' })}
                >
                  <option value="desc">降序</option>
                  <option value="asc">升序</option>
                </select>
              </div>

              {/* 刷新间隔 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">刷新间隔(秒)</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={state.refreshingInterval / 1000}
                  onChange={(e) => updateState({ refreshingInterval: Number(e.target.value) * 1000 })}
                  disabled={!state.autoRefresh}
                >
                  <option value={10}>10秒</option>
                  <option value={30}>30秒</option>
                  <option value={60}>60秒</option>
                  <option value={300}>5分钟</option>
                </select>
              </div>

              {/* 每页显示 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">每页显示</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={state.pageSize}
                  onChange={(e) => updateState({ pageSize: Number(e.target.value) })}
                >
                  <option value={20}>20条</option>
                  <option value={50}>50条</option>
                  <option value={100}>100条</option>
                  <option value={200}>200条</option>
                </select>
              </div>

              {/* 重置筛选 */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  重置筛选
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 排行榜列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">排行榜</h3>
              <div className="text-sm text-gray-500">
                显示 {filteredEntries.length} 条记录
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {state.loading && filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <Loading />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暂无排行榜数据</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry, index) => {
                  const isCurrentUser = currentUserAddress && 
                    entry.address.toLowerCase() === currentUserAddress.toLowerCase();
                  const rank = index + 1;
                  const growth = calculateGrowthRate(entry.todayPoints, entry.yesterdayPoints);
                  
                  return (
                    <div
                      key={entry.address}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                        isCurrentUser 
                          ? 'bg-blue-50 border-blue-200 shadow-lg' 
                          : 'bg-white border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        {/* 排名 */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getRankBadge(rank)}`}>
                          {getRankIcon(rank)}
                        </div>
                        
                        {/* 用户信息 */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'}`}>
                              {isCurrentUser ? '您' : formatAddress(entry.address, 8)}
                            </span>
                            {isCurrentUser && (
                              <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                                当前用户
                              </span>
                            )}
                            {getGrowthIcon(growth) && (
                              <span className={`flex items-center text-sm ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {getGrowthIcon(growth)}
                                {growth > 0 ? '+' : ''}{growth}%
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            最后活跃: {new Date(entry.lastActive).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {/* 积分信息 */}
                      <div className="text-right">
                        <div className={`text-xl font-bold ${isCurrentUser ? 'text-blue-600' : 'text-gray-900'}`}>
                          {formatNumber(entry.totalPoints)}
                        </div>
                        <div className="text-sm text-gray-600">总积分</div>
                        
                        <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                          <div>
                            <div className="text-gray-500">今日</div>
                            <div className="font-medium text-green-600">
                              +{formatNumber(entry.todayPoints || '0')}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">本周</div>
                            <div className="font-medium text-blue-600">
                              +{formatNumber(entry.weekPoints || '0')}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">本月</div>
                            <div className="font-medium text-purple-600">
                              +{formatNumber(entry.monthPoints || '0')}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/users/${entry.address}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default PointsLeaderboard;