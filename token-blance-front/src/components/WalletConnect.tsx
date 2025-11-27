'use client';

import React, { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { formatAddress, formatBalance } from '@/utils/web3';
import { NETWORKS } from '@/lib/constants';
import { copyToClipboard } from '@/utils/format';
import Button from './ui/Button';
import { Wallet, Copy, ExternalLink, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

const WalletConnect: React.FC = () => {
  const {
    isConnected,
    address,
    chainId,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    provider,
    isLoading
  } = useWeb3();

  const [showDropdown, setShowDropdown] = useState(false);

  // 复制地址
  const handleCopyAddress = async () => {
    if (address) {
      const success = await copyToClipboard(address);
      if (success) {
        toast.success('Address copied to clipboard');
      } else {
        toast.error('Failed to copy address');
      }
    }
  };

  // 打开区块链浏览器
  const openExplorer = () => {
    if (address && chainId) {
      const network = Object.values(NETWORKS).find(n => n.chainId === chainId);
      if (network?.explorerUrl) {
        window.open(`${network.explorerUrl}/address/${address}`, '_blank');
      }
    }
  };

  // 获取当前网络名称
  const getCurrentNetworkName = () => {
    const network = Object.values(NETWORKS).find(n => n.chainId === chainId);
    return network?.name || 'Unknown Network';
  };

  if (isConnected && address) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2"
        >
          <Wallet size={16} />
          <span>{formatAddress(address, 4)}</span>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            {formatBalance('0.000')} ETH
          </span>
          <ChevronDown size={14} className={showDropdown ? 'rotate-180' : ''} />
        </Button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Wallet</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Connected
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Address:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-mono">{formatAddress(address, 6)}</span>
                    <button
                      onClick={handleCopyAddress}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy address"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Balance:</span>
                  <span className="text-sm font-mono">
                    {formatBalance(provider ? '0.000' : '0.000')} ETH
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Network:</span>
                  <span className="text-sm">{getCurrentNetworkName()}</span>
                </div>
              </div>
            </div>

            <div className="p-2">
              <div className="space-y-1">
                <button
                  onClick={openExplorer}
                  className="w-full flex items-center justify-between p-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  <span>View on Explorer</span>
                  <ExternalLink size={14} />
                </button>
                
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    disconnectWallet();
                  }}
                  className="w-full flex items-center justify-between p-2 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  <span>Disconnect</span>
                </button>
              </div>
            </div>

            {/* 网络切换 */}
            <div className="border-t border-gray-200 p-2">
              <div className="text-xs text-gray-500 mb-2 px-2">Switch Network</div>
              <div className="space-y-1">
                {Object.entries(NETWORKS).map(([key, network]) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (network.chainId !== chainId) {
                        switchNetwork(network.chainId);
                      }
                      setShowDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 text-sm rounded ${
                      network.chainId === chainId
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{network.name}</span>
                    {network.chainId === chainId && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      loading={isLoading}
      icon={<Wallet size={16} />}
    >
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};

export default WalletConnect;