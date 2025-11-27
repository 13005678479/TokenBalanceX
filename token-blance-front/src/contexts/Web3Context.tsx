'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/hooks/useWallet';
import { sendTransaction, waitForTransaction, getTokenBalance } from '@/utils/web3';
import { TransactionStatus, ContractInteraction } from '@/types';
import { toast } from 'react-hot-toast';

interface Web3ContextType {
  provider: ethers.providers.Web3Provider | null;
  isConnected: boolean;
  address: string | null;
  chainId: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  sendTokenTransaction: (
    contractAddress: string,
    interaction: ContractInteraction
  ) => Promise<string>;
  getTokenBalance: (contractAddress: string, userAddress?: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    walletInfo,
    provider,
    isLoading,
    error,
    connect,
    disconnect,
    switchToNetwork,
    refreshBalance
  } = useWallet();

  const [transactions, setTransactions] = useState<Map<string, TransactionStatus>>(new Map());

  // 连接钱包
  const handleConnectWallet = async () => {
    try {
      await connect();
      toast.success('Wallet connected successfully!');
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  // 断开钱包连接
  const handleDisconnectWallet = () => {
    disconnect();
    toast.success('Wallet disconnected');
  };

  // 切换网络
  const handleSwitchNetwork = async (chainId: number) => {
    try {
      await switchToNetwork(chainId);
      toast.success(`Switched to network ${chainId}`);
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      toast.error(error.message || 'Failed to switch network');
    }
  };

  // 发送代币交易
  const handleSendTokenTransaction = async (
    contractAddress: string,
    interaction: ContractInteraction
  ): Promise<string> => {
    if (!provider) {
      throw new Error('Wallet not connected');
    }

    let methodName: string;
    let params: any[] = [];

    switch (interaction.type) {
      case 'mint':
        methodName = 'mint';
        params = [interaction.to, ethers.utils.parseUnits(interaction.amount, 18)];
        break;
      case 'burn':
        methodName = 'burn';
        params = [ethers.utils.parseUnits(interaction.amount, 18)];
        break;
      case 'transfer':
        methodName = 'transfer';
        params = [interaction.to, ethers.utils.parseUnits(interaction.amount, 18)];
        break;
      default:
        throw new Error(`Unsupported transaction type: ${interaction.type}`);
    }

    try {
      toast.loading('Preparing transaction...', { id: 'tx-prepare' });
      
      const tx = await sendTransaction(contractAddress, methodName, params, provider);
      
      // 更新交易状态
      const txStatus: TransactionStatus = {
        hash: tx.hash,
        status: 'pending',
        confirmations: 0,
        timestamp: new Date().toISOString()
      };
      setTransactions(prev => new Map(prev).set(tx.hash, txStatus));
      
      toast.success('Transaction sent! Waiting for confirmation...', { 
        id: 'tx-prepare',
        duration: 3000 
      });

      // 等待交易确认
      const receipt = await waitForTransaction(tx, 1);
      
      // 更新交易状态
      const updatedStatus: TransactionStatus = {
        hash: tx.hash,
        status: receipt.status === 1 ? 'success' : 'failed',
        confirmations: 1,
        timestamp: new Date().toISOString()
      };
      setTransactions(prev => new Map(prev).set(tx.hash, updatedStatus));

      if (receipt.status === 1) {
        toast.success('Transaction confirmed!', { duration: 5000 });
        // 刷新余额
        setTimeout(() => refreshBalance(), 1000);
      } else {
        toast.error('Transaction failed');
      }

      return tx.hash;

    } catch (error: any) {
      console.error('Transaction failed:', error);
      toast.error(error.message || 'Transaction failed');
      throw error;
    }
  };

  // 获取代币余额
  const handleGetTokenBalance = async (
    contractAddress: string,
    userAddress?: string
  ): Promise<string> => {
    if (!provider) {
      throw new Error('Wallet not connected');
    }

    const address = userAddress || walletInfo.address;
    if (!address) {
      throw new Error('No address provided');
    }

    try {
      const balance = await getTokenBalance(contractAddress, address, provider);
      return balance;
    } catch (error: any) {
      console.error('Failed to get token balance:', error);
      throw error;
    }
  };

  // 清理旧的交易记录
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const cleanedTransactions = new Map(transactions);
      
      transactions.forEach((status, hash) => {
        const txTime = new Date(status.timestamp).getTime();
        // 保留最近1小时的交易记录
        if (now - txTime > 3600000) {
          cleanedTransactions.delete(hash);
        }
      });
      
      if (cleanedTransactions.size !== transactions.size) {
        setTransactions(cleanedTransactions);
      }
    }, 300000); // 每5分钟清理一次

    return () => clearInterval(interval);
  }, [transactions]);

  const contextValue: Web3ContextType = {
    provider,
    isConnected: walletInfo.connected,
    address: walletInfo.address,
    chainId: walletInfo.chainId,
    connectWallet: handleConnectWallet,
    disconnectWallet: handleDisconnectWallet,
    switchNetwork: handleSwitchNetwork,
    sendTokenTransaction: handleSendTokenTransaction,
    getTokenBalance: handleGetTokenBalance,
    isLoading,
    error
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export default Web3Provider;