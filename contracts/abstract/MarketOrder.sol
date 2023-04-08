// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../interfaces/market/IMarketOrder.sol";

import "./MarketState.sol";

abstract contract MarketOrder is MarketState, IMarketOrder {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    function createOrder(
        uint256 _id,
        address _token,
        uint128 _usdAmount
    )
        public
        override
        onlyRole(MANAGER_ROLE)
        whenNotPaused
        validOrder(_id, OrderStatus.EMPTY)
        onlyWhitelistedToken(_token)
    {
        require(_usdAmount > 0, Errors.ZERO_AMOUNT);

        Order memory newOrder = Order({
            token: _token,
            tokenAmount: 0,
            usdAmount: _usdAmount,
            status: OrderStatus.CREATED,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        Order memory savedOrder = _updateOrder(_id, newOrder);

        emit OrderChanged({
            id: _id,
            order: savedOrder,
            sender: _msgSender()
        });
    }

    function cancelOrder(uint256 _id)
        public
        override
        onlyRole(MANAGER_ROLE)
        whenNotPaused
        validOrder(_id, OrderStatus.CREATED)
    {
        Order memory currentOrder = _orders[_id];

        currentOrder.status = OrderStatus.CANCELED;

        Order memory savedOrder = _updateOrder(_id, currentOrder);

        emit OrderChanged({
            id: _id,
            order: savedOrder,
            sender: _msgSender()
        });
    }

    function completeOrder(
        uint256 _id,
        uint128 _tokenAmount
    )
        public
        override
        onlyRole(MANAGER_ROLE)
        whenNotPaused
        validOrder(_id, OrderStatus.CREATED)
    {
        require(_tokenAmount > 0, Errors.ZERO_AMOUNT);
        require(_vault != address(0), Errors.VAULT_IS_NOT_SET);
        require(_totalShares > 0, Errors.NO_SHAREHOLDERS);

        Order memory currentOrder = _orders[_id];

        IERC20Upgradeable(currentOrder.token).safeTransferFrom(
            _vault,
            address(this),
            _tokenAmount
        );

        currentOrder.tokenAmount = _tokenAmount;
        currentOrder.status = OrderStatus.COMPLETED;

        Order memory savedOrder = _updateOrder(_id, currentOrder);

        emit OrderChanged({
            id: _id,
            order: savedOrder,
            sender: _msgSender()
        });
    }
}
