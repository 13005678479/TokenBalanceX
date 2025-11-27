'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Leaderboard from '@/pages/Leaderboard';

import Users from '@/pages/Users';
import Transactions from '@/pages/Transactions';
import Contract from '@/pages/Contract';
import Statistics from '@/pages/Statistics';
import Settings from '@/pages/Settings';
import Help from '@/pages/Help';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // 页面路由映射
  const pages: Record<string, React.ComponentType> = {
    dashboard: Dashboard,
    users: Users,
    leaderboard: Leaderboard,
    transactions: Transactions,
    contract: Contract,
    statistics: Statistics,
    settings: Settings,
    help: Help,
  };

  // 获取当前页面组件
  const CurrentPageComponent = pages[currentPage];

  return (
    <Layout 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
    >
      <CurrentPageComponent />
    </Layout>
  );
};

export default function Home() {
  return <App />;
}