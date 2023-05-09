// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
  uint256 public constant TOTAL_SUPPLY = 100000000 * 1e18; // 100M

  constructor(
    string memory _name,
    string memory _symbol
  ) ERC20(_name, _symbol) {
    super._mint(msg.sender, TOTAL_SUPPLY);
  }
}
