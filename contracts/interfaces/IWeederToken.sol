// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWeederToken is IERC20 {
    event TaskManagerChanged(address current, address previous);

    function setTaskManager(address _newTaskManager) external;
}
