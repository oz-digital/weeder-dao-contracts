// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";

import "./interfaces/IMarket.sol";
import "./interfaces/IWeederToken.sol";

contract WeederToken is
    Initializable,
    ERC20Upgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    UUPSUpgradeable,
    IWeederToken
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    address private _market;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function decimals()
        public
        override
        pure
        returns (uint8)
    {
        return 8;
    }

    function market()
        external
        view
        override
        returns (address)
    {
        return _market;
    }

    function initialize() public initializer {
        // Roles
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        // ERC20
        __ERC20_init("Weeder Digital Token", "WDT");
        __ERC20Permit_init("Weeder Digital Token");
        __Pausable_init();
        __ERC20Votes_init();

        // Mint 20kk tokens to owner
        _mint(msg.sender, 20_000_000 * 10 ** decimals());

        // UUPS
        __UUPSUpgradeable_init();
    }

    function setMarket(address _newMarket)
        external
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        emit MarketChanged({
            current: _newMarket,
            previous: _market,
            sender: _msgSender()
        });

        _market = _newMarket;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _amount
    )
        internal
        override
        whenNotPaused
    {
        super._beforeTokenTransfer(_from, _to, _amount);

        // Trigger accrue of all token dividends for both accounts
        _accrueMarketDividends(_from, _to, _amount);
    }

    function _afterTokenTransfer(
        address _from,
        address _to,
        uint256 _amount
    )
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._afterTokenTransfer(_from, _to, _amount);
    }

    function _mint(address _to, uint256 _amount)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._mint(_to, _amount);
    }

    function _burn(address _account, uint256 _amount)
        internal
        override(ERC20Upgradeable, ERC20VotesUpgradeable)
    {
        super._burn(_account, _amount);
    }

    function _authorizeUpgrade(address _newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    function _accrueMarketDividends(
        address _first,
        address _second,
        uint256 _amount
    ) private {
        // _first and _second are not zero addresses
        // Trigger market only if an _amount is not zero and the market is set
        if (_amount != 0 && _market != address(0)) {
            IMarket(_market).accrueUserDividends(_first);
            IMarket(_market).accrueUserDividends(_second);
        }
    }
}
