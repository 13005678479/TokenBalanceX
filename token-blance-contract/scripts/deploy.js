const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("开始部署TokenBalance合约...");
    
    // 获取部署账户
    const [deployer] = await ethers.getSigners();
    console.log("部署账户:", deployer.address);
    
    // 检查账户余额
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("账户余额:", ethers.formatEther(balance), "ETH");
    
    // 获取网络信息
    const network = await ethers.provider.getNetwork();
    console.log("部署网络:", network.name);
    console.log("链ID:", network.chainId.toString());
    
    // 部署合约
    const TokenBalance = await ethers.getContractFactory("TokenBalance");
    
    // 代币参数
    const tokenName = "TokenBalance";
    const tokenSymbol = "TBK";
    
    console.log("部署参数:");
    console.log("- 代币名称:", tokenName);
    console.log("- 代币符号:", tokenSymbol);
    
    const tokenBalance = await TokenBalance.deploy(tokenName, tokenSymbol);
    
    console.log("等待合约部署确认...");
    await tokenBalance.waitForDeployment();
    
    const contractAddress = await tokenBalance.getAddress();
    console.log("合约部署成功!");
    console.log("合约地址:", contractAddress);
    
    // 获取部署区块号
    const deploymentBlock = await deployer.provider.getBlockNumber();
    console.log("部署区块:", deploymentBlock);
    
    // 验证合约功能
    console.log("\n验证合约基本信息...");
    const contractInfo = await tokenBalance.getContractInfo();
    console.log("代币名称:", contractInfo.tokenName);
    console.log("代币符号:", contractInfo.tokenSymbol);
    console.log("总供应量:", ethers.formatEther(contractInfo.totalTokenSupply));
    console.log("最大供应量:", ethers.formatEther(contractInfo.maxSupply));
    console.log("合约所有者:", contractInfo.contractOwner);
    
    // 保存部署信息
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId.toString(),
        contractAddress: contractAddress,
        deploymentBlock: deploymentBlock,
        deployer: deployer.address,
        tokenName: tokenName,
        tokenSymbol: tokenSymbol,
        maxSupply: ethers.formatEther((await tokenBalance.getContractInfo()).maxSupply),
        deployedAt: new Date().toISOString(),
        transactionHash: tokenBalance.deploymentTransaction().hash
    };
    
    // 保存到文件
    const deploymentFile = path.join(__dirname, `../deployment-${network.name}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n部署信息已保存到:", deploymentFile);
    
    // 更新环境变量文件
    const envFile = path.join(__dirname, "../constant.env");
    let envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
    
    // 更新或添加合约地址和部署区块
    envContent = envContent.replace(/TOKEN_CONTRACT_ADDRESS=.*/g, `TOKEN_CONTRACT_ADDRESS=${contractAddress}`);
    envContent = envContent.replace(/TOKEN_CONTRACT_DEPLOYMENT_BLOCK=.*/g, `TOKEN_CONTRACT_DEPLOYMENT_BLOCK=${deploymentBlock}`);
    
    // 如果文件中没有这些变量，添加它们
    if (!envContent.includes('TOKEN_CONTRACT_ADDRESS=')) {
        envContent += `\nTOKEN_CONTRACT_ADDRESS=${contractAddress}`;
    }
    if (!envContent.includes('TOKEN_CONTRACT_DEPLOYMENT_BLOCK=')) {
        envContent += `\nTOKEN_CONTRACT_DEPLOYMENT_BLOCK=${deploymentBlock}`;
    }
    
    fs.writeFileSync(envFile, envContent);
    console.log("环境变量文件已更新");
    
    // 如果是本地网络，进行一些测试操作
    if (network.name === "localhost") {
        console.log("\n进行测试操作...");
        
        // 铸造一些代币给部署者
        const mintAmount = ethers.parseEther("1000");
        console.log("铸造1000个代币给部署者...");
        const mintTx = await tokenBalance.mint(deployer.address, mintAmount);
        await mintTx.wait();
        console.log("铸造成功，交易哈希:", mintTx.hash);
        
        // 检查余额
        const userBalance = await tokenBalance.balanceOf(deployer.address);
        console.log("部署者余额:", ethers.formatEther(userBalance), "TBK");
        
        // 创建另一个账户进行转账测试
        const [_, recipient] = await ethers.getSigners();
        console.log("测试转账到账户:", recipient.address);
        
        const transferAmount = ethers.parseEther("100");
        const transferTx = await tokenBalance.transfer(recipient.address, transferAmount);
        await transferTx.wait();
        console.log("转账成功，交易哈希:", transferTx.hash);
        
        // 检查转账后的余额
        const recipientBalance = await tokenBalance.balanceOf(recipient.address);
        console.log("接收方余额:", ethers.formatEther(recipientBalance), "TBK");
        
        const deployerBalanceAfter = await tokenBalance.balanceOf(deployer.address);
        console.log("部署者转账后余额:", ethers.formatEther(deployerBalanceAfter), "TBK");
        
        // 测试销毁功能
        const burnAmount = ethers.parseEther("50");
        console.log("销毁50个代币...");
        const burnTx = await tokenBalance.burn(burnAmount);
        await burnTx.wait();
        console.log("销毁成功，交易哈希:", burnTx.hash);
        
        const finalBalance = await tokenBalance.balanceOf(deployer.address);
        console.log("部署者最终余额:", ethers.formatEther(finalBalance), "TBK");
    }
    
    console.log("\n部署完成!");
    return deploymentInfo;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("部署失败:", error);
        process.exit(1);
    });