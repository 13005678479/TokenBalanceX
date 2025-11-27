'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { userApi } from '@/services/api';
import { User, UserBalanceHistory, PointsRecord, PaginatedData } from '@/types';
import { formatAddress, formatBalance, formatTime } from '@/utils/web3';
import { formatNumber, debounce } from '@/utils/format';
import { useWeb3 } from '@/contexts/Web3Context';
import { 
  User as UserIcon, 
  History, 
  Trophy, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  Copy,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import { toast } from 'react-hot-toast';

const UserDetail: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useWeb3();
  const router = useRouter();
  const params = useParams();
  const address = params.address as string;

  const [user, setUser] = useState<User | null>(null);
  const [balanceHistory, setBalanceHistory] = useState<UserBalanceHistory[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 分页状态
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize] = useState(20);
  const [historyTotal, setHistoryTotal] = useState(0);

  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [transactionType, setTransactionType] = useState('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && address) {
      loadUserData();
    }
  }, [mounted, address]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 并行加载用户数据
      const [userData, historyData, pointsData] = await Promise.all([
        userApi.getUser(address),
        userApi.getUserHistory(address, historyPage, historyPageSize),
        userApi.getUserPoints(address)
      ]);

      setUser(userData);
      setBalanceHistory(historyData.items || []);
      setHistoryTotal(historyData.total || 0);
      setPointsHistory(pointsData || []);
    } catch (err: any) {
      setError(err.message || '加载用户数据失败');
      console.error('Failed to load user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreHistory = async () => {
    if (loading) return;
    
    try {
      const nextPage = historyPage + 1;
      const historyData = await userApi.getUserHistory(address, nextPage, historyPageSize);
      setBalanceHistory(prev => [...prev, ...(historyData.items || [])]);
      setHistoryTotal(historyData.total || 0);
      setHistoryPage(nextPage);
    } catch (err: any) {
      console.error('Failed to load more history:', err);
      toast.error('加载更多历史记录失败');
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast.success('地址已复制到剪贴板');
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'mint':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'burn':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'transfer':
        return <ArrowLeft className="w-4 h-4 text-blue-600" />;
      default:
        return <History className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const filteredHistory = balanceHistory.filter(item => {
    if (searchTerm && !item.hash.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (dateFilter && !new Date(item.timestamp).toISOString().startsWith(dateFilter)) {
      return false;
    }
    if (transactionType !== 'all' && item.type !== transactionType) {
      return false;
    }
    return true;
  });

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardBody className="p-6 text-center">
            <div className="text-red-600 mb-4">
              <UserIcon className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">
              返回
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">用户详情</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadUserData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 用户基本信息卡片 */}
        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">用户信息</h3>
                  <UserIcon className="w-5 h-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">钱包地址</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono flex-1 truncate">
                        {formatAddress(address, 12)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyAddress}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/users/${address}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">当前余额</label>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {formatBalance(user.balance || '0')}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">总积分</label>
                    <div className="text-2xl font-bold text-blue-600 mt-1">
                      {formatNumber(user.totalPoints || '0')}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">最后更新</label>
                    <div className="text-sm text-gray-600 mt-1">
                      {user.lastUpdated ? formatTime(user.lastUpdated) : '从未'}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 积分统计卡片 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">积分统计</h3>
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">总积分</span>
                    <span className="font-bold text-blue-600">
                      {formatNumber(user.totalPoints || '0')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">今日获得</span>
                    <span className="font-bold text-green-600">
                      +{pointsHistory.filter(p => 
                        new Date(p.timestamp).toDateString() === new Date().toDateString()
                      ).reduce((sum, p) => sum + Number(p.points), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">本周获得</span>
                    <span className="font-bold text-green-600">
                      +{pointsHistory.filter(p => {
                        const pDate = new Date(p.timestamp);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return pDate >= weekAgo;
                      }).reduce((sum, p) => sum + Number(p.points), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">本月获得</span>
                    <span className="font-bold text-green-600">
                      +{pointsHistory.filter(p => {
                        const pDate = new Date(p.timestamp);
                        const monthAgo = new Date();
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        return pDate >= monthAgo;
                      }).reduce((sum, p) => sum + Number(p.points), 0)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 快速操作卡片 */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium text-gray-900">快速操作</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/transactions?user=${address}`)}
                  >
                    <History className="w-4 h-4 mr-2" />
                    查看交易历史
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/leaderboard')}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    积分排行榜
                  </Button>
                  {isConnected && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/contract')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      发送代币
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* 筛选器 */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">筛选条件</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">搜索</label>
                <Input
                  placeholder="搜索交易哈希..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">日期</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">交易类型</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                >
                  <option value="all">全部</option>
                  <option value="mint">铸造</option>
                  <option value="burn">销毁</option>
                  <option value="transfer">转账</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setDateFilter('');
                    setTransactionType('all');
                  }}
                >
                  重置筛选
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 余额历史记录 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">余额历史</h3>
              <div className="text-sm text-gray-500">
                显示 {filteredHistory.length} 条记录，共 {historyTotal} 条
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暂无历史记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((item, index) => (
                  <div
                    key={`${item.hash}-${index}`}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTransactionTypeIcon(item.type)}
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.type === 'mint' ? '获得代币' : 
                             item.type === 'burn' ? '销毁代币' : '转账'}
                          </div>
                          <div className="text-sm text-gray-500">
                            交易哈希: {formatAddress(item.hash, 8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTime(item.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${item.type === 'mint' ? 'text-green-600' : 
                                                   item.type === 'burn' ? 'text-red-600' : 'text-blue-600'}`}>
                          {item.type === 'mint' ? '+' : 
                           item.type === 'burn' ? '-' : ''}
                          {formatBalance(item.amount || '0')}
                        </div>
                        <div className="text-sm text-gray-500">
                          余额: {formatBalance(item.balance || '0')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 加载更多按钮 */}
                {filteredHistory.length < historyTotal && (
                  <div className="text-center mt-6">
                    <Button
                      onClick={loadMoreHistory}
                      disabled={loading}
                      variant="outline"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      加载更多
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default UserDetail;