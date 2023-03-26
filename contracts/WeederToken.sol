// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./interfaces/ITaskManager.sol";
import "./interfaces/IWeederToken.sol";

contract WeederToken is ERC20, Ownable, IWeederToken {
    address public taskManager;

    constructor(address _initialTaskManager) ERC20("Weeder DAO Token", "WDR") {
        taskManager = _initialTaskManager;
    }

    function setTaskManager(address _newTaskManager) external override onlyOwner {
        address previous = taskManager;

        taskManager = _newTaskManager;

        emit TaskManagerChanged({ current: _newTaskManager, previous: previous });
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        ITaskManager(taskManager).accrueMarketUsers(from, to);
    }
}
