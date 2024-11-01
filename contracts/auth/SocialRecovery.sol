// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SocialRecovery
 * @dev Implements social recovery mechanism for wallet recovery
 */
contract SocialRecovery {
    using Counters for Counters.Counter;
    
    // Recovery request structure
    struct RecoveryRequest {
        address proposedOwner;
        uint256 requestTime;
        uint256 approvalCount;
        bool executed;
        mapping(address => bool) hasApproved;
    }
    
    // State variables
    mapping(bytes32 => RecoveryRequest) public recoveryRequests;
    mapping(address => address[]) public guardians;
    mapping(address => uint256) public requiredApprovals;
    uint256 public constant RECOVERY_DELAY = 24 hours;
    
    // Events
    event GuardianAdded(address indexed wallet, address indexed guardian);
    event GuardianRemoved(address indexed wallet, address indexed guardian);
    event RecoveryInitiated(address indexed wallet, address indexed proposedOwner, bytes32 requestId);
    event RecoveryApproved(bytes32 indexed requestId, address indexed guardian);
    event RecoveryExecuted(bytes32 indexed requestId, address indexed newOwner);
    
    // Errors
    error SocialRecovery__InvalidGuardianCount();
    error SocialRecovery__GuardianAlreadyExists();
    error SocialRecovery__GuardianNotFound();
    error SocialRecovery__InvalidApprovalThreshold();
    error SocialRecovery__AlreadyApproved();
    error SocialRecovery__InsufficientApprovals();
    error SocialRecovery__DelayNotMet();
    error SocialRecovery__AlreadyExecuted();
    
    /**
     * @dev Sets up guardians for a wallet
     * @param _guardians Array of guardian addresses
     * @param _threshold Number of required approvals
     */
    function setupGuardians(
        address[] calldata _guardians,
        uint256 _threshold
    ) external {
        if (_guardians.length < _threshold) {
            revert SocialRecovery__InvalidGuardianCount();
        }
        if (_threshold == 0) {
            revert SocialRecovery__InvalidApprovalThreshold();
        }
        
        // Remove existing guardians
        delete guardians[msg.sender];
        
        // Add new guardians
        for (uint256 i = 0; i < _guardians.length; i++) {
            if (guardians[msg.sender].length > 0) {
                for (uint256 j = 0; j < guardians[msg.sender].length; j++) {
                    if (guardians[msg.sender][j] == _guardians[i]) {
                        revert SocialRecovery__GuardianAlreadyExists();
                    }
                }
            }
            guardians[msg.sender].push(_guardians[i]);
            emit GuardianAdded(msg.sender, _guardians[i]);
        }
        
        requiredApprovals[msg.sender] = _threshold;
    }
    
    /**
     * @dev Initiates a recovery request
     * @param wallet Address of wallet to recover
     * @param newOwner Proposed new owner address
     */
    function initiateRecovery(
        address wallet,
        address newOwner
    ) external returns (bytes32) {
        bytes32 requestId = keccak256(
            abi.encodePacked(wallet, newOwner, block.timestamp)
        );
        
        RecoveryRequest storage request = recoveryRequests[requestId];
        request.proposedOwner = newOwner;
        request.requestTime = block.timestamp;
        request.approvalCount = 0;
        request.executed = false;
        
        emit RecoveryInitiated(wallet, newOwner, requestId);
        return requestId;
    }
    
    /**
     * @dev Approves a recovery request
     * @param requestId ID of the recovery request
     */
    function approveRecovery(bytes32 requestId) external {
        RecoveryRequest storage request = recoveryRequests[requestId];
        
        if (request.hasApproved[msg.sender]) {
            revert SocialRecovery__AlreadyApproved();
        }
        
        request.hasApproved[msg.sender] = true;
        request.approvalCount++;
        
        emit RecoveryApproved(requestId, msg.sender);
    }
    
    /**
     * @dev Executes a recovery request after delay and sufficient approvals
     * @param requestId ID of the recovery request
     */
    function executeRecovery(bytes32 requestId) external {
        RecoveryRequest storage request = recoveryRequests[requestId];
        
        if (request.executed) {
            revert SocialRecovery__AlreadyExecuted();
        }
        
        if (block.timestamp < request.requestTime + RECOVERY_DELAY) {
            revert SocialRecovery__DelayNotMet();
        }
        
        if (request.approvalCount < requiredApprovals[msg.sender]) {
            revert SocialRecovery__InsufficientApprovals();
        }
        
        request.executed = true;
        
        // Implementation specific: Transfer ownership
        // IWallet(msg.sender).transferOwnership(request.proposedOwner);
        
        emit RecoveryExecuted(requestId, request.proposedOwner);
    }
} 