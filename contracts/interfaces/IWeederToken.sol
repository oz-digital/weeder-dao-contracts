// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface IWeederToken is IERC20Upgradeable {
    event TaskManagerChanged(address current, address previous);

    function setTaskManager(address _newTaskManager) external;
}
