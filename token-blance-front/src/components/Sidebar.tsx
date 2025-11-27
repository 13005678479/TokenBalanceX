'use client';

import React from 'react';
import { Home, Users, Trophy, Receipt, FileText, Activity, Settings as SettingsIcon, HelpCircle } from 'lucide-react';
import { cn } from '@/utils/format';

interface SidebarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
  className?: string;
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  page: string;
  isActive: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  page,
  isActive,
  onClick
}) => {
  // 特殊处理help页面，因为它是bottomItems中的
  const isHelpPage = page === 'help';
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors',
        isActive || (isHelpPage && label === 'Help')
          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage = 'dashboard', onNavigate, className }) => {
  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home size={18} />
    },
    {
      id: 'users',
      label: 'Users',
      icon: <Users size={18} />
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: <Trophy size={18} />
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <Receipt size={18} />
    },
    {
      id: 'contract',
      label: 'Contract',
      icon: <FileText size={18} />
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: <Activity size={18} />
    },
  ];

  const bottomItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon size={18} />
    },
    {
      id: 'help',
      label: 'Help',
      icon: <HelpCircle size={18} />
    },
  ];

  return (
    <div className={cn('flex flex-col h-full bg-gray-50 border-r border-gray-200', className)}>
      {/* Logo区域 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">TBX</span>
          </div>
          <span className="text-lg font-bold text-gray-900">TokenBalanceX</span>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarItems.map(item => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            page={item.id}
            isActive={currentPage === item.id}
            onClick={() => onNavigate?.(item.id)}
          />
        ))}
      </nav>

      {/* 底部菜单 */}
      <div className="p-4 border-t border-gray-200 space-y-1">
        {bottomItems.map(item => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            page={item.id}
            isActive={currentPage === item.id}
            onClick={() => onNavigate?.(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;