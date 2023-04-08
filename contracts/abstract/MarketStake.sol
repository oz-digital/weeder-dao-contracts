// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../interfaces/market/IMarketStake.sol";

import "./MarketState.sol";

abstract contract MarketStake is MarketState, IMarketStake {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    function stakeWeederToken(uint256 _amount)
        public
        override
        whenNotPaused
    {
        require(_amount > 0, Errors.ZERO_AMOUNT);

        address account = _msgSender();

        _accrueAccountDividends(account);

        IERC20Upgradeable(_weederToken).safeTransferFrom(account, address(this), _amount);

        _shares[account] += _amount;
        _totalShares += _amount;

        emit WeederTokenStaked({
            account: account,
            amount: _amount
        });
    }

    function redeemWeederToken(uint256 _amount)
        public
        override
        whenNotPaused
    {
        address account = _msgSender();

        require(_amount > 0, Errors.ZERO_AMOUNT);
        require(_shares[account] >= _amount, Errors.NOT_ENOUGH_SHARES);

        _accrueAccountDividends(account);

        IERC20Upgradeable(_weederToken).safeTransfer(account, _amount);

        _shares[account] -= _amount;
        _totalShares -= _amount;

        emit WeederTokenRedeemed({
            account: account,
            amount: _amount
        });
    }
}
