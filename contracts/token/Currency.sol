// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./ERC20Blacklisted.sol";
import "../lib/ApprovalCaller.sol";
import "../Error.sol";

contract Currency is ERC20Burnable, ERC20Blacklisted, ApprovalCaller {
  // bridge gate address
  address public bridge;

  event LogMinted(address indexed account, uint256 amount);
  event LogBurned(address indexed account, uint256 amount);
  event LogBridgeSet(address indexed bridge);

  modifier onlyBridge() {
    if (msg.sender != bridge) revert NoBridge();
    _;
  }

  constructor(address _bridge) ERC20Blacklisted("MetalCore Token", "FAB") {
    _setBridge(_bridge);
  }

  /**
   * @dev Mint tokens
   * Only `owner` or `bridge` can call
   */
  function mint(
    address _account,
    uint256 _amount
  ) external {
    if (msg.sender != owner() && msg.sender != bridge) revert Unauthorized();
    if (_amount == 0) revert InvalidAmount();
    super._mint(_account, _amount);

    emit LogMinted(_account, _amount);
  }

  /**
   * @dev Set bridge address
   * Only `owner` can call
   */
  function setBridge(address _bridge) external onlyOwner {
    _setBridge(_bridge);
  }

  /**
   * @dev Override {ERC20Burnable-burn}
   * `_amount` must not be zero
   */
  function burn(
    uint256 _amount
  ) public override {
    if (_amount == 0) revert InvalidAmount();

    super.burn(_amount);
    emit LogBurned(msg.sender, _amount);
  }

  /**
   * @dev Override {ERC20Burnable-burnFrom}
   * `_amount` must not be zero
   */
  function burnFrom(
    address _account,
    uint256 _amount
  ) public override {
    if (_amount == 0) revert InvalidAmount();

    super.burnFrom(_account, _amount);
    emit LogBurned(_account, _amount);
  }

  /**
   * @dev Set bridge address
   * Used only in constructor
   */
  function _setBridge(address _bridge) internal {
    if (_bridge == address(0)) revert InvalidAddress();
    bridge = _bridge;

    emit LogBridgeSet(_bridge);
  }

  function _beforeTokenTransfer(
    address _from,
    address _to,
    uint256 _amount
  ) internal virtual override(ERC20, ERC20Blacklisted) {
    ERC20Blacklisted._beforeTokenTransfer(_from, _to, _amount);
  }
}
