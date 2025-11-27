'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { pointsApi } from '@/services/api';
import { LeaderboardEntry } from '@/types';
import { formatNumber, calculateGrowthRate } from '@/utils/format';
import { formatAddress } from '@/utils/web3';
import { Trophy, Crown, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';
import Loading from '@/components/ui/Loading';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser?: boolean;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, index, isCurrentUser }) => {
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
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return rank <= 10 
          ? 'bg-blue-100 text-blue-800 border border-blue-200'
          : 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${
      isCurrentUser 
        ? 'border-blue-200 bg-blue-50' 
        : 'border-gray-200 bg-white'
    } transition-all hover:shadow-md`}>
      <div className="flex items-center space-x-4">
        {/* 排名 */}
        <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadge(index + 1)}`}>
          {getRankIcon(index + 1)}
        </div>

        {/* 用户信息 */}
        <div>
          <div className="font-medium text-gray-900 flex items-center space-x-2">
            <span>{formatAddress(entry.address, 6)}</span>
            {isCurrentUser && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                You
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Balance: {formatNumber(entry.balance, 4)} TBX
          </div>
        </div>
      </div>

      {/* 积分信息 */}
      <div className="text-right">
        <div className="text-lg font-bold text-blue-600">
          {formatNumber(entry.totalPoints, 2)}
        </div>
        <div className="text-sm text-gray-500">points</div>
        {entry.percentageChange !== undefined && (
          <div className={`flex items-center justify-end space-x-1 text-xs ${
            entry.percentageChange > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {entry.percentageChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{Math.abs(entry.percentageChange).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Leaderboard: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useWeb3();

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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);

  // 获取排行榜数据
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await pointsApi.getLeaderboard(limit);
      setLeaderboard(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchLeaderboard();
    }
  }, [isConnected, limit]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Connect your wallet to view the leaderboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-600 mt-2">Top token holders and points earners</p>
        </div>
        
        {/* 显示数量选择 */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Show:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>Top 10</option>
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
          </select>
        </div>
      </div>

      {/* 错误状态 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 排行榜列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Top Holders</h2>
            <div className="text-sm text-gray-500">
              {leaderboard.length} users listed
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                    <div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No users found in the leaderboard</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {leaderboard.map((entry, index) => (
                <LeaderboardRow
                  key={entry.address}
                  entry={entry}
                  index={index}
                  isCurrentUser={address?.toLowerCase() === entry.address.toLowerCase()}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* 排行榜说明 */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-gray-900">How Points Are Calculated</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Points are calculated based on your token balance and holding time</p>
            <p>• The formula: Points = Balance × 0.05 × Holding Hours</p>
            <p>• Points are calculated hourly and accumulate over time</p>
            <p>• Higher balances and longer holding periods generate more points</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default Leaderboard;