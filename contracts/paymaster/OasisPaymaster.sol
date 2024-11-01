// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@account-abstraction/contracts/core/BasePaymaster.sol";

/**
 * @title OasisPaymaster
 * @dev ERC-4337 Paymaster implementation for gas abstraction
 * @custom:security-contact security@oasis.com
 */
contract OasisPaymaster is BasePaymaster, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Constants
    uint256 private constant MAX_GAS_PRICE = 1000 gwei;
    uint256 private constant MIN_DEPOSIT = 0.01 ether;
    
    // Events
    event TokenWhitelisted(address indexed token, bool status);
    event PriceConfigUpdated(address indexed token, uint256 price);
    event PaymasterDeposit(address indexed token, address indexed from, uint256 amount);
    event PaymasterWithdrawal(address indexed token, address indexed to, uint256 amount);
    event GasLimitUpdated(uint256 newLimit);
    
    // Errors
    error OasisPaymaster__TokenNotWhitelisted(address token);
    error OasisPaymaster__InsufficientBalance(uint256 required, uint256 available);
    error OasisPaymaster__InvalidPrice();
    error OasisPaymaster__TransferFailed();
    error OasisPaymaster__InvalidUserOp();
    error OasisPaymaster__BelowMinimumDeposit();
    error OasisPaymaster__ExcessiveGasPrice();
    error OasisPaymaster__InvalidGasLimit();
    error OasisPaymaster__ZeroAddress();
    
    // Token configuration
    struct TokenConfig {
        bool whitelisted;
        uint256 pricePerGas; // Price in token wei per gas unit
        uint256 minBalance;  // Minimum balance required
        uint256 maxGasLimit; // Maximum gas limit per transaction
    }
    
    // State variables
    mapping(address => TokenConfig) public tokenConfigs;
    mapping(address => uint256) public tokenBalances;
    mapping(address => uint256) public userNonces;
    uint256 public maxGasLimit;
    
    constructor(
        IEntryPoint _entryPoint
    ) BasePaymaster(_entryPoint) Ownable(msg.sender) {
        maxGasLimit = 500000; // Default gas limit
    }
    
    /**
     * @dev Validates a paymaster user operation
     * @param userOp The user operation to validate
     * @param userOpHash The hash of the user operation
     * @param maxCost The maximum cost of the operation
     * @return context The context for post-operation
     * @return validationData The validation data
     */
    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal view override whenNotPaused returns (bytes memory context, uint256 validationData) {
        // Verify gas price is not excessive
        if (userOp.maxFeePerGas > MAX_GAS_PRICE) {
            revert OasisPaymaster__ExcessiveGasPrice();
        }

        // Decode paymaster and token data
        (address token) = abi.decode(userOp.paymasterAndData[20:], (address));
        
        if (token == address(0)) revert OasisPaymaster__ZeroAddress();
        
        // Verify token is whitelisted
        TokenConfig memory config = tokenConfigs[token];
        if (!config.whitelisted) {
            revert OasisPaymaster__TokenNotWhitelisted(token);
        }
        
        // Verify gas limit
        if (userOp.callGasLimit > config.maxGasLimit) {
            revert OasisPaymaster__InvalidGasLimit();
        }
        
        // Calculate required token amount
        uint256 requiredTokens = _calculateTokenAmount(token, maxCost);
        
        // Verify sufficient balance
        if (tokenBalances[token] < requiredTokens) {
            revert OasisPaymaster__InsufficientBalance(requiredTokens, tokenBalances[token]);
        }
        
        // Verify minimum balance maintained
        if (tokenBalances[token] - requiredTokens < config.minBalance) {
            revert OasisPaymaster__InsufficientBalance(
                config.minBalance,
                tokenBalances[token] - requiredTokens
            );
        }
        
        // Return context for post-op
        return (abi.encode(token, requiredTokens, userOp.sender), 0);
    }
    
    /**
     * @dev Post-operation handling
     */
    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost
    ) internal override {
        (address token, uint256 tokenAmount, address sender) = abi.decode(
            context,
            (address, uint256, address)
        );
        
        // Only deduct on success or revert
        if (mode != PostOpMode.postOpReverted) {
            uint256 actualTokenAmount = _calculateTokenAmount(token, actualGasCost);
            tokenBalances[token] -= actualTokenAmount;
            userNonces[sender]++;
        }
    }
    
    /**
     * @dev Calculates required token amount for gas cost
     */
    function _calculateTokenAmount(
        address token,
        uint256 gasCost
    ) internal view returns (uint256) {
        return (gasCost * tokenConfigs[token].pricePerGas) / 1e18;
    }
    
    /**
     * @dev Deposits tokens to the paymaster
     */
    function depositToken(
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (!tokenConfigs[token].whitelisted) {
            revert OasisPaymaster__TokenNotWhitelisted(token);
        }
        
        if (amount < MIN_DEPOSIT) {
            revert OasisPaymaster__BelowMinimumDeposit();
        }
        
        tokenBalances[token] += amount;
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        emit PaymasterDeposit(token, msg.sender, amount);
    }
    
    /**
     * @dev Withdraws tokens from the paymaster
     */
    function withdrawToken(
        address token,
        uint256 amount
    ) external onlyOwner nonReentrant {
        if (tokenBalances[token] < amount) {
            revert OasisPaymaster__InsufficientBalance(amount, tokenBalances[token]);
        }
        
        tokenBalances[token] -= amount;
        
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit PaymasterWithdrawal(token, msg.sender, amount);
    }
    
    /**
     * @dev Configures token settings
     */
    function setTokenConfig(
        address token,
        bool whitelisted,
        uint256 pricePerGas,
        uint256 minBalance,
        uint256 maxGasLimit
    ) external onlyOwner {
        if (token == address(0)) revert OasisPaymaster__ZeroAddress();
        if (pricePerGas == 0) revert OasisPaymaster__InvalidPrice();
        if (maxGasLimit > maxGasLimit) revert OasisPaymaster__InvalidGasLimit();
        
        tokenConfigs[token] = TokenConfig({
            whitelisted: whitelisted,
            pricePerGas: pricePerGas,
            minBalance: minBalance,
            maxGasLimit: maxGasLimit
        });
        
        emit TokenWhitelisted(token, whitelisted);
        emit PriceConfigUpdated(token, pricePerGas);
    }

    /**
     * @dev Sets the maximum gas limit
     */
    function setMaxGasLimit(uint256 newLimit) external onlyOwner {
        maxGasLimit = newLimit;
        emit GasLimitUpdated(newLimit);
    }

    /**
     * @dev Pauses the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
} 