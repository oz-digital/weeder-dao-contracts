// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "./interfaces/ITaskManager.sol";
import "./interfaces/IWeederToken.sol";

contract WeederToken is ERC20Upgradeable, IWeederToken {
    address public taskManager;

    function initialize(
        address _initialTaskManager,
        uint256 _initialTotalSupply
    ) initializer public {
        __ERC20_init("Weeder DAO Token", "WDR");
        taskManager = _initialTaskManager;
        _mint(msg.sender, _initialTotalSupply);
    }

    function setTaskManager(address _newTaskManager) external override initializer {
        address previous = taskManager;

        taskManager = _newTaskManager;

        emit TaskManagerChanged({ current: _newTaskManager, previous: previous });
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (from != address(0)) {
            ITaskManager(taskManager).accrueMarketUsers(from, to);
        }
    }
}
