// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/IMarket.sol";

import "./libraries/Errors.sol";
import "./libraries/OrderStatus.sol";

contract Market is Ownable, IMarket {
    address public vault;
    IERC20 immutable weederToken;

    mapping(uint256 => Order) public orders;
    mapping(address => bool) public tokenToWhitelistStatus;
    address[] public availableTokens;

    mapping(address => Accrue) public tokenToAccrue;
    mapping(address => mapping(address => Accrue)) public userToAccrue;

    modifier onlyWhitelistedToken(address _token) {
        require(tokenToWhitelistStatus[_token], Errors.TOKEN_IS_NOT_ALLOWED);
        _;
    }

    modifier validOrderId(uint256 _id) {
        require(_id > 0, Errors.INVALID_ORDER_ID);
        _;
    }

    constructor(IERC20 _weederToken) {
        weederToken = _weederToken;
    }

    function setVault(address _vault) external override onlyOwner {
        address previous = vault;

        vault = _vault;

        emit VaultChanged({ current: _vault, previous: previous });
    }

    function addTokenToWhitelist(address _token) external override onlyOwner {
        tokenToWhitelistStatus[_token] = true;
        availableTokens.push(_token);

        emit TokenAddedToWhitelist(_token);
    }

    function removeTokenFromWhitelist(address _token) external override onlyOwner {
        tokenToWhitelistStatus[_token] = false;

        emit TokenRemovedFromWhitelist(_token);
    }

    function addOrder(
        uint256 _id,
        address _token,
        uint128 _priceUsd
    )
        external
        override
        onlyOwner
        validOrderId(_id)
        onlyWhitelistedToken(_token)
    {
        require(orders[_id].status == OrderStatus.EMPTY, Errors.ORDER_ALREADY_EXISTS);
        require(_priceUsd > 0, Errors.INVALID_ORDER);

        Order memory order = Order({
            token: _token,
            price: 0,
            priceUsd: _priceUsd,
            status: OrderStatus.CREATED,
            createdAt: _now(),
            updatedAt: _now()
        });

        orders[_id] = order;

        emit OrderCreated({ id: _id, order: order });
    }

    function cancelOrder(uint256 _id)
        external
        override
        onlyOwner
        validOrderId(_id)
    {
        require(orders[_id].status == OrderStatus.CREATED, Errors.ORDER_STATUS_IS_NOT_CREATED);

        Order storage order = orders[_id];

        order.updatedAt = _now();
        order.status = OrderStatus.CANCELED;

        emit OrderCanceled({ id: _id, order: order });
    }

    function completeOrder(
        uint256 _id,
        uint128 _price
    )
        external
        override
        onlyOwner
        validOrderId(_id)
    {
        require(orders[_id].status == OrderStatus.CREATED, Errors.ORDER_STATUS_IS_NOT_CREATED);

        Order storage order = orders[_id];

        require(
            IERC20(order.token).transferFrom(vault, address(this), _price),
            Errors.LOW_VAULT_ALLOWANCE
        );

        order.price = _price;
        order.updatedAt = _now();
        order.status = OrderStatus.COMPLETED;

        Accrue memory previous = tokenToAccrue[order.token];
        Accrue storage accrue = tokenToAccrue[order.token];

        accrue.index += _price;
        accrue.timestamp = _now();

        emit OrderCompleted({ id: _id, order: order });
        emit TokenAccrueChanged({ current: accrue, previous: previous });
    }

    function accrueUserDividends(address _user)
        external
        override
    {
        uint256 shares = weederToken.balanceOf(_user);
        uint256 supply = weederToken.totalSupply();

        for (uint i = 0; i < availableTokens.length; i++) {
            _accrueTokenDividends(_user, availableTokens[i], shares, supply);
        }
    }

    function accrueTokenDividends(address _token)
        external
        override
    {
        uint256 shares = weederToken.balanceOf(msg.sender);
        uint256 supply = weederToken.totalSupply();

        _accrueTokenDividends(msg.sender, _token, shares, supply);
    }

    function availableTokenDividends(address _token) external view override returns (uint256) {
        address user = msg.sender;

        uint256 shares = weederToken.balanceOf(user);
        uint256 supply = weederToken.totalSupply();

        Accrue memory tokenAccrue = tokenToAccrue[_token];
        Accrue memory userAccrue = userToAccrue[user][_token];

        return (tokenAccrue.index - userAccrue.index) * shares / supply;
    }

    function _accrueTokenDividends(
        address _user,
        address _token,
        uint256 _shares,
        uint256 _supply
    ) private {
        Accrue memory tokenAccrue = tokenToAccrue[_token];
        Accrue memory previous = userToAccrue[_user][_token];
        Accrue storage userAccrue = userToAccrue[_user][_token];

        uint256 rewards = (tokenAccrue.index - userAccrue.index) * _shares / _supply;

        require(
            IERC20(_token).transfer(_user, rewards),
            Errors.LOW_TOKEN_BALANCE
        );

        userAccrue.index = tokenAccrue.index;
        userAccrue.timestamp = _now();

        emit UserAccrueChanged({
            user: _user,
            token: _token,
            current: userAccrue,
            previous: previous
        });
    }

    function _now() private view returns (uint32) {
        return uint32(block.timestamp);
    }
}