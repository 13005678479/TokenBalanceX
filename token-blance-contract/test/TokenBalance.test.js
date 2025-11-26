const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenBalance", function () {
    let tokenBalance;
    let owner;
    let addr1;
    let addr2;
    
    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        
        const TokenBalance = await ethers.getContractFactory("TokenBalance");
        tokenBalance = await TokenBalance.deploy("TokenBalance", "TBK");
        await tokenBalance.waitForDeployment();
    });
    
    describe("部署", function () {
        it("应该设置正确的名称和符号", async function () {
            expect(await tokenBalance.name()).to.equal("TokenBalance");
            expect(await tokenBalance.symbol()).to.equal("TBK");
        });
        
        it("应该将部署者设置为所有者", async function () {
            expect(await tokenBalance.owner()).to.equal(owner.address);
        });
        
        it("初始总供应量应该为0", async function () {
            expect(await tokenBalance.totalSupply()).to.equal(0);
        });
    });
    
    describe("铸造功能", function () {
        it("只有所有者可以铸造代币", async function () {
            const mintAmount = ethers.parseEther("100");
            
            await expect(tokenBalance.connect(addr1).mint(addr1.address, mintAmount))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });
        
        it("所有者应该能够铸造代币", async function () {
            const mintAmount = ethers.parseEther("100");
            
            await expect(tokenBalance.mint(addr1.address, mintAmount))
                .to.emit(tokenBalance, "TokensMinted")
                .withArgs(addr1.address, mintAmount, anyValue);
            
            expect(await tokenBalance.balanceOf(addr1.address)).to.equal(mintAmount);
            expect(await tokenBalance.totalSupply()).to.equal(mintAmount);
        });
        
        it("不能铸造到零地址", async function () {
            const mintAmount = ethers.parseEther("100");
            
            await expect(tokenBalance.mint(ethers.ZeroAddress, mintAmount))
                .to.be.revertedWith("TokenBalance: Cannot mint to zero address");
        });
        
        it("不能超过最大供应量", async function () {
            const maxSupply = await tokenBalance.MAX_SUPPLY();
            
            await expect(tokenBalance.mint(owner.address, maxSupply + BigInt(1)))
                .to.be.revertedWith("TokenBalance: Exceeds maximum supply");
        });
    });
    
    describe("销毁功能", function () {
        beforeEach(async function () {
            const mintAmount = ethers.parseEther("1000");
            await tokenBalance.mint(owner.address, mintAmount);
        });
        
        it("用户应该能够销毁自己的代币", async function () {
            const burnAmount = ethers.parseEther("100");
            const initialBalance = await tokenBalance.balanceOf(owner.address);
            
            await expect(tokenBalance.burn(burnAmount))
                .to.emit(tokenBalance, "TokensBurned")
                .withArgs(owner.address, burnAmount, anyValue);
            
            expect(await tokenBalance.balanceOf(owner.address)).to.equal(initialBalance - burnAmount);
            expect(await tokenBalance.totalSupply()).to.equal(initialBalance - burnAmount);
        });
        
        it("不能销毁超过余额的代币", async function () {
            const balance = await tokenBalance.balanceOf(owner.address);
            
            await expect(tokenBalance.burn(balance + BigInt(1)))
                .to.be.revertedWith("TokenBalance: Insufficient balance to burn");
        });
    });
    
    describe("转账功能", function () {
        beforeEach(async function () {
            const mintAmount = ethers.parseEther("1000");
            await tokenBalance.mint(owner.address, mintAmount);
        });
        
        it("应该能够转账代币", async function () {
            const transferAmount = ethers.parseEther("100");
            
            await expect(tokenBalance.transfer(addr1.address, transferAmount))
                .to.emit(tokenBalance, "TokensTransferred")
                .withArgs(owner.address, addr1.address, transferAmount, anyValue)
                .and.to.emit(tokenBalance, "Transfer")
                .withArgs(owner.address, addr1.address, transferAmount);
            
            expect(await tokenBalance.balanceOf(addr1.address)).to.equal(transferAmount);
        });
        
        it("应该能够使用transferFrom转账", async function () {
            const transferAmount = ethers.parseEther("100");
            
            await tokenBalance.approve(addr1.address, transferAmount);
            
            await expect(tokenBalance.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount))
                .to.emit(tokenBalance, "TokensTransferred")
                .withArgs(owner.address, addr2.address, transferAmount, anyValue);
            
            expect(await tokenBalance.balanceOf(addr2.address)).to.equal(transferAmount);
        });
    });
    
    describe("批量铸造", function () {
        it("所有者应该能够批量铸造代币", async function () {
            const recipients = [addr1.address, addr2.address];
            const amounts = [ethers.parseEther("100"), ethers.parseEther("200")];
            
            await expect(tokenBalance.batchMint(recipients, amounts))
                .to.emit(tokenBalance, "TokensMinted")
                .withArgs(addr1.address, amounts[0], anyValue)
                .and.to.emit(tokenBalance, "TokensMinted")
                .withArgs(addr2.address, amounts[1], anyValue);
            
            expect(await tokenBalance.balanceOf(addr1.address)).to.equal(amounts[0]);
            expect(await tokenBalance.balanceOf(addr2.address)).to.equal(amounts[1]);
            expect(await tokenBalance.totalSupply()).to.equal(amounts[0] + amounts[1]);
        });
        
        it("批量铸造数组长度必须匹配", async function () {
            const recipients = [addr1.address, addr2.address];
            const amounts = [ethers.parseEther("100")];
            
            await expect(tokenBalance.batchMint(recipients, amounts))
                .to.be.revertedWith("TokenBalance: Arrays length mismatch");
        });
    });
});