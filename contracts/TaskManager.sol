// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IMarket.sol";
import "./interfaces/ITaskManager.sol";

contract TaskManager is Ownable, ITaskManager {
    address public weederToken;
    address public market;

    function setWeederToken(address _newWeederToken) external override onlyOwner {
        address previous = weederToken;

        weederToken = _newWeederToken;

        emit WeederTokenChanged({ current: _newWeederToken, previous: previous });
    }

    function setMarket(address _newMarket) external override onlyOwner {
        address previous = market;

        market = _newMarket;

        emit MarketChanged({ current: _newMarket, previous: previous });
    }

    function accrueMarketUsers(
        address _weederTokenSender,
        address _weederTokenRecipient
    ) external override {
        IMarket(market).accrueUserDividends(_weederTokenSender);
        IMarket(market).accrueUserDividends(_weederTokenRecipient);
    }
}
