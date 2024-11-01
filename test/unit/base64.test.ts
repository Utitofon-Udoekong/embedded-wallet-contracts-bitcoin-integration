import { ethers } from "hardhat";
import { randomBytes } from "crypto";
import { TestBase64 } from "../typechain-types";
import { expect } from "chai";

describe('Base64', () => {
    let c: TestBase64;
    before(async () => {
        const f = await ethers.getContractFactory('TestBase64');
        c = await f.deploy();
        await c.waitForDeployment();
    });

    it('Encode', async () => {
        for( let i = 3; i < 128; i++ )
        {
            const b = randomBytes(i);
            const w = Buffer.from(b).toString('base64url');

            const x = await c.testEncode(b);
            expect(x).eq(w);
        }
    });

    it('Encode empty input', async () => {
        const x = await c.testEncode(new Uint8Array());
        expect(x).eq('');
    });

    it('Decode', async () => {
        for(let i = 3; i < 128; i++) {
            const b = randomBytes(i);
            const encoded = Buffer.from(b).toString('base64url');
            
            const decoded = await c.testDecode(encoded);
            expect(Buffer.from(decoded).toString('hex')).eq(b.toString('hex'));
        }
    });

    it('Decode empty input', async () => {
        const decoded = await c.testDecode('');
        expect(decoded).to.deep.equal(new Uint8Array());
    });

    it('Decode invalid input length', async () => {
        // Input length must be multiple of 4
        await expect(c.testDecode('abc')).to.be.revertedWith('invalid base64 decoder input');
    });

    it('Decode invalid characters', async () => {
        // Test invalid characters that aren't in base64url alphabet
        await expect(c.testDecode('abc!')).to.be.revertedWith('invalid base64 decoder input');
        await expect(c.testDecode('abc+')).to.be.revertedWith('invalid base64 decoder input');
        await expect(c.testDecode('abc/')).to.be.revertedWith('invalid base64 decoder input');
    });

    it('Handles longer inputs', async () => {
        const longInput = randomBytes(1024); // Test with 1KB of data
        const encoded = Buffer.from(longInput).toString('base64url');
        
        const x = await c.testEncode(longInput);
        expect(x).eq(encoded);
        
        const decoded = await c.testDecode(encoded);
        expect(Buffer.from(decoded).toString('hex')).eq(longInput.toString('hex'));
    });

    it('Known test vectors', async () => {
        const testCases = [
            { input: 'Hello, World!', encoded: 'SGVsbG8sIFdvcmxkIQ' },
            { input: '👋🌍', encoded: '8J-RjfCfjoM' },
            { input: 'base64url', encoded: 'YmFzZTY0dXJs' }
        ];

        for (const test of testCases) {
            const input = Buffer.from(test.input);
            const x = await c.testEncode(input);
            expect(x).eq(test.encoded);

            const decoded = await c.testDecode(test.encoded);
            expect(Buffer.from(decoded).toString()).eq(test.input);
        }
    });
});
