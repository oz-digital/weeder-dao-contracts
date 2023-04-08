// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

library Errors {
    string constant INVALID_ORDER_ID = "Market: order's ID is invalid";
    string constant TOKEN_IS_NOT_ALLOWED = "Market: token can not be accepted";
    string constant ZERO_AMOUNT = "Market: amount is zero";
    string constant VAULT_IS_NOT_SET = "Market: vault address was not set";
    string constant NO_SHAREHOLDERS = "Market: no shareholders in the market";
    string constant NOT_ENOUGH_SHARES = "Market: account does not have enough shares";

    function getOrderStatusError(bytes32 _status) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                "Market: order should has ",
                StringsUpgradeable.toHexString(uint256(_status), 32),
                " status"
            )
        );
    }
}
