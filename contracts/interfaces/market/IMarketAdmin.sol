// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IMarketAdmin {
    event TokenAddedToWhitelist(
        address indexed token,
        address indexed sender
    );

    event TokenRemovedFromWhitelist(
        address indexed token,
        address indexed sender
    );

    event VaultChanged(
        address indexed current,
        address indexed previous,
        address indexed sender
    );

    event WeederTokenChanged(
        address indexed current,
        address indexed previous,
        address indexed sender
    );

    function setVault(address _newVault) external;
    function setWeederToken(address _newWeederToken) external;
    function addTokenToWhitelist(address _token) external;
    function removeTokenFromWhitelist(address _token) external;
}
