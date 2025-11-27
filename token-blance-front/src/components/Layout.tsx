'use client';

import React, { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import Header from './Header';
import Sidebar from './Sidebar';
import { cn } from '@/utils/format';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentPage = 'dashboard',
  onNavigate 
}) => {
  const { isConnected } = useWeb3();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (page: string) => {
    onNavigate?.(page);
    setSidebarOpen(false); // 移动端点击后关闭侧边栏
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 未连接钱包的简单布局 */}
        <div className="min-h-screen flex flex-col justify-center items-center px-4">
          <div className="max-w-md w-full space-y-8 text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">TBX</span>
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                TokenBalanceX
              </h1>
              <p className="text-gray-600">
                Connect your wallet to access the blockchain token balance tracking system
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-4">
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Features
                  </h2>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      Real-time token balance tracking
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      Points calculation based on holdings
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      Leaderboard and statistics
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      Multi-chain support
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Please connect your MetaMask or other Web3 wallet to continue
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 固定的头部 */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TBX</span>
                </div>
                <span className="text-lg font-bold text-gray-900">TokenBalanceX</span>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* 钱包连接组件会在Header中处理 */}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />
      </div>

      {/* 主内容区域 */}
      <div className="lg:pl-64">
        {/* 顶部导航 */}
        <Header
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />

        {/* 页面内容 */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* 移动端菜单按钮 */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 right-4 lg:hidden z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  );
};

export default Layout;