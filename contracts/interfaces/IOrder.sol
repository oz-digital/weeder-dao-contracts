// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IOrder {
    struct Order {
        address token;
        uint128 tokenAmount;
        uint128 usdAmount;
        bytes32 status;
        uint256 createdAt;
        uint256 updatedAt;
    }
}
