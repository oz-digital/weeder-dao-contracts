// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../IOrder.sol";

interface IMarketState is IOrder {
    event AccountAccrueChanged(
        address indexed account,
        address indexed token,
        uint256 index,
        address indexed sender
    );

    event MarketAccrueChanged(
        address indexed token,
        uint256 index,
        address indexed sender
    );

    event DividendsCollected(
        uint256 amount,
        address indexed token,
        address indexed recipient,
        address indexed sender
    );

    function vault() external view returns (address);
    function weederToken() external view returns (address);

    function isWhitelisted(address _token) external view returns (bool);
    function availableTokens() external view returns (address[] memory);

    function order(uint256 _id) external view returns (Order memory);
    function share(address _account) external view returns (uint256);
    function totalShares() external view returns (uint256);

    function currentAccountAccrue(address _account, address _token) external view returns (uint256);
    function currentMarketAccrue(address _token) external view returns (uint256);
}
