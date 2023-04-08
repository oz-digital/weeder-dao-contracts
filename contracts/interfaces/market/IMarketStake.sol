// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IMarketStake {
    event WeederTokenStaked(
        address indexed account,
        uint256 amount
    );

    event WeederTokenRedeemed(
        address indexed account,
        uint256 amount
    );

    function stakeWeederToken(uint256 _amount) external;
    function redeemWeederToken(uint256 _amount) external;
}
