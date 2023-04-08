// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../IOrder.sol";

interface IMarketOrder is IOrder {
    event OrderChanged(
        uint256 indexed id,
        Order order,
        address indexed sender
    );

    function createOrder(uint256 _id, address _token, uint128 _usdAmount) external;
    function cancelOrder(uint256 _id) external;
    function completeOrder(uint256 _id, uint128 _tokenAmount) external;
}
