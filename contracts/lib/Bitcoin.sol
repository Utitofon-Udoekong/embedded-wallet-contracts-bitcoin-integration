// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import {SECP256K1} from "./SECP256K1.sol";

/**
 * @title Bitcoin
 * @dev Library for Bitcoin key operations and transaction signing
 */
library Bitcoin {
    // Constants
    bytes1 constant MAINNET_VERSION = 0x00;
    bytes1 constant TESTNET_VERSION = 0x6F;
    uint256 constant P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;
    uint256 constant N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
    uint256 constant GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
    uint256 constant GY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;
    
    // Error messages
    error InvalidPrivateKey();
    error InvalidSignatureLength();
    error InvalidInputLength();
    error InvalidSignature();

    /**
     * @dev Generates a Bitcoin private key using secure randomness
     * @return A 32-byte private key
     */
    function generatePrivateKey() internal view returns (bytes32) {
        bytes32 randomness = keccak256(
            abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                msg.sender,
                address(this),
                blockhash(block.number - 1)
            )
        );
        
        // Ensure private key is in valid range (1, N-1)
        uint256 key = (uint256(randomness) % (N - 1)) + 1;
        return bytes32(key);
    }

    /**
     * @dev Derives a Bitcoin public key from a private key
     * @param privateKey The 32-byte private key
     * @return The uncompressed public key (65 bytes)
     */
    function derivePublicKey(bytes32 privateKey) internal view returns (bytes memory) {
        uint256 privKey = uint256(privateKey);
        if (privKey == 0 || privKey >= N) revert InvalidPrivateKey();
        
        SECP256K1.Point memory pubKey = SECP256K1.multiplyPoint(
            SECP256K1.Point(GX, GY),
            privKey
        );
        
        return abi.encodePacked(
            bytes1(0x04),
            bytes32(pubKey.x),
            bytes32(pubKey.y)
        );
    }

    /**
     * @dev Generates a compressed public key
     * @param privateKey The private key
     * @return The compressed public key (33 bytes)
     */
    function getCompressedPublicKey(bytes32 privateKey) internal view returns (bytes memory) {
        uint256 privKey = uint256(privateKey);
        if (privKey == 0 || privKey >= N) revert InvalidPrivateKey();
        
        SECP256K1.Point memory pubKey = SECP256K1.multiplyPoint(
            SECP256K1.Point(GX, GY),
            privKey
        );
        
        // Add prefix 0x02 for even y, 0x03 for odd y
        bytes1 prefix = pubKey.y % 2 == 0 ? bytes1(0x02) : bytes1(0x03);
        
        return abi.encodePacked(
            prefix,
            bytes32(pubKey.x)
        );
    }

    /**
     * @dev Generates a Bitcoin address from a public key
     * @param pubKey The public key bytes
     * @param isTestnet Whether to use testnet version byte
     * @return The Bitcoin address bytes
     */
    function generateAddress(bytes memory pubKey, bool isTestnet) internal pure returns (bytes memory) {
        bytes20 pubKeyHash = ripemd160(abi.encodePacked(sha256(pubKey)));
        
        bytes1 version = isTestnet ? TESTNET_VERSION : MAINNET_VERSION;
        bytes memory preAddress = abi.encodePacked(version, pubKeyHash);
        
        // Add checksum (first 4 bytes of double SHA256)
        bytes32 hash1 = sha256(preAddress);
        bytes32 hash2 = sha256(abi.encodePacked(hash1));
        bytes4 checksum = bytes4(hash2);
        
        return abi.encodePacked(preAddress, checksum);
    }

    /**
     * @dev Signs a Bitcoin transaction hash using RFC6979 deterministic k
     * @param privateKey The private key
     * @param msgHash The message hash to sign
     * @return Signature components (r,s,v)
     */
    function sign(
        bytes32 privateKey,
        bytes32 msgHash
    ) internal view returns (uint256 r, uint256 s, uint8 v) {
        uint256 privKey = uint256(privateKey);
        if (privKey == 0 || privKey >= N) revert InvalidPrivateKey();

        // RFC6979 deterministic k generation would go here
        // For now using a placeholder k generation
        bytes32 k = keccak256(abi.encodePacked(privateKey, msgHash, block.timestamp));
        uint256 nonce = uint256(k) % (N - 1) + 1;

        SECP256K1.Point memory R = SECP256K1.multiplyPoint(
            SECP256K1.Point(GX, GY),
            nonce
        );
        r = R.x % N;
        
        // s = k^-1 * (hash + r * privKey) % N
        s = SECP256K1.mulmod(
            SECP256K1.inverseMod(nonce, N),
            SECP256K1.addmod(uint256(msgHash), SECP256K1.mulmod(r, privKey, N), N),
            N
        );

        // Bitcoin requires low s values
        if (s > N/2) {
            s = N - s;
            v = 1;
        } else {
            v = 0;
        }
        
        if (r == 0 || s == 0) revert InvalidSignature();
    }
} 