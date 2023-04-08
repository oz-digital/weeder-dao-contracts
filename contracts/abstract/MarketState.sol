// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";

import "../interfaces/market/IMarketState.sol";

import "../libraries/OrderStatus.sol";
import "../libraries/Errors.sol";

abstract contract MarketState is
    PausableUpgradeable,
    AccessControlUpgradeable,
    IMarketState
{
    using Errors for bytes32;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    uint256 public constant MANTISSA = 1e18;

    address internal _vault;
    address internal _weederToken;

    mapping(address => bool) internal _tokenToWhitelistStatus;
    address[] internal _availableTokens;

    mapping(uint256 => Order) internal _orders;
    mapping(address => uint256) internal _shares;
    uint256 internal _totalShares;

    mapping(address => uint256) internal _tokenToAccrue;
    mapping(address => mapping(address => uint256)) internal _accountToAccrue;

    modifier onlyWhitelistedToken(address _token) {
        require(_tokenToWhitelistStatus[_token], Errors.TOKEN_IS_NOT_ALLOWED);
        _;
    }

    modifier validOrder(uint256 _id, bytes32 _status) {
        require(_id > 0, Errors.INVALID_ORDER_ID);
        require(_orders[_id].status == _status, _status.getOrderStatusError());
        _;
    }

    function vault() public view override returns (address) {
        return _vault;
    }

    function weederToken() public view override returns (address) {
        return _weederToken;
    }

    function isWhitelisted(address _token) public view override returns (bool) {
        return _tokenToWhitelistStatus[_token];
    }

    function availableTokens() public view override returns (address[] memory) {
        return _availableTokens;
    }

    function order(uint256 _id) public view override returns (Order memory) {
        return _orders[_id];
    }

    function share(address _account) public view override returns (uint256) {
        return _shares[_account];
    }

    function totalShares() public view override returns (uint256) {
        return _totalShares;
    }

    function currentAccountAccrue(address _account, address _token) public view override returns (uint256) {
        return _accountToAccrue[_account][_token];
    }

    function currentMarketAccrue(address _token) public view override returns (uint256) {
        return _tokenToAccrue[_token];
    }

    function _updateOrder(uint256 _id, Order memory _order) internal returns (Order memory) {
        _order.updatedAt = block.timestamp;
        _orders[_id] = _order;

        if (_order.status == OrderStatus.COMPLETED) {
            _tokenToAccrue[_order.token] += MathUpgradeable.mulDiv(
                _order.tokenAmount,
                MANTISSA,
                _totalShares
            );

            emit MarketAccrueChanged({
                token: _order.token,
                index: _tokenToAccrue[_order.token],
                sender: _msgSender()
            });
        }

        return _order;
    }

    function _accrueAccountDividends(address _account) internal {
        for (uint256 i = 0; i < _availableTokens.length; i++) {
            address token = _availableTokens[i];

            uint256 collected = _accrueTokenDividends(_account, token);

            if (collected > 0) {
                emit DividendsCollected({
                    amount: collected,
                    token: token,
                    recipient: _account,
                    sender: _msgSender()
                });
            }
        }
    }

    function _accrueTokenDividends(address _account, address _token) internal returns (uint256) {
        if (_tokenToAccrue[_token] == _accountToAccrue[_account][_token]) {
            return 0;
        }

        uint256 rewards = _availableDividends(_account, _token);

        IERC20Upgradeable(_token).safeTransfer(_account, rewards);

        _accountToAccrue[_account][_token] = _tokenToAccrue[_token];

        emit AccountAccrueChanged({
            account: _account,
            token: _token,
            index: _accountToAccrue[_account][_token],
            sender: _msgSender()
        });

        return rewards;
    }

    function _availableDividends(address _account, address _token) internal view returns (uint256) {
        return MathUpgradeable.mulDiv(
            _tokenToAccrue[_token] - _accountToAccrue[_account][_token],
            _shares[_account],
            MANTISSA
        );
    }
}
