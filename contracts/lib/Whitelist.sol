// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Whitelist is Ownable {
  // wallet address => whitelisted status
  mapping(address => bool) public whitelist;

  event LogWhitelistAdded(address indexed account);
  event LogWhitelistRemoved(address indexed account);

  /**
    * @dev Add wallet to whitelist
    * `_account` must not be zero address
    */
  function addWhitelist(address[] calldata _accounts) external onlyOwner {
    for (uint256 i = 0; i < _accounts.length; i++) {
      whitelist[_accounts[i]] = true;

      emit LogWhitelistAdded(_accounts[i]);
    }
  }

  /**
    * @dev Remove wallet from whitelist
    */
  function removeWhitelist(address[] calldata _accounts) external onlyOwner {
    for (uint256 i = 0; i < _accounts.length; i++) {
      delete whitelist[_accounts[i]];

      emit LogWhitelistRemoved(_accounts[i]);
    }
  }
}
