'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { WalletInfo } from '@/types';
import { connectWallet, getCurrentAccount, isWalletConnected, switchNetwork } from '@/utils/web3';
import { storage } from '@/utils/format';
import { STORAGE_KEYS, NETWORKS } from '@/lib/constants';

export const useWallet = () => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    address: '',
    chainId: 0,
    balance: '0',
    connected: false
  });
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化钱包连接
  const initializeWallet = useCallback(async () => {
    if (typeof window === 'undefined') return;

    setIsLoading(true);
    setError(null);

    try {
      // 检查是否有Web3钱包
      if (!(window as any).ethereum) {
        throw new Error('MetaMask or other Web3 wallet is not installed');
      }

      // 创建Provider实例
      const web3Provider = new ethers.providers.Web3Provider((window as any).ethereum);
      setProvider(web3Provider);

      // 检查是否已连接
      if (isWalletConnected()) {
        const accounts = await web3Provider.listAccounts();
        if (accounts.length > 0) {
          const address = accounts[0];
          const balance = await web3Provider.getBalance(address);
          const network = await web3Provider.getNetwork();

          setWalletInfo({
            address,
            chainId: network.chainId,
            balance: ethers.utils.formatEther(balance),
            connected: true
          });

          // 保存到本地存储
          storage.set(STORAGE_KEYS.WALLET_ADDRESS, address);
          storage.set(STORAGE_KEYS.SELECTED_NETWORK, network.chainId.toString());
        }
      }
    } catch (err: any) {
      console.error('Failed to initialize wallet:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 连接钱包
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const address = await connectWallet();
      
      if (provider) {
        const balance = await provider.getBalance(address);
        const network = await provider.getNetwork();

        setWalletInfo({
          address,
          chainId: network.chainId,
          balance: ethers.utils.formatEther(balance),
          connected: true
        });

        storage.set(STORAGE_KEYS.WALLET_ADDRESS, address);
        storage.set(STORAGE_KEYS.SELECTED_NETWORK, network.chainId.toString());
      }
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  // 断开钱包连接
  const disconnect = useCallback(() => {
    setWalletInfo({
      address: '',
      chainId: 0,
      balance: '0',
      connected: false
    });
    setProvider(null);

    // 清除本地存储
    storage.remove(STORAGE_KEYS.WALLET_ADDRESS);
    storage.remove(STORAGE_KEYS.SELECTED_NETWORK);
  }, []);

  // 切换网络
  const switchToNetwork = useCallback(async (chainId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      await switchNetwork(chainId);
      
      // 更新钱包信息
      if (provider && walletInfo.address) {
        const balance = await provider.getBalance(walletInfo.address);
        const network = await provider.getNetwork();

        setWalletInfo(prev => ({
          ...prev,
          chainId: network.chainId,
          balance: ethers.utils.formatEther(balance)
        }));

        storage.set(STORAGE_KEYS.SELECTED_NETWORK, network.chainId.toString());
      }
    } catch (err: any) {
      console.error('Failed to switch network:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [provider, walletInfo.address]);

  // 刷新余额
  const refreshBalance = useCallback(async () => {
    if (!provider || !walletInfo.address) return;

    try {
      const balance = await provider.getBalance(walletInfo.address);
      setWalletInfo(prev => ({
        ...prev,
        balance: ethers.utils.formatEther(balance)
      }));
    } catch (err: any) {
      console.error('Failed to refresh balance:', err);
      setError(err.message);
    }
  }, [provider, walletInfo.address]);

  // 监听账户变化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== walletInfo.address) {
        initializeWallet();
      }
    };

    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      setWalletInfo(prev => ({
        ...prev,
        chainId: newChainId
      }));
      storage.set(STORAGE_KEYS.SELECTED_NETWORK, newChainId.toString());
      initializeWallet();
    };

    const handleDisconnect = () => {
      disconnect();
    };

    // 添加事件监听器
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);
      (window as any).ethereum.on('disconnect', handleDisconnect);
    }

    // 清理事件监听器
    return () => {
      if ((window as any).ethereum) {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
        (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
        (window as any).ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [walletInfo.address, disconnect, initializeWallet]);

  // 初始化时自动连接
  useEffect(() => {
    initializeWallet();
  }, []);

  // 定期刷新余额
  useEffect(() => {
    if (!walletInfo.connected) return;

    const interval = setInterval(() => {
      refreshBalance();
    }, 10000); // 每10秒刷新一次

    return () => clearInterval(interval);
  }, [walletInfo.connected, refreshBalance]);

  return {
    walletInfo,
    provider,
    isLoading,
    error,
    connect,
    disconnect,
    switchToNetwork,
    refreshBalance,
    initializeWallet
  };
};