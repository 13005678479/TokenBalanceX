require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config({ path: "constant.env" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",

  // 网络配置
  networks: {
    // 本地区块链网络配置
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    
    // Sepolia测试网络配置
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111,
    },
    
    // Base Sepolia测试网络配置
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84532,
    }
  },
  
  // 部署配置
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  
  // etherscan验证配置
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      baseSepolia: process.env.BASESCAN_API_KEY,
    }
  }
};