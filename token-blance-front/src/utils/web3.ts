import { ethers } from 'ethers';
import { TOKEN_CONTRACT_ABI, NETWORKS } from '@/lib/constants';
import { NetworkConfig } from '@/types';

// 格式化余额显示
export const formatBalance = (balance: string, decimals: number = 18): string => {
  const etherValue = ethers.utils.formatUnits(balance, decimals);
  return parseFloat(etherValue).toFixed(4);
};

// 格式化地址显示
export const formatAddress = (address: string, length: number = 6): string => {
  if (!address) return '';
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

// 验证地址有效性
export const isValidAddress = (address: string): boolean => {
  return ethers.utils.isAddress(address);
};

// 格式化交易哈希
export const formatTxHash = (hash: string, length: number = 8): string => {
  if (!hash) return '';
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
};

// 获取区块链浏览器链接
export const getExplorerUrl = (hash: string, network: string): string => {
  const networkConfig = NETWORKS[network];
  if (!networkConfig || !networkConfig.explorerUrl) return '#';
  
  return `${networkConfig.explorerUrl}/tx/${hash}`;
};

// 获取地址浏览器链接
export const getExplorerAddressUrl = (address: string, network: string): string => {
  const networkConfig = NETWORKS[network];
  if (!networkConfig || !networkConfig.explorerUrl) return '#';
  
  return `${networkConfig.explorerUrl}/address/${address}`;
};

// 创建合约实例
export const createContractInstance = (
  address: string, 
  providerOrSigner: ethers.providers.Web3Provider | ethers.providers.JsonRpcSigner
): ethers.Contract => {
  return new ethers.Contract(address, TOKEN_CONTRACT_ABI, providerOrSigner);
};

// 获取代币余额
export const getTokenBalance = async (
  contractAddress: string,
  userAddress: string,
  provider: ethers.providers.Web3Provider
): Promise<string> => {
  try {
    const contract = createContractInstance(contractAddress, provider);
    const balance = await contract.balanceOf(userAddress);
    return balance.toString();
  } catch (error) {
    console.error('Failed to get token balance:', error);
    throw error;
  }
};

// 获取总供应量
export const getTotalSupply = async (
  contractAddress: string,
  provider: ethers.providers.Web3Provider
): Promise<string> => {
  try {
    const contract = createContractInstance(contractAddress, provider);
    const totalSupply = await contract.totalSupply();
    return totalSupply.toString();
  } catch (error) {
    console.error('Failed to get total supply:', error);
    throw error;
  }
};

// 发送交易
export const sendTransaction = async (
  contractAddress: string,
  methodName: string,
  params: any[],
  provider: ethers.providers.Web3Provider
): Promise<ethers.providers.TransactionResponse> => {
  try {
    const contract = createContractInstance(contractAddress, provider.getSigner());
    const tx = await contract[methodName](...params);
    return tx;
  } catch (error) {
    console.error(`Failed to send ${methodName} transaction:`, error);
    throw error;
  }
};

// 等待交易确认
export const waitForTransaction = async (
  tx: ethers.providers.TransactionResponse,
  confirmations: number = 1
): Promise<ethers.providers.TransactionReceipt> => {
  try {
    const receipt = await tx.wait(confirmations);
    return receipt;
  } catch (error) {
    console.error('Transaction failed or was not confirmed:', error);
    throw error;
  }
};

// 检查钱包是否已连接
export const isWalletConnected = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).ethereum?.selectedAddress;
};

// 声明全局window类型
declare global {
  interface Window {
    ethereum?: any;
  }
}

// 获取当前连接的账户
export const getCurrentAccount = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  try {
    const accounts = await (window as any).ethereum.request({
      method: 'eth_accounts'
    });
    return accounts[0] || null;
  } catch (error) {
    console.error('Failed to get current account:', error);
    return null;
  }
};

// 连接钱包
export const connectWallet = async (): Promise<string> => {
  if (typeof window === 'undefined') throw new Error('Wallet connection not supported in server environment');
  
  if (!(window as any).ethereum) {
    throw new Error('MetaMask or other Web3 wallet is not installed');
  }

  try {
    const accounts = await (window as any).ethereum.request({
      method: 'eth_requestAccounts'
    });
    return accounts[0];
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
};

// 切换网络
export const switchNetwork = async (chainId: number): Promise<void> => {
  if (typeof window === 'undefined') throw new Error('Network switching not supported in server environment');
  
  try {
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error: any) {
    // 如果网络不存在，添加网络
    if (error.code === 4902) {
      const networkConfig = Object.values(NETWORKS).find(n => n.chainId === chainId);
      if (networkConfig) {
        await addNetwork(networkConfig);
      }
    } else {
      throw error;
    }
  }
};

// 添加网络
export const addNetwork = async (networkConfig: any): Promise<void> => {
  if (typeof window === 'undefined') throw new Error('Network addition not supported in server environment');
  
  try {
    await (window as any).ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${networkConfig.chainId.toString(16)}`,
          chainName: networkConfig.name,
          rpcUrls: [networkConfig.rpcUrl],
          blockExplorerUrls: networkConfig.explorerUrl ? [networkConfig.explorerUrl] : undefined,
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
        },
      ],
    });
  } catch (error) {
    console.error('Failed to add network:', error);
    throw error;
  }
};

// 格式化时间
export const formatTime = (timestamp: string | Date): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

// 计算时间差（小时）
export const calculateHoursDifference = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60);
};