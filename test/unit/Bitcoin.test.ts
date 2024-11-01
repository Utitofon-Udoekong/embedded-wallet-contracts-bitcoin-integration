import { ethers } from "hardhat";
import { expect } from "chai";
import { Bitcoin, Bitcoin__factory } from "../../typechain-types";
import { randomBytes } from "crypto";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Bitcoin Library", () => {
    let bitcoin: Bitcoin;
    let deployer: SignerWithAddress;
    
    before(async () => {
        [deployer] = await ethers.getSigners();
        const BitcoinFactory = await ethers.getContractFactory("Bitcoin");
        bitcoin = await BitcoinFactory.deploy();
        await bitcoin.waitForDeployment();
    });
    
    describe("Key Generation", () => {
        describe("Success cases", () => {
            it("should generate valid key pairs with proper entropy and salt", async () => {
                const entropy = ethers.hexlify(randomBytes(32));
                const salt = ethers.hexlify(randomBytes(32));
                
                const keyPair = await bitcoin.generateKeyPair(entropy, salt);
                
                expect(keyPair.privateKey).to.not.equal(ethers.ZeroHash);
                expect(keyPair.publicKey.length).to.equal(65); // Uncompressed
                expect(keyPair.compressedPublicKey.length).to.equal(33); // Compressed
                expect(keyPair.address).to.match(/^0x[a-fA-F0-9]{40}$/); // Hex address
            });
            
            it("should generate different keys for different entropy values", async () => {
                const entropy1 = ethers.hexlify(randomBytes(32));
                const entropy2 = ethers.hexlify(randomBytes(32));
                const salt = ethers.hexlify(randomBytes(32));
                
                const keyPair1 = await bitcoin.generateKeyPair(entropy1, salt);
                const keyPair2 = await bitcoin.generateKeyPair(entropy2, salt);
                
                expect(keyPair1.privateKey).to.not.equal(keyPair2.privateKey);
                expect(keyPair1.publicKey).to.not.equal(keyPair2.publicKey);
                expect(keyPair1.address).to.not.equal(keyPair2.address);
            });
        });
        
        describe("Failure cases", () => {
            it("should revert with zero entropy", async () => {
                const salt = ethers.hexlify(randomBytes(32));
                await expect(
                    bitcoin.generateKeyPair(ethers.ZeroHash, salt)
                ).to.be.revertedWithCustomError(
                    bitcoin,
                    "Bitcoin__InvalidEntropyLength"
                );
            });
            
            it("should revert with zero salt", async () => {
                const entropy = ethers.hexlify(randomBytes(32));
                await expect(
                    bitcoin.generateKeyPair(entropy, ethers.ZeroHash)
                ).to.be.revertedWithCustomError(
                    bitcoin,
                    "Bitcoin__InvalidSaltLength"
                );
            });
        });
    });
    
    describe("Transaction Signing", () => {
        let validKeyPair: any;
        
        beforeEach(async () => {
            const entropy = ethers.hexlify(randomBytes(32));
            const salt = ethers.hexlify(randomBytes(32));
            validKeyPair = await bitcoin.generateKeyPair(entropy, salt);
        });
        
        describe("Success cases", () => {
            it("should sign transaction hash with valid private key", async () => {
                const txHash = ethers.keccak256(randomBytes(32));
                const signature = await bitcoin.signTransaction(
                    txHash,
                    validKeyPair.privateKey,
                    1 // SIGHASH_ALL
                );
                
                expect(signature.length).to.equal(66); // 65 bytes sig + 1 byte sighash
                expect(signature.slice(-2)).to.equal("01"); // SIGHASH_ALL
            });
        });
        
        describe("Failure cases", () => {
            it("should revert with invalid private key", async () => {
                const txHash = ethers.keccak256(randomBytes(32));
                await expect(
                    bitcoin.signTransaction(txHash, ethers.ZeroHash, 1)
                ).to.be.revertedWithCustomError(
                    bitcoin,
                    "Bitcoin__InvalidPrivateKey"
                );
            });
        });
    });
}); 