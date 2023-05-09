// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../lib/Blacklist.sol";

contract ERC20Blacklisted is ERC20, Blacklist {
  constructor(
    string memory _name,
    string memory _symbol
  ) ERC20(_name, _symbol) { }

  /**
   * @dev Override {ERC20-_beforeTokenTransfer}
   * Disable token transfer for blacklisted wallets
   */
  function _beforeTokenTransfer(
    address _from,
    address _to,
    uint256
  ) internal virtual override {
    require(!blacklist[_from] && !blacklist[_to], "ERC20Blacklisted: TOKEN_TRANSFER_DISABLED");
  }
}
