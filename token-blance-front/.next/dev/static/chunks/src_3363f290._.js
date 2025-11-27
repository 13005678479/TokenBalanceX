(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/constants.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// API 配置
__turbopack_context__.s([
    "API_BASE_URL",
    ()=>API_BASE_URL,
    "DATE_FORMATS",
    ()=>DATE_FORMATS,
    "DEFAULT_PAGE_SIZE",
    ()=>DEFAULT_PAGE_SIZE,
    "NETWORKS",
    ()=>NETWORKS,
    "POINTS_RATE",
    ()=>POINTS_RATE,
    "STORAGE_KEYS",
    ()=>STORAGE_KEYS,
    "TOKEN_CONTRACT_ABI",
    ()=>TOKEN_CONTRACT_ABI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_BASE_URL = ("TURBOPACK compile-time value", "http://localhost:8080") || 'http://localhost:8080';
const NETWORKS = {
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
const POINTS_RATE = 0.05;
const DEFAULT_PAGE_SIZE = 20;
const DATE_FORMATS = {
    DATE_ONLY: 'YYYY-MM-DD',
    DATE_TIME: 'YYYY-MM-DD HH:mm:ss',
    TIME_ONLY: 'HH:mm:ss',
    DISPLAY: 'MM/DD HH:mm'
};
const TOKEN_CONTRACT_ABI = [
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
const STORAGE_KEYS = {
    WALLET_ADDRESS: 'wallet_address',
    SELECTED_NETWORK: 'selected_network',
    THEME: 'theme',
    LANGUAGE: 'language'
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/web3.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addNetwork",
    ()=>addNetwork,
    "calculateHoursDifference",
    ()=>calculateHoursDifference,
    "connectWallet",
    ()=>connectWallet,
    "createContractInstance",
    ()=>createContractInstance,
    "formatAddress",
    ()=>formatAddress,
    "formatBalance",
    ()=>formatBalance,
    "formatTime",
    ()=>formatTime,
    "formatTxHash",
    ()=>formatTxHash,
    "getCurrentAccount",
    ()=>getCurrentAccount,
    "getExplorerAddressUrl",
    ()=>getExplorerAddressUrl,
    "getExplorerUrl",
    ()=>getExplorerUrl,
    "getTokenBalance",
    ()=>getTokenBalance,
    "getTotalSupply",
    ()=>getTotalSupply,
    "isValidAddress",
    ()=>isValidAddress,
    "isWalletConnected",
    ()=>isWalletConnected,
    "sendTransaction",
    ()=>sendTransaction,
    "switchNetwork",
    ()=>switchNetwork,
    "waitForTransaction",
    ()=>waitForTransaction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__ = __turbopack_context__.i("[project]/node_modules/ethers/lib.esm/ethers.js [app-client] (ecmascript) <export * as ethers>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/constants.ts [app-client] (ecmascript)");
;
;
const formatBalance = (balance, decimals = 18)=>{
    const etherValue = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.formatUnits(balance, decimals);
    return parseFloat(etherValue).toFixed(4);
};
const formatAddress = (address, length = 6)=>{
    if (!address) return '';
    return `${address.slice(0, length)}...${address.slice(-length)}`;
};
const isValidAddress = (address)=>{
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.isAddress(address);
};
const formatTxHash = (hash, length = 8)=>{
    if (!hash) return '';
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
};
const getExplorerUrl = (hash, network)=>{
    const networkConfig = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NETWORKS"][network];
    if (!networkConfig || !networkConfig.explorerUrl) return '#';
    return `${networkConfig.explorerUrl}/tx/${hash}`;
};
const getExplorerAddressUrl = (address, network)=>{
    const networkConfig = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NETWORKS"][network];
    if (!networkConfig || !networkConfig.explorerUrl) return '#';
    return `${networkConfig.explorerUrl}/address/${address}`;
};
const createContractInstance = (address, providerOrSigner)=>{
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].Contract(address, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKEN_CONTRACT_ABI"], providerOrSigner);
};
const getTokenBalance = async (contractAddress, userAddress, provider)=>{
    try {
        const contract = createContractInstance(contractAddress, provider);
        const balance = await contract.balanceOf(userAddress);
        return balance.toString();
    } catch (error) {
        console.error('Failed to get token balance:', error);
        throw error;
    }
};
const getTotalSupply = async (contractAddress, provider)=>{
    try {
        const contract = createContractInstance(contractAddress, provider);
        const totalSupply = await contract.totalSupply();
        return totalSupply.toString();
    } catch (error) {
        console.error('Failed to get total supply:', error);
        throw error;
    }
};
const sendTransaction = async (contractAddress, methodName, params, provider)=>{
    try {
        const contract = createContractInstance(contractAddress, provider.getSigner());
        const tx = await contract[methodName](...params);
        return tx;
    } catch (error) {
        console.error(`Failed to send ${methodName} transaction:`, error);
        throw error;
    }
};
const waitForTransaction = async (tx, confirmations = 1)=>{
    try {
        const receipt = await tx.wait(confirmations);
        return receipt;
    } catch (error) {
        console.error('Transaction failed or was not confirmed:', error);
        throw error;
    }
};
const isWalletConnected = ()=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return !!window.ethereum?.selectedAddress;
};
const getCurrentAccount = async ()=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const accounts = await window.ethereum.request({
            method: 'eth_accounts'
        });
        return accounts[0] || null;
    } catch (error) {
        console.error('Failed to get current account:', error);
        return null;
    }
};
const connectWallet = async ()=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (!window.ethereum) {
        throw new Error('MetaMask or other Web3 wallet is not installed');
    }
    try {
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        return accounts[0];
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
    }
};
const switchNetwork = async (chainId)=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [
                {
                    chainId: `0x${chainId.toString(16)}`
                }
            ]
        });
    } catch (error) {
        // 如果网络不存在，添加网络
        if (error.code === 4902) {
            const networkConfig = Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NETWORKS"]).find((n)=>n.chainId === chainId);
            if (networkConfig) {
                await addNetwork(networkConfig);
            }
        } else {
            throw error;
        }
    }
};
const addNetwork = async (networkConfig)=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
                {
                    chainId: `0x${networkConfig.chainId.toString(16)}`,
                    chainName: networkConfig.name,
                    rpcUrls: [
                        networkConfig.rpcUrl
                    ],
                    blockExplorerUrls: networkConfig.explorerUrl ? [
                        networkConfig.explorerUrl
                    ] : undefined,
                    nativeCurrency: {
                        name: 'ETH',
                        symbol: 'ETH',
                        decimals: 18
                    }
                }
            ]
        });
    } catch (error) {
        console.error('Failed to add network:', error);
        throw error;
    }
};
const formatTime = (timestamp)=>{
    const date = new Date(timestamp);
    return date.toLocaleString();
};
const calculateHoursDifference = (startTime, endTime)=>{
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60);
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/format.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateGrowthRate",
    ()=>calculateGrowthRate,
    "cn",
    ()=>cn,
    "copyToClipboard",
    ()=>copyToClipboard,
    "debounce",
    ()=>debounce,
    "downloadFile",
    ()=>downloadFile,
    "formatDate",
    ()=>formatDate,
    "formatLargeNumber",
    ()=>formatLargeNumber,
    "formatNumber",
    ()=>formatNumber,
    "formatPercentage",
    ()=>formatPercentage,
    "generateRandomColor",
    ()=>generateRandomColor,
    "getRelativeTime",
    ()=>getRelativeTime,
    "isValidEmail",
    ()=>isValidEmail,
    "storage",
    ()=>storage,
    "throttle",
    ()=>throttle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
