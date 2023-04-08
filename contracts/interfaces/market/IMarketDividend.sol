// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IMarketDividend {
    event DividendsCollected(
        uint256 amount,
        address indexed token,
        address indexed recipient,
        address indexed sender
    );

    function availableTokenDividends(address _account, address _token) external view returns (uint256);

    function accrueAccountDividends(address _account) external;
    function accrueTokenDividends(address _account, address _token) external;
}
