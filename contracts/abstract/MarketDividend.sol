// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../interfaces/market/IMarketDividend.sol";

import "./MarketState.sol";

abstract contract MarketDividend is MarketState, IMarketDividend {
    function availableTokenDividends(
        address _account,
        address _token
    )
        public
        view
        override
        returns (uint256)
    {
        return _availableDividends(_account, _token);
    }

    function accrueAccountDividends(address _account)
        public
        override
        whenNotPaused
    {
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

    function accrueTokenDividends(
        address _account,
        address _token
    )
        public
        override
        whenNotPaused
    {
        uint256 collected = _accrueTokenDividends(_account, _token);

        if (collected > 0) {
            emit DividendsCollected({
                amount: collected,
                token: _token,
                recipient: _account,
                sender: _msgSender()
            });
        }
    }
}
