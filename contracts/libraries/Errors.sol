// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

library Errors {
    string constant ORDER_ALREADY_EXISTS = "Order exists";
    string constant INVALID_ORDER_ID = "Order's ID is invalid";
    string constant INVALID_ORDER = "Wrong order";
    string constant ORDER_STATUS_IS_NOT_CREATED = "Order should has CREATED status";
    string constant TOKEN_IS_NOT_ALLOWED = "Token can not be accepted";
    string constant LOW_VAULT_ALLOWANCE = "Not enough token allowance to complete order";
    string constant LOW_TOKEN_BALANCE = "Not enough tokens to transfer";
}
