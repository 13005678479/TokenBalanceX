'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useWeb3 } from '@/contexts/Web3Context';
import { NETWORKS } from '@/lib/constants';
import { formatAddress } from '@/utils/web3';
import { storage } from '@/utils/format';
import { STORAGE_KEYS } from '@/lib/constants';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Globe, 
  Bell,
  Shield,
  Database,
  Trash2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, children }) => {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </CardHeader>
      <CardBody>
        {children}
      </CardBody>
    </Card>
  );
};

const Settings: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { address, chainId, switchNetwork, disconnectWallet, isConnected } = useWeb3();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // 主题设置
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  // 通知设置
  const [notifications, setNotifications] = useState({
    transactions: true,
    points: true,
    system: true
  });
  
  // 网络设置
  const [defaultNetwork, setDefaultNetwork] = useState('localhost');
  
  // API设置
  const [apiUrl, setApiUrl] = useState('http://localhost:8080');

  // 初始化设置
  useEffect(() => {
    const savedTheme = storage.get<'light' | 'dark' | 'system'>('theme') || 'system';
    const savedNotifications = storage.get<{ transactions: boolean; points: boolean; system: boolean }>('notifications') || {
      transactions: true,
      points: true,
      system: true
    };
    const savedNetwork = storage.get<string>('selected_network') || 'localhost';
    const savedApiUrl = storage.get<string>('api_url') || 'http://localhost:8080';
    
    setTheme(savedTheme);
    setNotifications(savedNotifications);
    setDefaultNetwork(savedNetwork);
    setApiUrl(savedApiUrl);
  }, []);

  // 保存设置
  const saveTheme = (newTheme: typeof theme) => {
    setTheme(newTheme);
    storage.set('theme', newTheme);
    
    // 应用主题
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // system theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const saveNotifications = (key: string, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);
    storage.set('notifications', newNotifications);
  };

  const saveNetwork = (network: string) => {
    setDefaultNetwork(network);
    storage.set('selected_network', network);
    
    // 如果连接了钱包，切换网络
    if (isConnected && NETWORKS[network]) {
      switchNetwork(NETWORKS[network].chainId);
    }
  };

  const saveApiUrl = (url: string) => {
    setApiUrl(url);
    storage.set('api_url', url);
  };

  // 清除缓存
  const clearCache = () => {
    storage.clear();
    window.location.reload();
  };

  // 重置设置
  const resetSettings = () => {
    storage.remove('theme');
    storage.remove('notifications');
    storage.remove('selected_network');
    storage.remove('api_url');
    window.location.reload();
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <SettingsIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Connect your wallet to access settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your application preferences</p>
      </div>

      {/* 账户信息 */}
      <SettingsSection title="Account Information">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wallet Address
              </label>
              <div className="font-mono text-sm bg-gray-50 p-3 rounded border">
                {formatAddress(address || '', 10)}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Network
              </label>
              <div className="bg-blue-50 text-blue-800 p-3 rounded border border-blue-200">
                {(() => {
                  const networkKey = Object.keys(NETWORKS).find(key => NETWORKS[key].chainId === chainId);
                  return networkKey ? NETWORKS[networkKey].name : 'Unknown Network';
                })()}
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <Button variant="danger" onClick={disconnectWallet}>
              Disconnect Wallet
            </Button>
          </div>
        </div>
      </SettingsSection>

      {/* 外观设置 */}
      <SettingsSection 
        title="Appearance" 
        description="Customize the look and feel of the application"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', label: 'Light', icon: <Sun size={16} /> },
                { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
                { value: 'system', label: 'System', icon: <Globe size={16} /> }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => saveTheme(option.value as any)}
                  className={`flex items-center justify-center space-x-2 p-3 rounded-lg border transition-colors ${
                    theme === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* 通知设置 */}
      <SettingsSection 
        title="Notifications" 
        description="Manage your notification preferences"
      >
        <div className="space-y-4">
          {[
            { key: 'transactions', label: 'Transaction Updates', description: 'Get notified about mint, burn, and transfer events' },
            { key: 'points', label: 'Points Updates', description: 'Receive notifications when points are calculated' },
            { key: 'system', label: 'System Updates', description: 'Important system announcements and updates' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-gray-900">{item.label}</div>
                <div className="text-sm text-gray-500">{item.description}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[item.key as keyof typeof notifications]}
                  onChange={(e) => saveNotifications(item.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* 网络设置 */}
      <SettingsSection 
        title="Network Settings" 
        description="Configure blockchain network preferences"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Network
            </label>
            <select
              value={defaultNetwork}
              onChange={(e) => saveNetwork(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(NETWORKS).map(([key, network]) => (
                <option key={key} value={key}>
                  {network.name} (Chain ID: {network.chainId})
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>• Localhost: Hardhat development network</p>
            <p>• Sepolia: Ethereum testnet</p>
            <p>• Base Sepolia: Base testnet</p>
          </div>
        </div>
      </SettingsSection>

      {/* API设置 */}
      <SettingsSection 
        title="API Configuration" 
        description="Configure backend API connection settings"
      >
        <div className="space-y-4">
          <Input
            label="API URL"
            value={apiUrl}
            onChange={(e) => saveApiUrl(e.target.value)}
            placeholder="http://localhost:8080"
          />
          
          <div className="text-sm text-gray-600">
            <p>Change the backend API URL to connect to a different server instance.</p>
            <p>Current URL: {apiUrl}</p>
          </div>
        </div>
      </SettingsSection>

      {/* 数据管理 */}
      <SettingsSection 
        title="Data Management" 
        description="Manage local application data"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={clearCache}
              icon={<RefreshCw size={16} />}
            >
              Clear Cache
            </Button>
            
            <Button
              variant="outline"
              onClick={resetSettings}
              icon={<Trash2 size={16} />}
            >
              Reset Settings
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>• Clear Cache: Remove temporary data and refresh the application</p>
            <p>• Reset Settings: Restore all settings to their default values</p>
          </div>
        </div>
      </SettingsSection>

      {/* 关于 */}
      <SettingsSection title="About">
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">TokenBalanceX Frontend</h4>
            <p className="text-sm text-blue-700">
              A modern React + Next.js frontend for the TokenBalanceX blockchain token balance tracking system.
              Built with TypeScript, Tailwind CSS, and Web3 integration.
            </p>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Version 1.0.0</span>
            <Button variant="ghost" size="sm">
              <ExternalLink size={14} className="mr-1" />
              GitHub
            </Button>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

export default Settings;