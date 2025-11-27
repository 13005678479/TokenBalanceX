'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { eventApi } from '@/services/api';
import { EventLog, PaginatedData } from '@/types';
import { formatAddress, formatTxHash, formatBalance, formatTime, getExplorerUrl } from '@/utils/web3';
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
  ArrowRightLeft
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import { useWeb3 } from '@/contexts/Web3Context';

interface TransactionRowProps {
  event: EventLog;
  onViewExplorer?: (txHash: string) => void;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ event, onViewExplorer }) => {
  const getEventIcon = (eventName: string) => {
    switch (eventName.toLowerCase()) {
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
    switch (eventName.toLowerCase()) {
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

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-lg border ${getEventColor(event.eventName)}`}>
          {getEventIcon(event.eventName)}
        </div>
        
        <div>
          <div className="font-medium text-gray-900 capitalize">
            {event.eventName}
          </div>
          <div className="text-sm text-gray-500">
            {formatTime(event.timestamp)}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-right">
          <div className="font-medium text-gray-900">
            {formatBalance(event.amount)} TBX
          </div>
          <div className="text-sm text-gray-500">
            {formatAddress(event.userAddress, 6)}
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Block {formatNumber(event.blockNumber, 0)}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-mono text-gray-600">
            {formatTxHash(event.txHash, 8)}
          </span>
          {onViewExplorer && (
            <button
              onClick={() => onViewExplorer(event.txHash)}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              title="View on Explorer"
            >
              <ExternalLink size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface FilterOptions {
  eventType: string;
  dateRange: string;
  minAmount: string;
  maxAmount: string;
}

const Transactions: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { isConnected, chainId } = useWeb3();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    eventType: '',
    dateRange: '',
    minAmount: '',
    maxAmount: ''
  });
  const [syncing, setSyncing] = useState(false);

  // 防抖搜索
  const debouncedSearch = debounce((term: string) => {
    setCurrentPage(1);
  }, 500);

  // 获取交易列表
  const fetchEvents = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data: PaginatedData<EventLog> = await eventApi.getEvents(currentPage, 20);
      setEvents(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      setError(err.message || 'Failed to load transactions');
      
      // 使用模拟数据作为后备
      const mockEvents: EventLog[] = [
        {
          id: 1,
          eventName: 'Mint',
          userAddress: '0x1234567890abcdef1234567890abcdef12345678',
          amount: '1000',
          txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          blockNumber: 12345,
          timestamp: '2024-01-27T10:30:00Z',
          data: '{}'
        },
        {
          id: 2,
          eventName: 'Transfer',
          userAddress: '0x9876543210fedcba9876543210fedcba98765432',
          amount: '500',
          txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 12346,
          timestamp: '2024-01-27T10:35:00Z',
          data: '{}'
        }
      ];
      
      setEvents(mockEvents);
      setTotal(2);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // 同步事件
  const handleSyncEvents = async () => {
    setSyncing(true);
    try {
      await eventApi.syncEvents();
      await fetchEvents(); // 刷新列表
    } catch (err: any) {
      console.error('Failed to sync events:', err);
      setError(err.message || 'Failed to sync events');
    } finally {
      setSyncing(false);
    }
  };

  // 在区块链浏览器中打开交易
  const handleViewExplorer = (txHash: string) => {
    const networks = {
      11155111: 'sepolia',
      84532: 'baseSepolia',
      31337: 'localhost'
    };
    
    const networkName = networks[chainId as keyof typeof networks] || 'sepolia';
    const url = getExplorerUrl(txHash, networkName);
    window.open(url, '_blank');
  };

  // 导出数据
  const handleExport = () => {
    const exportData = events.map(event => ({
      ID: event.id,
      Event: event.eventName,
      Address: event.userAddress,
      Amount: event.amount,
      Transaction: event.txHash,
      Block: event.blockNumber,
      Time: event.timestamp
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 重置过滤器
  const resetFilters = () => {
    setFilters({
      eventType: '',
      dateRange: '',
      minAmount: '',
      maxAmount: ''
    });
    setCurrentPage(1);
  };

  useEffect(() => {
    if (isConnected) {
      fetchEvents();
    }
  }, [isConnected, currentPage, searchTerm, filters]);

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Connect your wallet to view transactions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-2">View and analyze all blockchain events</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter size={16} />}
          >
            Filters
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            icon={<Download size={16} />}
          >
            Export
          </Button>
          
          <Button
            onClick={handleSyncEvents}
            loading={syncing}
            icon={<RefreshCw size={16} />}
          >
            {syncing ? 'Syncing...' : 'Sync'}
          </Button>
        </div>
      </div>

      {/* 过滤器 */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Filter Transactions</h3>
              <Button variant="ghost" onClick={resetFilters}>
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  value={filters.eventType}
                  onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="mint">Mint</option>
                  <option value="burn">Burn</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Time</option>
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
              
              <div>
                <Input
                  label="Min Amount"
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Input
                  label="Max Amount"
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  placeholder="9999999"
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 搜索栏 */}
      <Card>
        <CardBody className="p-4">
          <Input
            placeholder="Search transactions by address or transaction hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={18} />}
          />
        </CardBody>
      </Card>

      {/* 错误状态 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 交易列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
            <div className="text-sm text-gray-500">
              {total} transactions found
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="space-y-2">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div>
              {events.map((event) => (
                <TransactionRow
                  key={event.id}
                  event={event}
                  onViewExplorer={handleViewExplorer}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 分页 */}
      {!loading && events.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, total)} of {total} transactions
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                if (totalPages > 5) {
                  if (pageNum === 1 || pageNum === 5 || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return (
                      <Button
                        key={i}
                        variant={currentPage === pageNum ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  } else if (pageNum === 2 && currentPage > 3) {
                    return <span key={i} className="px-2">...</span>;
                  } else if (pageNum === 4 && currentPage < totalPages - 2) {
                    return <span key={i} className="px-2">...</span>;
                  }
                  return null;
                } else {
                  return (
                    <Button
                      key={i}
                      variant={currentPage === pageNum ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                }
              })}
            </div>
            
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;