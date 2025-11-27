'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { eventApi, statsApi } from '@/services/api';
import { EventLog, PaginatedData, StatsOverview } from '@/types';
import { formatAddress, formatTxHash, formatTime, getExplorerUrl } from '@/utils/web3';
import { formatNumber, debounce } from '@/utils/format';
import { 
  Receipt, 
  Search, 
  ExternalLink, 
  Filter, 
  RefreshCw, 
  Download,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Play,
  Pause,
  Activity,
  Clock
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import { toast } from 'react-hot-toast';

interface EventMonitorState {
  events: EventLog[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  autoRefresh: boolean;
  refreshInterval: number;
  eventType: string;
  dateRange: string;
  minAmount: string;
  maxAmount: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  realTimeCount: number;
}

const EventMonitor: React.FC = () => {
  const [state, setState] = useState<EventMonitorState>({
    events: [],
    loading: true,
    error: null,
    page: 1,
    pageSize: 20,
    total: 0,
    autoRefresh: false,
    refreshInterval: 5000,
    eventType: 'all',
    dateRange: 'all',
    minAmount: '',
    maxAmount: '',
    sortBy: 'timestamp',
    sortOrder: 'desc',
    realTimeCount: 0
  });

  const [systemStats, setSystemStats] = useState<StatsOverview | null>(null);

  // 加载事件列表
  const loadEvents = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response: PaginatedData<EventLog> = await eventApi.getEvents(page, state.pageSize);
      
      setState(prev => ({
        ...prev,
        events: append ? [...prev.events, ...(response.items || [])] : (response.items || []),
        page,
        total: response.total || 0,
        loading: false
      }));
      
      // 更新实时计数
      if (!append) {
        setState(prev => ({ ...prev, realTimeCount: response.total || 0 }));
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || '加载事件失败'
      }));
      toast.error('加载事件失败');
    }
  }, [state.pageSize]);

  // 加载系统统计
  const loadSystemStats = useCallback(async () => {
    try {
      const stats = await statsApi.getOverview();
      setSystemStats(stats);
    } catch (err: any) {
      console.error('Failed to load system stats:', err);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadEvents();
    loadSystemStats();
  }, [loadEvents, loadSystemStats]);

  // 自动刷新逻辑
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.autoRefresh) {
      interval = setInterval(() => {
        loadEvents(1, false);
        loadSystemStats();
      }, state.refreshInterval);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.autoRefresh, state.refreshInterval, loadEvents, loadSystemStats]);

  // 筛选事件
  const filteredEvents = React.useMemo(() => {
    return state.events.filter(event => {
      // 事件类型筛选
      if (state.eventType !== 'all' && event.eventType !== state.eventType) {
        return false;
      }
      
      // 日期范围筛选
      if (state.dateRange !== 'all') {
        const eventDate = new Date(event.timestamp);
        const now = new Date();
        
        switch (state.dateRange) {
          case '1h':
            if (now.getTime() - eventDate.getTime() > 60 * 60 * 1000) return false;
            break;
          case '24h':
            if (now.getTime() - eventDate.getTime() > 24 * 60 * 60 * 1000) return false;
            break;
          case '7d':
            if (now.getTime() - eventDate.getTime() > 7 * 24 * 60 * 60 * 1000) return false;
            break;
          case '30d':
            if (now.getTime() - eventDate.getTime() > 30 * 24 * 60 * 60 * 1000) return false;
            break;
        }
      }
      
      // 金额范围筛选
      if (state.minAmount && Number(event.amount) < Number(state.minAmount)) {
        return false;
      }
      if (state.maxAmount && Number(event.amount) > Number(state.maxAmount)) {
        return false;
      }
      
      return true;
    });
  }, [state.events, state.eventType, state.dateRange, state.minAmount, state.maxAmount]);

  // 排序事件
  const sortedEvents = React.useMemo(() => {
    const sorted = [...filteredEvents].sort((a, b) => {
      let aValue: any = a[state.sortBy as keyof EventLog];
      let bValue: any = b[state.sortBy as keyof EventLog];
      
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';
      
      if (state.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return sorted;
  }, [filteredEvents, state.sortBy, state.sortOrder]);

  const getEventIcon = (eventName: string) => {
    switch (eventName?.toLowerCase()) {
      case 'mint':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'burn':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'transfer':
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
      default:
        return <Receipt className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventColor = (eventName: string) => {
    switch (eventName?.toLowerCase()) {
      case 'mint':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'burn':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'transfer':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const loadMore = () => {
    if (state.loading) return;
    loadEvents(state.page + 1, true);
  };

  const exportData = () => {
    const csvContent = [
      ['时间', '事件类型', '交易哈希', '发送方', '接收方', '金额', '区块号'].join(','),
      ...sortedEvents.map(event => [
        formatTime(event.timestamp),
        event.eventType,
        event.txHash,
        event.fromAddress,
        event.toAddress,
        event.amount,
        event.blockNumber
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('数据已导出');
  };

  const resetFilters = () => {
    setState(prev => ({
      ...prev,
      eventType: 'all',
      dateRange: 'all',
      minAmount: '',
      maxAmount: '',
      sortBy: 'timestamp',
      sortOrder: 'desc'
    }));
  };

  const updateState = (updates: Partial<EventMonitorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 系统状态概览 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-sm text-blue-600 font-medium">总事件数</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatNumber(state.realTimeCount)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-sm text-green-600 font-medium">24小时事件</div>
                  <div className="text-2xl font-bold text-green-900">
                    {systemStats ? formatNumber(systemStats.totalTransactions24h) : '0'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <div className="text-sm text-yellow-600 font-medium">最近事件</div>
                  <div className="text-lg font-bold text-yellow-900">
                    {state.events[0] ? formatTime(state.events[0].timestamp) : '无'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className={`w-8 h-8 text-purple-600 mr-3 ${state.autoRefresh ? 'animate-pulse' : ''}`}>
                  {state.autoRefresh ? <Activity className="w-full h-full" /> : <Pause className="w-full h-full" />}
                </div>
                <div>
                  <div className="text-sm text-purple-600 font-medium">刷新状态</div>
                  <div className="text-lg font-bold text-purple-900">
                    {state.autoRefresh ? `每${state.refreshInterval/1000}秒` : '已暂停'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 筛选和控制面板 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">事件监控</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant={state.autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateState({ autoRefresh: !state.autoRefresh })}
                >
                  {state.autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {state.autoRefresh ? '暂停' : '开始'} 实时监控
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadEvents}
                  disabled={state.loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
                  手动刷新
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportData}
                  disabled={sortedEvents.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  导出数据
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* 事件类型筛选 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">事件类型</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={state.eventType}
                  onChange={(e) => updateState({ eventType: e.target.value })}
                >
                  <option value="all">全部事件</option>
                  <option value="mint">铸造事件</option>
                  <option value="burn">销毁事件</option>
                  <option value="transfer">转账事件</option>
                </select>
              </div>

              {/* 时间范围筛选 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">时间范围</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={state.dateRange}
                  onChange={(e) => updateState({ dateRange: e.target.value })}
                >
                  <option value="all">全部时间</option>
                  <option value="1h">最近1小时</option>
                  <option value="24h">最近24小时</option>
                  <option value="7d">最近7天</option>
                  <option value="30d">最近30天</option>
                </select>
              </div>

              {/* 最小金额 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">最小金额</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={state.minAmount}
                  onChange={(e) => updateState({ minAmount: e.target.value })}
                />
              </div>

              {/* 最大金额 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">最大金额</label>
                <Input
                  type="number"
                  placeholder="无限制"
                  value={state.maxAmount}
                  onChange={(e) => updateState({ maxAmount: e.target.value })}
                />
              </div>

              {/* 排序字段 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">排序方式</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={state.sortBy}
                  onChange={(e) => updateState({ sortBy: e.target.value })}
                >
                  <option value="timestamp">时间</option>
                  <option value="amount">金额</option>
                  <option value="blockNumber">区块号</option>
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
                  value={state.refreshInterval / 1000}
                  onChange={(e) => updateState({ refreshInterval: Number(e.target.value) * 1000 })}
                  disabled={!state.autoRefresh}
                >
                  <option value={5}>5秒</option>
                  <option value={10}>10秒</option>
                  <option value={30}>30秒</option>
                  <option value={60}>60秒</option>
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

            {/* 搜索框 */}
            <div className="mb-4">
              <Input
                placeholder="搜索交易哈希、地址..."
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
          </CardBody>
        </Card>

        {/* 事件列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">事件列表</h3>
              <div className="text-sm text-gray-500">
                显示 {sortedEvents.length} 条记录，共 {state.realTimeCount} 条
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {state.loading && sortedEvents.length === 0 ? (
              <div className="text-center py-8">
                <Loading />
              </div>
            ) : sortedEvents.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暂无事件记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedEvents.map((event, index) => (
                  <div
                    key={`${event.txHash}-${index}`}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getEventIcon(event.eventType)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getEventColor(event.eventType)}`}>
                              {event.eventType}
                            </span>
                            <span className="text-sm text-gray-500">
                              区块 #{event.blockNumber}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatTime(event.timestamp)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">
                            <div className="font-mono truncate">{formatTxHash(event.txHash, 12)}</div>
                          </div>
                          {event.fromAddress && (
                            <div className="text-sm text-gray-600">
                              从: <span className="font-mono">{formatAddress(event.fromAddress, 8)}</span>
                            </div>
                          )}
                          {event.toAddress && (
                            <div className="text-sm text-gray-600">
                              到: <span className="font-mono">{formatAddress(event.toAddress, 8)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {event.amount}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getExplorerUrl(event.txHash, 'localhost'), '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 加载更多按钮 */}
                {sortedEvents.length < state.realTimeCount && (
                  <div className="text-center mt-6">
                    <Button
                      onClick={loadMore}
                      disabled={state.loading}
                      variant="outline"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
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

export default EventMonitor;