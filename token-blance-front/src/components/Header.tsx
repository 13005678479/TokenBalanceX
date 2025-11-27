'use client';

import React from 'react';
// logo uses an emoji for simplicity; remove lucide icon import to avoid missing export
import WalletConnect from './WalletConnect';
import { useWeb3 } from '@/contexts/Web3Context';

interface HeaderProps {
  onNavigate?: (page: string) => void;
  currentPage?: string;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage = 'dashboard' }) => {
  const { isConnected } = useWeb3();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'transactions', label: 'Transactions', icon: '💸' },
    { id: 'contract', label: 'Contract', icon: '📜' },
    { id: 'statistics', label: 'Statistics', icon: '📈' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo和导航 */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex items-center space-x-2 cursor-pointer">
              <span className="h-8 w-8 text-blue-600 text-2xl">💠</span>
              <span className="text-xl font-bold text-gray-900">
                TokenBalanceX
              </span>
            </div>

            {/* 导航菜单 */}
            {isConnected && (
              <nav className="hidden md:flex space-x-1">
                {navigationItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate?.(item.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* 右侧工具栏 */}
          <div className="flex items-center space-x-4">
            <WalletConnect />
          </div>
        </div>

        {/* 移动端导航 */}
        {isConnected && (
          <div className="md:hidden py-3 border-t border-gray-200">
            <div className="flex space-x-1 overflow-x-auto">
              {navigationItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`flex-shrink-0 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;