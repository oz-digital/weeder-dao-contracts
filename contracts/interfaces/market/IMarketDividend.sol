// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IMarketDividend {
    function availableTokenDividends(address _account, address _token) external view returns (uint256);

    function accrueAccountDividends(address _account) external;
    function accrueTokenDividends(address _account, address _token) external;
}
