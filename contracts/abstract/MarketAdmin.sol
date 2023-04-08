// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../interfaces/market/IMarketAdmin.sol";

import "./MarketState.sol";

abstract contract MarketAdmin is MarketState, IMarketAdmin {
    function setVault(address _newVault)
        public
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        emit VaultChanged({
            current: _newVault,
            previous: _vault,
            sender: _msgSender()
        });

        _vault = _newVault;
    }

    function setWeederToken(address _newWeederToken)
        public
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        emit WeederTokenChanged({
            current: _newWeederToken,
            previous: _weederToken,
            sender: _msgSender()
        });

        _weederToken = _newWeederToken;
    }

    function addTokenToWhitelist(address _token)
        public
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        emit TokenAddedToWhitelist({
            token: _token,
            sender: _msgSender()
        });

        _tokenToWhitelistStatus[_token] = true;
        _availableTokens.push(_token);
    }

    function removeTokenFromWhitelist(address _token)
        public
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        emit TokenRemovedFromWhitelist({
            token: _token,
            sender: _msgSender()
        });

        _tokenToWhitelistStatus[_token] = false;
    }
}
