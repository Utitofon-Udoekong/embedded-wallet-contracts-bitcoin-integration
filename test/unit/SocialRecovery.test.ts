import { ethers } from "hardhat";
import { expect } from "chai";
import { SocialRecovery } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SocialRecovery", () => {
    let socialRecovery: SocialRecovery;
    let owner: SignerWithAddress;
    let guardians: SignerWithAddress[];
    let newOwner: SignerWithAddress;
    
    beforeEach(async () => {
        [owner, newOwner, ...guardians] = await ethers.getSigners();
        
        const SocialRecoveryFactory = await ethers.getContractFactory("SocialRecovery");
        socialRecovery = await SocialRecoveryFactory.deploy();
        await socialRecovery.waitForDeployment();
    });
    
    describe("Guardian Setup", () => {
        it("should set up guardians correctly", async () => {
            const guardianAddresses = guardians.slice(0, 3).map(g => g.address);
            await socialRecovery.connect(owner).setupGuardians(guardianAddresses, 2);
            
            expect(await socialRecovery.requiredApprovals(owner.address)).to.equal(2);
        });
        
        it("should revert if threshold > guardian count", async () => {
            const guardianAddresses = guardians.slice(0, 2).map(g => g.address);
            await expect(
                socialRecovery.connect(owner).setupGuardians(guardianAddresses, 3)
            ).to.be.revertedWithCustomError(
                socialRecovery,
                "SocialRecovery__InvalidGuardianCount"
            );
        });
    });
    
    describe("Recovery Process", () => {
        beforeEach(async () => {
            const guardianAddresses = guardians.slice(0, 3).map(g => g.address);
            await socialRecovery.connect(owner).setupGuardians(guardianAddresses, 2);
        });
        
        it("should execute recovery after delay and sufficient approvals", async () => {
            const tx = await socialRecovery
                .connect(guardians[0])
                .initiateRecovery(owner.address, newOwner.address);
            
            const receipt = await tx.wait();
            const event = receipt?.logs[0];
            const requestId = event?.topics[3];
            
            await socialRecovery.connect(guardians[0]).approveRecovery(requestId);
            await socialRecovery.connect(guardians[1]).approveRecovery(requestId);
            
            await time.increase(24 * 60 * 60 + 1); // 24 hours + 1 second
            
            await expect(socialRecovery.connect(owner).executeRecovery(requestId))
                .to.emit(socialRecovery, "RecoveryExecuted")
                .withArgs(requestId, newOwner.address);
        });
    });
}); 