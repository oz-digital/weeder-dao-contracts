// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

interface ITaskManager {
    event WeederTokenChanged(address current, address previous);

    event MarketChanged(address current, address previous);

    function setWeederToken(address _newWeederToken) external;

    function setMarket(address _newMarket) external;

    function accrueMarketUsers(
        address _weederTokenSender,
        address _weederTokenRecipient
    ) external;
}
