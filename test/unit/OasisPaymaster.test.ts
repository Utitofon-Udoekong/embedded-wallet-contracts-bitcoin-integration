import { ethers } from "hardhat";
import { expect } from "chai";
import { 
    OasisPaymaster, 
    MockERC20,
    IEntryPoint 
} from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("OasisPaymaster", () => {
    let paymaster: OasisPaymaster;
    let entryPoint: IEntryPoint;
    let token: MockERC20;
    let owner: SignerWithAddress;
    let user: SignerWithAddress;
    
    const INITIAL_DEPOSIT = ethers.parseEther("1000");
    const GAS_PRICE_PER_TOKEN = ethers.parseEther("0.0001");
    const MIN_BALANCE = ethers.parseEther("10");
    const MAX_GAS_LIMIT = 400000;
    
    beforeEach(async () => {
        [owner, user] = await ethers.getSigners();
        
        // Deploy mock EntryPoint
        const EntryPointFactory = await ethers.getContractFactory("MockEntryPoint");
        entryPoint = await EntryPointFactory.deploy();
        
        // Deploy PayMaster
        const PaymasterFactory = await ethers.getContractFactory("OasisPaymaster");
        paymaster = await PaymasterFactory.deploy(await entryPoint.getAddress());
        
        // Deploy mock token
        const TokenFactory = await ethers.getContractFactory("MockERC20");
        token = await TokenFactory.deploy("Mock Token", "MTK");
        
        // Setup token config
        await paymaster.setTokenConfig(
            await token.getAddress(),
            true,
            GAS_PRICE_PER_TOKEN,
            MIN_BALANCE,
            MAX_GAS_LIMIT
        );
        
        // Mint and approve tokens
        await token.mint(user.address, INITIAL_DEPOSIT);
        await token.connect(user).approve(
            await paymaster.getAddress(),
            INITIAL_DEPOSIT
        );
    });
    
    describe("Configuration", () => {
        it("should set token config correctly", async () => {
            const config = await paymaster.tokenConfigs(await token.getAddress());
            expect(config.whitelisted).to.be.true;
            expect(config.pricePerGas).to.equal(GAS_PRICE_PER_TOKEN);
            expect(config.minBalance).to.equal(MIN_BALANCE);
            expect(config.maxGasLimit).to.equal(MAX_GAS_LIMIT);
        });
        
        it("should revert on zero address token", async () => {
            await expect(
                paymaster.setTokenConfig(
                    ethers.ZeroAddress,
                    true,
                    GAS_PRICE_PER_TOKEN,
                    MIN_BALANCE,
                    MAX_GAS_LIMIT
                )
            ).to.be.revertedWithCustomError(
                paymaster,
                "OasisPaymaster__ZeroAddress"
            );
        });
    });
    
    describe("Deposit/Withdrawal", () => {
        it("should handle deposits correctly", async () => {
            const amount = ethers.parseEther("100");
            await paymaster.connect(user).depositToken(
                await token.getAddress(),
                amount
            );
            
            expect(
                await paymaster.tokenBalances(await token.getAddress())
            ).to.equal(amount);
        });
        
        it("should revert deposits below minimum", async () => {
            const amount = ethers.parseEther("0.001");
            await expect(
                paymaster.connect(user).depositToken(
                    await token.getAddress(),
                    amount
                )
            ).to.be.revertedWithCustomError(
                paymaster,
                "OasisPaymaster__BelowMinimumDeposit"
            );
        });
    });
    
    describe("Emergency Controls", () => {
        it("should pause and unpause correctly", async () => {
            await paymaster.pause();
            expect(await paymaster.paused()).to.be.true;
            
            await paymaster.unpause();
            expect(await paymaster.paused()).to.be.false;
        });
        
        it("should not allow deposits when paused", async () => {
            await paymaster.pause();
            
            await expect(
                paymaster.connect(user).depositToken(
                    await token.getAddress(),
                    ethers.parseEther("100")
                )
            ).to.be.revertedWith("Pausable: paused");
        });
    });
}); 