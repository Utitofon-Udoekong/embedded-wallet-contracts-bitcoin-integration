// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "./SECP256K1.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title Bitcoin Library
 * @dev Library for Bitcoin key generation and transaction signing
 * @custom:security-contact security@yourdomain.com
 */
library Bitcoin {
    // Bitcoin constants
    uint256 constant private BITCOIN_CURVE_ORDER = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
    uint256 constant private PUBKEY_UNCOMPRESSED_LENGTH = 65;
    uint256 constant private PUBKEY_COMPRESSED_LENGTH = 33;
    
    // Error definitions
    error Bitcoin__InvalidPrivateKey(bytes32 privateKey);
    error Bitcoin__InvalidPublicKeyLength(uint256 length);
    error Bitcoin__InvalidSignatureFormat();
    error Bitcoin__InvalidEntropyLength();
    error Bitcoin__InvalidSaltLength();
    error Bitcoin__SigningFailed();
    
    /**
     * @dev Structure to hold Bitcoin key pair information
     */
    struct BitcoinKeyPair {
        bytes32 privateKey;
        bytes publicKey;
        bytes compressedPublicKey;
        string address;
    }
    
    /**
     * @dev Generates a Bitcoin key pair from entropy and salt
     * @param entropy Random entropy for key generation
     * @param salt Additional salt for key generation
     * @return BitcoinKeyPair containing private key, public key formats, and address
     */
    function generateKeyPair(
        bytes32 entropy, 
        bytes32 salt
    ) internal pure returns (BitcoinKeyPair memory) {
        // Validate inputs
        if (entropy == bytes32(0)) revert Bitcoin__InvalidEntropyLength();
        if (salt == bytes32(0)) revert Bitcoin__InvalidSaltLength();
        
        // Generate private key from entropy with additional salt
        bytes32 privateKey = bytes32(
            uint256(keccak256(abi.encodePacked(entropy, salt))) % BITCOIN_CURVE_ORDER
        );
        
        // Validate private key
        if (uint256(privateKey) == 0 || uint256(privateKey) >= BITCOIN_CURVE_ORDER) {
            revert Bitcoin__InvalidPrivateKey(privateKey);
        }
        
        // Generate uncompressed public key
        bytes memory publicKey;
        try SECP256K1.publicKeyCreate(privateKey) returns (bytes memory result) {
            publicKey = result;
        } catch {
            revert Bitcoin__SigningFailed();
        }
        
        if (publicKey.length != PUBKEY_UNCOMPRESSED_LENGTH) {
            revert Bitcoin__InvalidPublicKeyLength(publicKey.length);
        }
        
        // Generate compressed public key
        bytes memory compressedPublicKey = compressPublicKey(publicKey);
        
        // Generate Bitcoin address
        string memory address = generateBitcoinAddress(compressedPublicKey);
        
        return BitcoinKeyPair({
            privateKey: privateKey,
            publicKey: publicKey,
            compressedPublicKey: compressedPublicKey,
            address: address
        });
    }
    
    /**
     * @dev Signs a Bitcoin transaction hash
     * @param txHash Transaction hash to sign
     * @param privateKey Private key to sign with
     * @param sigHashType Bitcoin signature hash type
     * @return Signature with sighash type appended
     */
    function signTransaction(
        bytes32 txHash, 
        bytes32 privateKey,
        uint8 sigHashType
    ) internal pure returns (bytes memory) {
        // Validate private key
        if (uint256(privateKey) == 0 || uint256(privateKey) >= BITCOIN_CURVE_ORDER) {
            revert Bitcoin__InvalidPrivateKey(privateKey);
        }
        
        // Sign transaction hash using secp256k1
        bytes memory signature;
        try SECP256K1.sign(txHash, privateKey) returns (bytes memory result) {
            signature = result;
        } catch {
            revert Bitcoin__SigningFailed();
        }
        
        // Add sighash type
        return abi.encodePacked(signature, sigHashType);
    }
    
    /**
     * @dev Compresses a public key
     * @param publicKey Uncompressed public key
     * @return Compressed public key
     */
    function compressPublicKey(
        bytes memory publicKey
    ) internal pure returns (bytes memory) {
        if (publicKey.length != PUBKEY_UNCOMPRESSED_LENGTH) {
            revert Bitcoin__InvalidPublicKeyLength(publicKey.length);
        }
        
        // Extract X and Y coordinates
        bytes32 x;
        bytes32 y;
        assembly {
            x := mload(add(publicKey, 32))
            y := mload(add(publicKey, 64))
        }
        
        // Compressed public key format: 0x02/0x03 + X coordinate
        uint8 prefix = uint8(y[31]) & 1 == 0 ? 0x02 : 0x03;
        
        return abi.encodePacked(prefix, x);
    }
    
    /**
     * @dev Generates a Bitcoin address from a compressed public key
     * @param compressedPubKey Compressed public key
     * @return Bitcoin address (currently returns hex format, needs Base58Check)
     */
    function generateBitcoinAddress(
        bytes memory compressedPubKey
    ) internal pure returns (string memory) {
        if (compressedPubKey.length != PUBKEY_COMPRESSED_LENGTH) {
            revert Bitcoin__InvalidPublicKeyLength(compressedPubKey.length);
        }
        
        bytes20 pubKeyHash = bytes20(keccak256(compressedPubKey));
        return Strings.toHexString(uint160(pubKeyHash), 20);
    }
} 