// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "./abstract/MarketAdmin.sol";
import "./abstract/MarketDividend.sol";
import "./abstract/MarketOrder.sol";
import "./abstract/MarketStake.sol";

contract Market is
    Initializable,
    MarketAdmin,
    MarketDividend,
    MarketOrder,
    MarketStake,
    UUPSUpgradeable
{
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        // Roles
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        // Pausable
        __Pausable_init();

        // UUPS
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address _newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}
}