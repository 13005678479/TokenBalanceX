module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[project]/src/lib/constants.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/src/utils/web3.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__ = __turbopack_context__.i("[project]/node_modules/ethers/lib.esm/ethers.js [app-ssr] (ecmascript) <export * as ethers>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/constants.ts [app-ssr] (ecmascript)");
;
;
const formatBalance = (balance, decimals = 18)=>{
    const etherValue = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.formatUnits(balance, decimals);
    return parseFloat(etherValue).toFixed(4);
};
const formatAddress = (address, length = 6)=>{
    if (!address) return '';
    return `${address.slice(0, length)}...${address.slice(-length)}`;
};
const isValidAddress = (address)=>{
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.isAddress(address);
};
const formatTxHash = (hash, length = 8)=>{
    if (!hash) return '';
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
};
const getExplorerUrl = (hash, network)=>{
    const networkConfig = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NETWORKS"][network];
    if (!networkConfig || !networkConfig.explorerUrl) return '#';
    return `${networkConfig.explorerUrl}/tx/${hash}`;
};
const getExplorerAddressUrl = (address, network)=>{
    const networkConfig = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NETWORKS"][network];
    if (!networkConfig || !networkConfig.explorerUrl) return '#';
    return `${networkConfig.explorerUrl}/address/${address}`;
};
const createContractInstance = (address, providerOrSigner)=>{
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].Contract(address, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TOKEN_CONTRACT_ABI"], providerOrSigner);
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
    if ("TURBOPACK compile-time truthy", 1) return false;
    //TURBOPACK unreachable
    ;
};
const getCurrentAccount = async ()=>{
    if ("TURBOPACK compile-time truthy", 1) return null;
    //TURBOPACK unreachable
    ;
};
const connectWallet = async ()=>{
    if ("TURBOPACK compile-time truthy", 1) throw new Error('Wallet connection not supported in server environment');
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
    if ("TURBOPACK compile-time truthy", 1) throw new Error('Network switching not supported in server environment');
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
            const networkConfig = Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NETWORKS"]).find((n)=>n.chainId === chainId);
            if (networkConfig) {
                await addNetwork(networkConfig);
            }
        } else {
            throw error;
        }
    }
};
const addNetwork = async (networkConfig)=>{
    if ("TURBOPACK compile-time truthy", 1) throw new Error('Network addition not supported in server environment');
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
}),
"[project]/src/utils/format.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
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
        if ("TURBOPACK compile-time truthy", 1) return null;
        //TURBOPACK unreachable
        ;
    },
    set: (key, value)=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    },
    remove: (key)=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    },
    clear: ()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    }
};
}),
"[project]/src/hooks/useWallet.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useWallet",
    ()=>useWallet
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__ = __turbopack_context__.i("[project]/node_modules/ethers/lib.esm/ethers.js [app-ssr] (ecmascript) <export * as ethers>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/web3.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/format.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/constants.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
const useWallet = ()=>{
    const [walletInfo, setWalletInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        address: '',
        chainId: 0,
        balance: '0',
        connected: false
    });
    const [provider, setProvider] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // 初始化钱包连接
    const initializeWallet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    }, []);
    // 连接钱包
    const connect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        setIsLoading(true);
        setError(null);
        try {
            const address = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["connectWallet"])();
            if (provider) {
                const balance = await provider.getBalance(address);
                const network = await provider.getNetwork();
                setWalletInfo({
                    address,
                    chainId: network.chainId,
                    balance: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.formatEther(balance),
                    connected: true
                });
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].set(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STORAGE_KEYS"].WALLET_ADDRESS, address);
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].set(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STORAGE_KEYS"].SELECTED_NETWORK, network.chainId.toString());
            }
        } catch (err) {
            console.error('Failed to connect wallet:', err);
            setError(err.message);
        } finally{
            setIsLoading(false);
        }
    }, [
        provider
    ]);
    // 断开钱包连接
    const disconnect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setWalletInfo({
            address: '',
            chainId: 0,
            balance: '0',
            connected: false
        });
        setProvider(null);
        // 清除本地存储
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].remove(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STORAGE_KEYS"].WALLET_ADDRESS);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].remove(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STORAGE_KEYS"].SELECTED_NETWORK);
    }, []);
    // 切换网络
    const switchToNetwork = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (chainId)=>{
        setIsLoading(true);
        setError(null);
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["switchNetwork"])(chainId);
            // 更新钱包信息
            if (provider && walletInfo.address) {
                const balance = await provider.getBalance(walletInfo.address);
                const network = await provider.getNetwork();
                setWalletInfo((prev)=>({
                        ...prev,
                        chainId: network.chainId,
                        balance: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.formatEther(balance)
                    }));
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].set(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STORAGE_KEYS"].SELECTED_NETWORK, network.chainId.toString());
            }
        } catch (err) {
            console.error('Failed to switch network:', err);
            setError(err.message);
        } finally{
            setIsLoading(false);
        }
    }, [
        provider,
        walletInfo.address
    ]);
    // 刷新余额
    const refreshBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!provider || !walletInfo.address) return;
        try {
            const balance = await provider.getBalance(walletInfo.address);
            setWalletInfo((prev)=>({
                    ...prev,
                    balance: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.formatEther(balance)
                }));
        } catch (err) {
            console.error('Failed to refresh balance:', err);
            setError(err.message);
        }
    }, [
        provider,
        walletInfo.address
    ]);
    // 监听账户变化
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const handleAccountsChanged = undefined;
        const handleChainChanged = undefined;
        const handleDisconnect = undefined;
    }, [
        walletInfo.address,
        disconnect,
        initializeWallet
    ]);
    // 初始化时自动连接
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        initializeWallet();
    }, []);
    // 定期刷新余额
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!walletInfo.connected) return;
        const interval = setInterval(()=>{
            refreshBalance();
        }, 10000); // 每10秒刷新一次
        return ()=>clearInterval(interval);
    }, [
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
}),
"[project]/src/contexts/Web3Context.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Web3Provider",
    ()=>Web3Provider,
    "default",
    ()=>__TURBOPACK__default__export__,
    "useWeb3",
    ()=>useWeb3
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__ = __turbopack_context__.i("[project]/node_modules/ethers/lib.esm/ethers.js [app-ssr] (ecmascript) <export * as ethers>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useWallet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useWallet.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/web3.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-hot-toast/dist/index.mjs [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
const Web3Context = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const Web3Provider = ({ children })=>{
    const { walletInfo, provider, isLoading, error, connect, disconnect, switchToNetwork, refreshBalance } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useWallet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWallet"])();
    const [transactions, setTransactions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Map());
    // 连接钱包
    const handleConnectWallet = async ()=>{
        try {
            await connect();
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].success('Wallet connected successfully!');
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].error(error.message || 'Failed to connect wallet');
        }
    };
    // 断开钱包连接
    const handleDisconnectWallet = ()=>{
        disconnect();
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].success('Wallet disconnected');
    };
    // 切换网络
    const handleSwitchNetwork = async (chainId)=>{
        try {
            await switchToNetwork(chainId);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].success(`Switched to network ${chainId}`);
        } catch (error) {
            console.error('Failed to switch network:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].error(error.message || 'Failed to switch network');
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
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.parseUnits(interaction.amount, 18)
                ];
                break;
            case 'burn':
                methodName = 'burn';
                params = [
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.parseUnits(interaction.amount, 18)
                ];
                break;
            case 'transfer':
                methodName = 'transfer';
                params = [
                    interaction.to,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ethers$2f$lib$2e$esm$2f$ethers$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__ethers$3e$__["ethers"].utils.parseUnits(interaction.amount, 18)
                ];
                break;
            default:
                throw new Error(`Unsupported transaction type: ${interaction.type}`);
        }
        try {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].loading('Preparing transaction...', {
                id: 'tx-prepare'
            });
            const tx = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sendTransaction"])(contractAddress, methodName, params, provider);
            // 更新交易状态
            const txStatus = {
                hash: tx.hash,
                status: 'pending',
                confirmations: 0,
                timestamp: new Date().toISOString()
            };
            setTransactions((prev)=>new Map(prev).set(tx.hash, txStatus));
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].success('Transaction sent! Waiting for confirmation...', {
                id: 'tx-prepare',
                duration: 3000
            });
            // 等待交易确认
            const receipt = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["waitForTransaction"])(tx, 1);
            // 更新交易状态
            const updatedStatus = {
                hash: tx.hash,
                status: receipt.status === 1 ? 'success' : 'failed',
                confirmations: 1,
                timestamp: new Date().toISOString()
            };
            setTransactions((prev)=>new Map(prev).set(tx.hash, updatedStatus));
            if (receipt.status === 1) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].success('Transaction confirmed!', {
                    duration: 5000
                });
                // 刷新余额
                setTimeout(()=>refreshBalance(), 1000);
            } else {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].error('Transaction failed');
            }
            return tx.hash;
        } catch (error) {
            console.error('Transaction failed:', error);
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toast"].error(error.message || 'Transaction failed');
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
            const balance = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$web3$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getTokenBalance"])(contractAddress, address, provider);
            return balance;
        } catch (error) {
            console.error('Failed to get token balance:', error);
            throw error;
        }
    };
    // 清理旧的交易记录
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const interval = setInterval(()=>{
            const now = Date.now();
            const cleanedTransactions = new Map(transactions);
            transactions.forEach((status, hash)=>{
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
        return ()=>clearInterval(interval);
    }, [
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Web3Context.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/Web3Context.tsx",
        lineNumber: 208,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const useWeb3 = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(Web3Context);
    if (context === undefined) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
};
const __TURBOPACK__default__export__ = Web3Provider;
}),
"[project]/src/app/layout.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RootLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-hot-toast/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$Web3Context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/Web3Context.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function RootLayout({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("html", {
        lang: "en",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("head", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                        children: "TokenBalanceX - Token Balance Tracking System"
                    }, void 0, false, {
                        fileName: "[project]/src/app/layout.tsx",
                        lineNumber: 15,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("meta", {
                        name: "description",
                        content: "Real-time blockchain token balance tracking and points calculation system"
                    }, void 0, false, {
                        fileName: "[project]/src/app/layout.tsx",
                        lineNumber: 16,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("body", {
                className: "bg-gray-50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$Web3Context$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    children: [
                        children,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$hot$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Toaster"], {
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
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e3076847._.js.map