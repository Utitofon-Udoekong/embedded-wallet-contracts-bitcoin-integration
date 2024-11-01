import { ethers } from "hardhat";
import { expect } from "chai";
import { 
    MultiWalletManager,
    MultiWalletManager__factory 
} from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { randomBytes } from "crypto";

describe("MultiWalletManager", () => {
    let multiWalletManager: MultiWalletManager;
    let owner: SignerWithAddress;
    let user: SignerWithAddress;
    let admin: SignerWithAddress;
    
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
    
    beforeEach(async () => {
        [owner, user, admin] = await ethers.getSigners();
        
        const MultiWalletManagerFactory = await ethers.getContractFactory("MultiWalletManager");
        const proxy = await ethers.deployProxy(MultiWalletManagerFactory, [], {
            kind: 'uups',
            initializer: 'initialize'
        });
        multiWalletManager = MultiWalletManager__factory.connect(
            await proxy.getAddress(),
            owner
        );
        
        // Grant admin role
        await multiWalletManager.grantRole(ADMIN_ROLE, admin.address);
    });
    
    describe("Initialization", () => {
        it("should set up roles correctly", async () => {
            expect(await multiWalletManager.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
            expect(await multiWalletManager.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
        });
    });
    
    describe("Wallet Management", () => {
        describe("Creation", () => {
            it("should create a Bitcoin wallet", async () => {
                const entropy = ethers.hexlify(randomBytes(32));
                const salt = ethers.hexlify(randomBytes(32));
                
                const tx = await multiWalletManager.connect(user).createWallet(
                    "My Bitcoin Wallet",
                    0, // BITCOIN
                    entropy,
                    salt
                );
                
                const receipt = await tx.wait();
                const event = receipt?.logs[0];
                const walletId = event?.topics[1];
                
                const wallet = await multiWalletManager.getWallet(
                    user.address,
                    walletId
                );
                
                expect(wallet.name).to.equal("My Bitcoin Wallet");
                expect(wallet.walletType).to.equal(0); // BITCOIN
                expect(wallet.active).to.be.true;
            });
            
            it("should enforce wallet limit per user", async () => {
                const entropy = ethers.hexlify(randomBytes(32));
                const salt = ethers.hexlify(randomBytes(32));
                
                // Create max number of wallets
                for(let i = 0; i < 10; i++) {
                    await multiWalletManager.connect(user).createWallet(
                        `Wallet ${i}`,
                        0,
                        entropy,
                        salt
                    );
                }
                
                // Try to create one more
                await expect(
                    multiWalletManager.connect(user).createWallet(
                        "Extra Wallet",
                        0,
                        entropy,
                        salt
                    )
                ).to.be.revertedWithCustomError(
                    multiWalletManager,
                    "MultiWalletManager__MaxWalletsReached"
                );
            });
        });
        
        describe("Deactivation/Reactivation", () => {
            let walletId: string;
            
            beforeEach(async () => {
                const entropy = ethers.hexlify(randomBytes(32));
                const salt = ethers.hexlify(randomBytes(32));
                
                const tx = await multiWalletManager.connect(user).createWallet(
                    "Test Wallet",
                    0,
                    entropy,
                    salt
                );
                
                const receipt = await tx.wait();
                const event = receipt?.logs[0];
                walletId = event?.topics[1];
            });
            
            it("should deactivate and reactivate wallet", async () => {
                await multiWalletManager.connect(user).deactivateWallet(walletId);
                let wallet = await multiWalletManager.getWallet(user.address, walletId);
                expect(wallet.active).to.be.false;
                
                await multiWalletManager.connect(user).reactivateWallet(walletId);
                wallet = await multiWalletManager.getWallet(user.address, walletId);
                expect(wallet.active).to.be.true;
            });
        });
        
        describe("Key Authorization", () => {
            let walletId: string;
            
            beforeEach(async () => {
                const entropy = ethers.hexlify(randomBytes(32));
                const salt = ethers.hexlify(randomBytes(32));
                
                const tx = await multiWalletManager.connect(user).createWallet(
                    "Test Wallet",
                    0,
                    entropy,
                    salt
                );
                
                const receipt = await tx.wait();
                const event = receipt?.logs[0];
                walletId = event?.topics[1];
            });
            
            it("should authorize new keys", async () => {
                const keyId = ethers.hexlify(randomBytes(32));
                
                await expect(
                    multiWalletManager.connect(user).authorizeKey(walletId, keyId)
                ).to.emit(multiWalletManager, "KeyAuthorized")
                    .withArgs(walletId, keyId);
            });
            
            it("should not authorize keys for inactive wallet", async () => {
                await multiWalletManager.connect(user).deactivateWallet(walletId);
                
                const keyId = ethers.hexlify(randomBytes(32));
                
                await expect(
                    multiWalletManager.connect(user).authorizeKey(walletId, keyId)
                ).to.be.revertedWithCustomError(
                    multiWalletManager,
                    "MultiWalletManager__WalletInactive"
                );
            });
        });
    });
    
    describe("Access Control", () => {
        it("should only allow admin to upgrade", async () => {
            const NewMultiWalletManagerFactory = await ethers.getContractFactory("MultiWalletManager");
            const newImplementation = await NewMultiWalletManagerFactory.deploy();
            
            await expect(
                multiWalletManager.connect(user).upgradeToAndCall(
                    await newImplementation.getAddress(),
                    "0x"
                )
            ).to.be.reverted;
            
            await expect(
                multiWalletManager.connect(admin).upgradeToAndCall(
                    await newImplementation.getAddress(),
                    "0x"
                )
            ).to.not.be.reverted;
        });
    });
}); 