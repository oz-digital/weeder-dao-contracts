// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

interface IMarket {
    struct Order {
        address token;
        uint128 price;
        uint128 priceUsd;
        uint8 status;
        uint32 createdAt;
        uint32 updatedAt;
    }

    struct Accrue {
        uint256 index;
        uint32 timestamp;
    }

    event OrderCreated(uint256 id, Order order);

    event OrderCanceled(uint256 id, Order order);

    event OrderCompleted(uint256 id, Order order);

    event VaultChanged(address current, address previous);

    event TokenAddedToWhitelist(address token);

    event TokenRemovedFromWhitelist(address token);

    event TokenAccrueChanged(Accrue current, Accrue previous);

    event UserAccrueChanged(
        address user,
        address token,
        Accrue current,
        Accrue previous
    );

    function addOrder(
        uint256 _id,
        address _token,
        uint128 _priceUsd
    ) external;

    function cancelOrder(uint256 _id) external;

    function completeOrder(uint256 _id, uint128 _price) external;

    function addTokenToWhitelist(address _token) external;

    function removeTokenFromWhitelist(address _token) external;

    function setVault(address _vault) external;

    function accrueTokenDividends(address _token) external;

    function accrueUserDividends(address _user) external;

    function availableTokenDividends(address _token) external view returns (uint256);
}
