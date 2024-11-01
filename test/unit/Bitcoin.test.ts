import { expect } from "chai";
import { ethers } from "hardhat";
import { createHash } from "crypto";
import { Contract } from "ethers";

describe("Bitcoin", function() {
    let bitcoin: Contract;

    before(async function() {
        const BitcoinFactory = await ethers.getContractFactory("Bitcoin");
        bitcoin = await BitcoinFactory.deploy();
        await bitcoin.waitForDeployment();
    });

    describe("Key Generation", function() {
        it("should generate valid private keys", async function() {
            const key = await bitcoin.generatePrivateKey();
            expect(key).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
            
            const keyBigInt = BigInt(key);
            const N = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
            expect(keyBigInt).to.be.lt(N);
            expect(keyBigInt).to.be.gt(0);
        });

        it("should derive correct public keys", async function() {
            // Test vector from Bitcoin wiki
            const privKey = "0x1111111111111111111111111111111111111111111111111111111111111111";
            const pubKey = await bitcoin.derivePublicKey(privKey);
            
            expect(pubKey.length).to.equal(65); // Uncompressed public key
            expect(pubKey.slice(0,2)).to.equal("0x04"); // Uncompressed prefix
        });

        it("should generate valid compressed public keys", async function() {
            const privKey = await bitcoin.generatePrivateKey();
            const compressedPubKey = await bitcoin.getCompressedPublicKey(privKey);
            
            expect(compressedPubKey.length).to.equal(33);
            const prefix = compressedPubKey.slice(0,2);
            expect(prefix === "0x02" || prefix === "0x03").to.be.true;
        });
    });

    describe("Address Generation", function() {
        it("should generate valid mainnet addresses", async function() {
            const privKey = await bitcoin.generatePrivateKey();
            const pubKey = await bitcoin.derivePublicKey(privKey);
            const address = await bitcoin.generateAddress(pubKey, false);
            
            expect(address.length).to.equal(25); // Version + pubKeyHash + checksum
            expect(address.slice(0,2)).to.equal("0x00"); // Mainnet version
        });

        it("should generate valid testnet addresses", async function() {
            const privKey = await bitcoin.generatePrivateKey();
            const pubKey = await bitcoin.derivePublicKey(privKey);
            const address = await bitcoin.generateAddress(pubKey, true);
            
            expect(address.length).to.equal(25);
            expect(address.slice(0,2)).to.equal("0x6F"); // Testnet version
        });
    });

    describe("Signing", function() {
        it("should produce valid signatures", async function() {
            const privKey = await bitcoin.generatePrivateKey();
            const msgHash = ethers.randomBytes(32);
            
            const [r, s, v] = await bitcoin.sign(privKey, msgHash);
            
            expect(r).to.not.equal(0);
            expect(s).to.not.equal(0);
            expect(v === 0 || v === 1).to.be.true;
            
            // Verify s is low
            const N = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
            expect(s <= N/2n).to.be.true;
        });
    });
}); 