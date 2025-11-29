// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenBalance
 * @dev ERC20代币合约，支持minting和burning功能
 * 
 * 任务1: ✅ 部署一个带mint和burn功能的erc20合约，铸造销毁几个token，转移几个token，来构造事件
 * 
 * 功能实现：
 * - ✅ mint(): 铸造代币功能 (仅合约所有者)
 * - ✅ burn(): 销毁代币功能 (任何用户)
 * - ✅ transfer(): 标准ERC20转账 + 自定义事件
 * - ✅ transferFrom(): 授权转账 + 自定义事件
 * - ✅ batchMint(): 批量铸造功能
 * 
 * 自定义事件：
 * - TokensMinted(to, amount, timestamp)
 * - TokensBurned(from, amount, timestamp)  
 * - TokensTransferred(from, to, amount, timestamp)
 * 
 * 用于追踪用户余额和计算积分
 */
contract TokenBalance is ERC20, Ownable {
    
    // 事件定义
    event TokensMinted(address indexed to, uint256 amount, uint256 timestamp);
    event TokensBurned(address indexed from, uint256 amount, uint256 timestamp);
    event TokensTransferred(address indexed from, address indexed to, uint256 amount, uint256 timestamp);
    
    // 最大供应量限制
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 10亿代币
    
    /**
     * @dev 构造函数
     * @param name 代币名称
     * @param symbol 代币符号
     */
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {
        // 构造函数中不铸造任何代币
    }
    
    /**
     * @dev 铸造代币（只有合约所有者可以调用）
     * @param to 接收地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "TokenBalance: Cannot mint to zero address");
        require(amount > 0, "TokenBalance: Mint amount must be greater than zero");
        
        uint256 currentSupply = totalSupply();
        require(currentSupply + amount <= MAX_SUPPLY, "TokenBalance: Exceeds maximum supply");
        
        _mint(to, amount);
        
        emit TokensMinted(to, amount, block.timestamp);
    }
    
    /**
     * @dev 销毁代币
     * @param amount 销毁数量
     */
    function burn(uint256 amount) external {
        require(amount > 0, "TokenBalance: Burn amount must be greater than zero");
        require(balanceOf(msg.sender) >= amount, "TokenBalance: Insufficient balance to burn");
        
        _burn(msg.sender, amount);
        
        emit TokensBurned(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev 重写transfer函数以添加自定义事件
     * @param to 接收地址
     * @param amount 转账数量
     * @return 是否成功
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        bool result = super.transfer(to, amount);
        if (result) {
            emit TokensTransferred(msg.sender, to, amount, block.timestamp);
        }
        return result;
    }
    
    /**
     * @dev 重写transferFrom函数以添加自定义事件
     * @param from 发送地址
     * @param to 接收地址
     * @param amount 转账数量
     * @return 是否成功
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        bool result = super.transferFrom(from, to, amount);
        if (result) {
            emit TokensTransferred(from, to, amount, block.timestamp);
        }
        return result;
    }
    
    /**
     * @dev 批量铸造代币（只有合约所有者可以调用）
     * @param recipients 接收地址数组
     * @param amounts 对应的铸造数量数组
     */
    function batchMint(
        address[] memory recipients,
        uint256[] memory amounts
    ) external onlyOwner {
        require(recipients.length == amounts.length, "TokenBalance: Arrays length mismatch");
        require(recipients.length > 0, "TokenBalance: Empty arrays");
        
        uint256 totalMintAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(recipients[i] != address(0), "TokenBalance: Cannot mint to zero address");
            require(amounts[i] > 0, "TokenBalance: Mint amount must be greater than zero");
            totalMintAmount += amounts[i];
        }
        
        uint256 currentSupply = totalSupply();
        require(currentSupply + totalMintAmount <= MAX_SUPPLY, "TokenBalance: Exceeds maximum supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i], block.timestamp);
        }
    }
    
    /**
     * @dev 获取合约基本信息
     * @return tokenName 代币名称
     * @return tokenSymbol 代币符号
     * @return totalTokenSupply 总供应量
     * @return maxSupply 最大供应量
     * @return contractOwner 合约所有者
     */
    function getContractInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint256 totalTokenSupply,
        uint256 maxSupply,
        address contractOwner
    ) {
        return (
            name(),
            symbol(),
            totalSupply(),
            MAX_SUPPLY,
            owner()
        );
    }
}