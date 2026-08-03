// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockVerifier
 * @notice Verifier giả cho unit test, có cùng chữ ký với `Verifier.sol` sinh từ circuit.
 * @dev CHỈ dùng cho test và local node. Trên testnet/mainnet phải deploy `Verifier.sol`
 *      thật — deploy script sẽ từ chối dùng contract này ngoài mạng local.
 */
contract MockVerifier {
    /// @notice Kết quả verify trả về, đặt bằng `setShouldVerify` trong test.
    bool public shouldVerify = true;

    function verifyProof(
        uint[2] memory,
        uint[2][2] memory,
        uint[2] memory,
        uint[3] memory
    ) external view returns (bool) {
        return shouldVerify;
    }

    function setShouldVerify(bool _shouldVerify) external {
        shouldVerify = _shouldVerify;
    }
}
