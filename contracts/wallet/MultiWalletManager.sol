// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../lib/Bitcoin.sol";

/**
 * @title MultiWalletManager
 * @dev Manages multiple wallets for a single user with different chains support
 */
contract MultiWalletManager is 
    Initializable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable 
{
    // Type definitions
    enum WalletType { 
        ETHEREUM,
        BITCOIN,
        CUSTOM
    }
    
    struct Wallet {
        bytes32 id;
        string name;
        WalletType walletType;
        address ethAddress;      // For Ethereum wallets
        bytes32 btcPrivateKey;   // For Bitcoin wallets (encrypted)
        string btcAddress;       // For Bitcoin wallets
        bool active;
        uint256 createdAt;
        mapping(bytes32 => bool) authorizedKeys;
    }
    
    // Constants
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    uint256 public constant MAX_WALLETS_PER_USER = 10;
    
    // Events
    event WalletCreated(bytes32 indexed walletId, address indexed owner, WalletType walletType);
    event WalletDeactivated(bytes32 indexed walletId);
    event WalletReactivated(bytes32 indexed walletId);
    event KeyAuthorized(bytes32 indexed walletId, bytes32 indexed keyId);
    event KeyDeauthorized(bytes32 indexed walletId, bytes32 indexed keyId);
    
    // Errors
    error MultiWalletManager__MaxWalletsReached();
    error MultiWalletManager__WalletNotFound();
    error MultiWalletManager__WalletAlreadyExists();
    error MultiWalletManager__InvalidWalletType();
    error MultiWalletManager__Unauthorized();
    error MultiWalletManager__WalletInactive();
    error MultiWalletManager__KeyAlreadyAuthorized();
    error MultiWalletManager__KeyNotAuthorized();
    
    // State variables
    mapping(address => mapping(bytes32 => Wallet)) private userWallets;
    mapping(address => bytes32[]) private userWalletIds;
    mapping(address => uint256) private walletCount;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize() public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Creates a new wallet for a user
     */
    function createWallet(
        string memory name,
        WalletType walletType,
        bytes32 entropy,
        bytes32 salt
    ) external whenNotPaused nonReentrant returns (bytes32) {
        if (walletCount[msg.sender] >= MAX_WALLETS_PER_USER) {
            revert MultiWalletManager__MaxWalletsReached();
        }
        
        bytes32 walletId = keccak256(
            abi.encodePacked(msg.sender, name, block.timestamp)
        );
        
        if (userWallets[msg.sender][walletId].createdAt != 0) {
            revert MultiWalletManager__WalletAlreadyExists();
        }
        
        Wallet storage wallet = userWallets[msg.sender][walletId];
        wallet.id = walletId;
        wallet.name = name;
        wallet.walletType = walletType;
        wallet.active = true;
        wallet.createdAt = block.timestamp;
        
        if (walletType == WalletType.BITCOIN) {
            Bitcoin.BitcoinKeyPair memory keyPair = Bitcoin.generateKeyPair(entropy, salt);
            wallet.btcPrivateKey = keyPair.privateKey;
            wallet.btcAddress = keyPair.address;
        } else if (walletType == WalletType.ETHEREUM) {
            // Implementation for Ethereum wallet creation
            // This would typically involve creating a new smart contract wallet
            wallet.ethAddress = address(0); // Placeholder
        }
        
        userWalletIds[msg.sender].push(walletId);
        walletCount[msg.sender]++;
        
        emit WalletCreated(walletId, msg.sender, walletType);
        return walletId;
    }
    
    /**
     * @dev Deactivates a wallet
     */
    function deactivateWallet(bytes32 walletId) external nonReentrant {
        Wallet storage wallet = userWallets[msg.sender][walletId];
        if (wallet.createdAt == 0) {
            revert MultiWalletManager__WalletNotFound();
        }
        
        wallet.active = false;
        emit WalletDeactivated(walletId);
    }
    
    /**
     * @dev Reactivates a wallet
     */
    function reactivateWallet(bytes32 walletId) external nonReentrant {
        Wallet storage wallet = userWallets[msg.sender][walletId];
        if (wallet.createdAt == 0) {
            revert MultiWalletManager__WalletNotFound();
        }
        
        wallet.active = true;
        emit WalletReactivated(walletId);
    }
    
    /**
     * @dev Authorizes a new key for a wallet
     */
    function authorizeKey(
        bytes32 walletId,
        bytes32 keyId
    ) external nonReentrant {
        Wallet storage wallet = userWallets[msg.sender][walletId];
        if (wallet.createdAt == 0) {
            revert MultiWalletManager__WalletNotFound();
        }
        if (!wallet.active) {
            revert MultiWalletManager__WalletInactive();
        }
        if (wallet.authorizedKeys[keyId]) {
            revert MultiWalletManager__KeyAlreadyAuthorized();
        }
        
        wallet.authorizedKeys[keyId] = true;
        emit KeyAuthorized(walletId, keyId);
    }
    
    /**
     * @dev Gets all wallet IDs for a user
     */
    function getWalletIds(
        address user
    ) external view returns (bytes32[] memory) {
        return userWalletIds[user];
    }
    
    /**
     * @dev Gets wallet details
     */
    function getWallet(
        address user,
        bytes32 walletId
    ) external view returns (
        string memory name,
        WalletType walletType,
        bool active,
        uint256 createdAt
    ) {
        Wallet storage wallet = userWallets[user][walletId];
        if (wallet.createdAt == 0) {
            revert MultiWalletManager__WalletNotFound();
        }
        
        return (
            wallet.name,
            wallet.walletType,
            wallet.active,
            wallet.createdAt
        );
    }
    
    /**
     * @dev Required by the UUPSUpgradeable module
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(ADMIN_ROLE) {}
} 