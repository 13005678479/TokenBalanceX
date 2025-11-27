// API 配置
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 网络配置
export const NETWORKS: Record<string, {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  symbol: string;
  decimals: number;
}> = {
  localhost: {
    chainId: 31337,
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    explorerUrl: '',
    symbol: 'TBX',
    decimals: 18
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID',
    explorerUrl: 'https://sepolia.etherscan.io',
    symbol: 'TBX',
    decimals: 18
  },
  baseSepolia: {
    chainId: 84532,
    name: 'Base Sepolia Testnet',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    symbol: 'TBX',
    decimals: 18
  }
};

// 积分计算费率
export const POINTS_RATE = 0.05;

// 分页配置
export const DEFAULT_PAGE_SIZE = 20;

// 时间格式化
export const DATE_FORMATS = {
  DATE_ONLY: 'YYYY-MM-DD',
  DATE_TIME: 'YYYY-MM-DD HH:mm:ss',
  TIME_ONLY: 'HH:mm:ss',
  DISPLAY: 'MM/DD HH:mm'
};

// 合约ABI (简化版本，实际使用时需要完整的ABI)
export const TOKEN_CONTRACT_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount)',
  'function burn(uint256 amount)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Mint(address indexed to, uint256 amount)',
  'event Burn(address indexed from, uint256 amount)'
];

// 本地存储键
export const STORAGE_KEYS = {
  WALLET_ADDRESS: 'wallet_address',
  SELECTED_NETWORK: 'selected_network',
  THEME: 'theme',
  LANGUAGE: 'language'
};