// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

library OrderStatus {
    bytes32 constant EMPTY = 0x00;
    bytes32 constant CREATED = keccak256("ORDER_STATUS_CREATED");
    bytes32 constant CANCELED = keccak256("ORDER_STATUS_CANCELED");
    bytes32 constant COMPLETED = keccak256("ORDER_STATUS_COMPLETED");
}
