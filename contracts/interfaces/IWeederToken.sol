// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IWeederToken {
    event MarketChanged(
        address indexed current,
        address indexed previous,
        address indexed sender
    );

    function setMarket(address _newMarket) external;

    function market() external view returns (address);
}