const formatNumber = (value, decimals = 2, locale = 'en-US')=>{
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
};
const formatLargeNumber = (value)=>{
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    if (num >= 1000000000) {
        return formatNumber(num / 1000000000, 1) + 'B';
    } else if (num >= 1000000) {
        return formatNumber(num / 1000000, 1) + 'M';
    } else if (num >= 1000) {
        return formatNumber(num / 1000, 1) + 'K';
    }
    return formatNumber(num, 2);
};
const formatPercentage = (value, decimals = 2)=>{
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0.00%';
    const formatted = formatNumber(num, decimals);
    return num >= 0 ? `+${formatted}%` : `${formatted}%`;
};
const formatDate = (date, format = 'short')=>{
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    switch(format){
        case 'short':
            return dateObj.toLocaleDateString();
        case 'long':
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        case 'relative':
            return getRelativeTime(dateObj);
        default:
            return dateObj.toLocaleDateString();
    }
};
const getRelativeTime = (date)=>{
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) {
        return 'just now';
    } else if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
        return date.toLocaleDateString();
    }
};
const debounce = (func, delay)=>{
    let timeoutId;
    return (...args)=>{
        clearTimeout(timeoutId);
        timeoutId = setTimeout(()=>func(...args), delay);
    };
};
const throttle = (func, limit)=>{
    let inThrottle;
    return (...args)=>{
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(()=>inThrottle = false, limit);
        }
    };
};
const copyToClipboard = async (text)=>{
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
};
const downloadFile = (data, filename, type = 'json')=>{
    const blob = new Blob([
        JSON.stringify(data, null, 2)
    ], {
        type: `application/${type}`
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${type}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
const isValidEmail = (email)=>{
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
const generateRandomColor = ()=>{
    const colors = [
        '#3b82f6',
        '#ef4444',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
        '#ec4899',
        '#14b8a6',
        '#f97316',
        '#6366f1',
        '#84cc16'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};
const calculateGrowthRate = (current, previous)=>{
    if (previous === 0) return current > 0 ? 100 : 0;
    return (current - previous) / previous * 100;
};
const storage = {
    get: (key)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Failed to get storage item ${key}:`, error);
            return null;
        }
    },
    set: (key, value)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Failed to set storage item ${key}:`, error);
        }
    },
    remove: (key)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Failed to remove storage item ${key}:`, error);
        }
    },
    clear: ()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Failed to clear storage:', error);
        }
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/useWallet.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useWallet",
    ()=>useWallet
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__ = __turbopack_context__.i("[project]/node_modules/ethers/lib.esm/ethers.js [app-client] (ecmascript) <export * as ethers>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/web3.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/format.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/constants.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
const useWallet = ()=>{
    _s();
    const [walletInfo, setWalletInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        address: '',
        chainId: 0,
        balance: '0',
        connected: false
    });
    const [provider, setProvider] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // 初始化钱包连接
    const initializeWallet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useWallet.useCallback[initializeWallet]": async ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            setIsLoading(true);
            setError(null);
            try {
                // 检查是否有Web3钱包
                if (!window.ethereum) {
                    throw new Error('MetaMask or other Web3 wallet is not installed');
                }
                // 创建Provider实例
                const web3Provider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].providers.Web3Provider(window.ethereum);
                setProvider(web3Provider);
                // 检查是否已连接
                if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWalletConnected"])()) {
                    const accounts = await web3Provider.listAccounts();
                    if (accounts.length > 0) {
                        const address = accounts[0];
                        const balance = await web3Provider.getBalance(address);
                        const network = await web3Provider.getNetwork();
                        setWalletInfo({
                            address,
                            chainId: network.chainId,
                            balance: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.formatEther(balance),
                            connected: true
                        });
                        // 保存到本地存储
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STORAGE_KEYS"].WALLET_ADDRESS, address);
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STORAGE_KEYS"].SELECTED_NETWORK, network.chainId.toString());
                    }
                }
            } catch (err) {
                console.error('Failed to initialize wallet:', err);
                setError(err.message);
            } finally{
                setIsLoading(false);
            }
        }
    }["useWallet.useCallback[initializeWallet]"], []);
    // 连接钱包
    const connect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useWallet.useCallback[connect]": async ()=>{
            setIsLoading(true);
            setError(null);
            try {
                const address = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["connectWallet"])();
                if (provider) {
                    const balance = await provider.getBalance(address);
                    const network = await provider.getNetwork();
                    setWalletInfo({
                        address,
                        chainId: network.chainId,
                        balance: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.formatEther(balance),
                        connected: true
                    });
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STORAGE_KEYS"].WALLET_ADDRESS, address);
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STORAGE_KEYS"].SELECTED_NETWORK, network.chainId.toString());
                }
            } catch (err) {
                console.error('Failed to connect wallet:', err);
                setError(err.message);
            } finally{
                setIsLoading(false);
            }
        }
    }["useWallet.useCallback[connect]"], [
        provider
    ]);
    // 断开钱包连接
    const disconnect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useWallet.useCallback[disconnect]": ()=>{
            setWalletInfo({
                address: '',
                chainId: 0,
                balance: '0',
                connected: false
            });
            setProvider(null);
            // 清除本地存储
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].remove(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STORAGE_KEYS"].WALLET_ADDRESS);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].remove(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STORAGE_KEYS"].SELECTED_NETWORK);
        }
    }["useWallet.useCallback[disconnect]"], []);
    // 切换网络
    const switchToNetwork = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useWallet.useCallback[switchToNetwork]": async (chainId)=>{
            setIsLoading(true);
            setError(null);
            try {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["switchNetwork"])(chainId);
                // 更新钱包信息
                if (provider && walletInfo.address) {
                    const balance = await provider.getBalance(walletInfo.address);
                    const network = await provider.getNetwork();
                    setWalletInfo({
                        "useWallet.useCallback[switchToNetwork]": (prev)=>({
                                ...prev,
                                chainId: network.chainId,
                                balance: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.formatEther(balance)
                            })
                    }["useWallet.useCallback[switchToNetwork]"]);
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STORAGE_KEYS"].SELECTED_NETWORK, network.chainId.toString());
                }
            } catch (err) {
                console.error('Failed to switch network:', err);
                setError(err.message);
            } finally{
                setIsLoading(false);
            }
        }
    }["useWallet.useCallback[switchToNetwork]"], [
        provider,
        walletInfo.address
    ]);
    // 刷新余额
    const refreshBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useWallet.useCallback[refreshBalance]": async ()=>{
            if (!provider || !walletInfo.address) return;
            try {
                const balance = await provider.getBalance(walletInfo.address);
                setWalletInfo({
                    "useWallet.useCallback[refreshBalance]": (prev)=>({
                            ...prev,
                            balance: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.formatEther(balance)
                        })
                }["useWallet.useCallback[refreshBalance]"]);
            } catch (err) {
                console.error('Failed to refresh balance:', err);
                setError(err.message);
            }
        }
    }["useWallet.useCallback[refreshBalance]"], [
        provider,
        walletInfo.address
    ]);
    // 监听账户变化
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useWallet.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const handleAccountsChanged = {
                "useWallet.useEffect.handleAccountsChanged": (accounts)=>{
                    if (accounts.length === 0) {
                        disconnect();
                    } else if (accounts[0] !== walletInfo.address) {
                        initializeWallet();
                    }
                }
            }["useWallet.useEffect.handleAccountsChanged"];
            const handleChainChanged = {
                "useWallet.useEffect.handleChainChanged": (chainId)=>{
                    const newChainId = parseInt(chainId, 16);
                    setWalletInfo({
                        "useWallet.useEffect.handleChainChanged": (prev)=>({
                                ...prev,
                                chainId: newChainId
                            })
                    }["useWallet.useEffect.handleChainChanged"]);
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storage"].set(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STORAGE_KEYS"].SELECTED_NETWORK, newChainId.toString());
                    initializeWallet();
                }
            }["useWallet.useEffect.handleChainChanged"];
            const handleDisconnect = {
                "useWallet.useEffect.handleDisconnect": ()=>{
                    disconnect();
                }
            }["useWallet.useEffect.handleDisconnect"];
            // 添加事件监听器
            if (window.ethereum) {
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', handleChainChanged);
                window.ethereum.on('disconnect', handleDisconnect);
            }
            // 清理事件监听器
            return ({
                "useWallet.useEffect": ()=>{
                    if (window.ethereum) {
                        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                        window.ethereum.removeListener('chainChanged', handleChainChanged);
                        window.ethereum.removeListener('disconnect', handleDisconnect);
                    }
                }
            })["useWallet.useEffect"];
        }
    }["useWallet.useEffect"], [
        walletInfo.address,
        disconnect,
        initializeWallet
    ]);
    // 初始化时自动连接
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useWallet.useEffect": ()=>{
            initializeWallet();
        }
    }["useWallet.useEffect"], []);
    // 定期刷新余额
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useWallet.useEffect": ()=>{
            if (!walletInfo.connected) return;
            const interval = setInterval({
                "useWallet.useEffect.interval": ()=>{
                    refreshBalance();
                }
            }["useWallet.useEffect.interval"], 10000); // 每10秒刷新一次
            return ({
                "useWallet.useEffect": ()=>clearInterval(interval)
            })["useWallet.useEffect"];
        }
    }["useWallet.useEffect"], [
        walletInfo.connected,
        refreshBalance
    ]);
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
_s(useWallet, "XSo+TvaMMAShwB9YDqsJ+bXVfW4=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/Web3Context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Web3Provider",
    ()=>Web3Provider,
    "default",
    ()=>__TURBOPACK__default__export__,
    "useWeb3",
    ()=>useWeb3
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__ = __turbopack_context__.i("[project]/node_modules/ethers/lib.esm/ethers.js [app-client] (ecmascript) <export * as ethers>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useWallet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useWallet.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/web3.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-hot-toast/dist/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
const Web3Context = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const Web3Provider = ({ children })=>{
    _s();
    const { walletInfo, provider, isLoading, error, connect, disconnect, switchToNetwork, refreshBalance } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useWallet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    const [transactions, setTransactions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Map());
    // 连接钱包
    const handleConnectWallet = async ()=>{
        try {
            await connect();
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success('Wallet connected successfully!');
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.message || 'Failed to connect wallet');
        }
    };
    // 断开钱包连接
    const handleDisconnectWallet = ()=>{
        disconnect();
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success('Wallet disconnected');
    };
    // 切换网络
    const handleSwitchNetwork = async (chainId)=>{
        try {
            await switchToNetwork(chainId);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success(`Switched to network ${chainId}`);
        } catch (error) {
            console.error('Failed to switch network:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.message || 'Failed to switch network');
        }
    };
    // 发送代币交易
    const handleSendTokenTransaction = async (contractAddress, interaction)=>{
        if (!provider) {
            throw new Error('Wallet not connected');
        }
        let methodName;
        let params = [];
        switch(interaction.type){
            case 'mint':
                methodName = 'mint';
                params = [
                    interaction.to,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.parseUnits(interaction.amount, 18)
                ];
                break;
            case 'burn':
                methodName = 'burn';
                params = [
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.parseUnits(interaction.amount, 18)
                ];
                break;
            case 'transfer':
                methodName = 'transfer';
                params = [
                    interaction.to,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.parseUnits(interaction.amount, 18)
                ];
                break;
            default:
                throw new Error(`Unsupported transaction type: ${interaction.type}`);
        }
        try {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].loading('Preparing transaction...', {
                id: 'tx-prepare'
            });
            const tx = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sendTransaction"])(contractAddress, methodName, params, provider);
            // 更新交易状态
            const txStatus = {
                hash: tx.hash,
                status: 'pending',
                confirmations: 0,
                timestamp: new Date().toISOString()
            };
            setTransactions((prev)=>new Map(prev).set(tx.hash, txStatus));
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success('Transaction sent! Waiting for confirmation...', {
                id: 'tx-prepare',
                duration: 3000
            });
            // 等待交易确认
            const receipt = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["waitForTransaction"])(tx, 1);
            // 更新交易状态
            const updatedStatus = {
                hash: tx.hash,
                status: receipt.status === 1 ? 'success' : 'failed',
                confirmations: 1,
                timestamp: new Date().toISOString()
            };
            setTransactions((prev)=>new Map(prev).set(tx.hash, updatedStatus));
            if (receipt.status === 1) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success('Transaction confirmed!', {
                    duration: 5000
                });
                // 刷新余额
                setTimeout(()=>refreshBalance(), 1000);
            } else {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error('Transaction failed');
            }
            return tx.hash;
        } catch (error) {
            console.error('Transaction failed:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(error.message || 'Transaction failed');
            throw error;
        }
    };
    // 获取代币余额
    const handleGetTokenBalance = async (contractAddress, userAddress)=>{
        if (!provider) {
            throw new Error('Wallet not connected');
        }
        const address = userAddress || walletInfo.address;
        if (!address) {
            throw new Error('No address provided');
        }
        try {
            const balance = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTokenBalance"])(contractAddress, address, provider);
            return balance;
        } catch (error) {
            console.error('Failed to get token balance:', error);
            throw error;
        }
    };
    // 清理旧的交易记录
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Web3Provider.useEffect": ()=>{
            const interval = setInterval({
                "Web3Provider.useEffect.interval": ()=>{
                    const now = Date.now();
                    const cleanedTransactions = new Map(transactions);
                    transactions.forEach({
                        "Web3Provider.useEffect.interval": (status, hash)=>{
                            const txTime = new Date(status.timestamp).getTime();
                            // 保留最近1小时的交易记录
                            if (now - txTime > 3600000) {
                                cleanedTransactions.delete(hash);
                            }
                        }
                    }["Web3Provider.useEffect.interval"]);
                    if (cleanedTransactions.size !== transactions.size) {
                        setTransactions(cleanedTransactions);
                    }
                }
            }["Web3Provider.useEffect.interval"], 300000); // 每5分钟清理一次
            return ({
                "Web3Provider.useEffect": ()=>clearInterval(interval)
            })["Web3Provider.useEffect"];
        }
    }["Web3Provider.useEffect"], [
        transactions
    ]);
    const contextValue = {
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Web3Context.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/Web3Context.tsx",
        lineNumber: 208,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(Web3Provider, "YdAEO4aMFr9CbAsqw5a34WdP470=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useWallet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"]
    ];
});
_c = Web3Provider;
const useWeb3 = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(Web3Context);
    if (context === undefined) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
};
_s1(useWeb3, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
const __TURBOPACK__default__export__ = Web3Provider;
var _c;
__turbopack_context__.k.register(_c, "Web3Provider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/layout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RootLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-hot-toast/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$Web3Context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/Web3Context.tsx [app-client] (ecmascript)");
'use client';
;
;
;
;
function RootLayout({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("html", {
        lang: "en",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("head", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                        children: "TokenBalanceX - Token Balance Tracking System"
                    }, void 0, false, {
                        fileName: "[project]/src/app/layout.tsx",
                        lineNumber: 15,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meta", {
                        name: "description",
                        content: "Real-time blockchain token balance tracking and points calculation system"
                    }, void 0, false, {
                        fileName: "[project]/src/app/layout.tsx",
                        lineNumber: 16,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
                        rel: "icon",
                        href: "/favicon.ico"
                    }, void 0, false, {
                        fileName: "[project]/src/app/layout.tsx",
                        lineNumber: 17,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/layout.tsx",
                lineNumber: 14,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("body", {
                className: "bg-gray-50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$Web3Context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    children: [
                        children,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Toaster"], {
                            position: "top-right",
                            toastOptions: {
                                duration: 4000,
                                style: {
                                    background: '#363636',
                                    color: '#fff'
                                },
                                success: {
                                    duration: 3000,
                                    iconTheme: {
                                        primary: '#10b981',
                                        secondary: '#fff'
                                    }
                                },
                                error: {
                                    duration: 5000,
                                    iconTheme: {
                                        primary: '#ef4444',
                                        secondary: '#fff'
                                    }
                                }
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/app/layout.tsx",
                            lineNumber: 22,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/layout.tsx",
                    lineNumber: 20,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/layout.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/layout.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
_c = RootLayout;
var _c;
__turbopack_context__.k.register(_c, "RootLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_3363f290._.js.map