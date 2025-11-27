'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { userApi } from '@/services/api';
import { User, UserBalanceHistory, PaginatedData } from '@/types';
import { formatAddress, formatBalance, formatTime } from '@/utils/web3';
import { formatNumber, debounce } from '@/utils/format';
import { User as UsersIcon, Search, Calendar, TrendingUp, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import { useWeb3 } from '@/contexts/Web3Context';

interface UserCardProps {
  user: User;
  onViewHistory: (address: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onViewHistory }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {formatAddress(user.address, 6)}
              </div>
              <div className="text-sm text-gray-500">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {formatNumber(user.balance, 4)} TBX
            </div>
            <div className="text-sm text-blue-600">
              {formatNumber(user.totalPoints, 2)} pts
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <TrendingUp size={14} />
                <span>Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock size={14} />
                <span>{formatTime(user.updatedAt)}</span>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewHistory(user.address)}
            >
              View History
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

interface UserHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAddress: string;
  history: UserBalanceHistory[];
  loading: boolean;
}

const UserHistoryModal: React.FC<UserHistoryModalProps> = ({
  isOpen,
  onClose,
  userAddress,
  history,
  loading
}) => {
  if (!isOpen) return null;

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'mint':
      case 'transfer_in':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'burn':
      case 'transfer_out':
        return <TrendingUp className="w-4 h-4 text-red-600 transform rotate-180" />;
      default:
        return null;
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'mint':
      case 'transfer_in':
        return 'text-green-600';
      case 'burn':
      case 'transfer_out':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Transaction History
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formatAddress(userAddress, 8)}
                </p>
              </div>
              <Button variant="ghost" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>
          
          <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <Loading text="Loading history..." />
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transaction history found
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getChangeTypeIcon(item.changeType)}
                      <div>
                        <div className="font-medium text-gray-900 capitalize">
                          {item.changeType.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(item.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-medium ${getChangeTypeColor(item.changeType)}`}>
                        {item.changeType.includes('in') || item.changeType === 'mint' ? '+' : '-'}
                        {formatBalance(item.changeAmount)} TBX
                      </div>
                      <div className="text-sm text-gray-500">
                        Balance: {formatBalance(item.newBalance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersPage: React.FC = () => {
  const { isConnected } = useWeb3();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userHistory, setUserHistory] = useState<UserBalanceHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 防抖搜索
  const debouncedSearch = debounce((term: string) => {
    setCurrentPage(1);
  }, 500);

  // 获取用户列表
  const fetchUsers = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 这里需要添加获取用户列表的API，目前使用模拟数据
      // const data = await userApi.getUsersList(currentPage, 20, searchTerm);
      
      // 模拟数据
      const mockUsers: User[] = [
        {
          address: '0x1234567890abcdef1234567890abcdef12345678',
          balance: '1500.5',
          totalPoints: 1250.75,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-27T15:45:00Z'
        },
        {
          address: '0x9876543210fedcba9876543210fedcba98765432',
          balance: '850.25',
          totalPoints: 950.50,
          createdAt: '2024-01-10T08:15:00Z',
          updatedAt: '2024-01-27T14:20:00Z'
        }
      ];
      
      setUsers(mockUsers);
      setTotalPages(5);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // 获取用户历史
  const fetchUserHistory = async (address: string) => {
    setHistoryLoading(true);
    setSelectedUser(address);
    
    try {
      const data = await userApi.getUserHistory(address);
      setUserHistory(data.items);
    } catch (err: any) {
      console.error('Failed to fetch user history:', err);
      setUserHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchUsers();
    }
  }, [isConnected, currentPage, searchTerm]);

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Connect your wallet to view users</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-2">Manage and view user accounts</p>
        </div>
        
        <div className="text-sm text-gray-500">
          {users.length} users
        </div>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardBody className="p-4">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search users by address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} />}
              className="flex-1"
            />
          </div>
        </CardBody>
      </Card>

      {/* 错误状态 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 用户网格 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <UserCard
              key={user.address}
              user={user}
              onViewHistory={fetchUserHistory}
            />
          ))}
        </div>
      )}

      {/* 分页 */}
      {!loading && users.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            Next
          </Button>
        </div>
      )}

      {/* 用户历史弹窗 */}
      <UserHistoryModal
        isOpen={!!selectedUser}
        onClose={() => {
          setSelectedUser(null);
          setUserHistory([]);
        }}
        userAddress={selectedUser || ''}
        history={userHistory}
        loading={historyLoading}
      />
    </div>
  );
};

export default UsersPage;