// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

library OrderStatus {
    uint8 constant EMPTY = 0;
    uint8 constant CREATED = 1;
    uint8 constant CANCELED = 2;
    uint8 constant COMPLETED = 3;
}
