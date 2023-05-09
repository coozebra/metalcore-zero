// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./ERC20Blacklisted.sol";
import "../lib/ApprovalCaller.sol";
import "../Error.sol";

contract MGT is ERC20Votes, ERC20Burnable, ERC20Blacklisted, ApprovalCaller {
  uint224 public constant CAP = 250000000 * 1e18;
  // bridge gate address
  address public bridge;

  event LogMinted(address indexed account, uint256 amount);
  event LogBridgeSet(address indexed bridge);

  modifier onlyBridge() {
    require(msg.sender == bridge, "MGT: CALLER_NO_BRIDGE");
    _;
  }

  constructor(address _bridge) ERC20Permit("MetalCore Token") ERC20Blacklisted("MetalCore Token", "MGT") {
    if (_bridge == address(0)) revert InvalidAddress();
    bridge = _bridge;
  }

  /**
   * @dev Mint tokens
   * Only `owner` or `bridge` can call
   */
  function mint(
    address _account,
    uint256 _amount
  ) external {
    require(msg.sender == owner() || msg.sender == bridge, "MGT: CALLER_NO_OWNER_BRIDGE");
    if (_amount == 0) revert InvalidAmount();
    super._mint(_account, _amount);

    emit LogMinted(_account, _amount);
  }

  /**
   * @dev Set bridge address
   * Only `owner` can call
   */
  function setBridge(address _bridge) external onlyOwner {
    if (_bridge == address(0)) revert InvalidAddress();
    bridge = _bridge;

    emit LogBridgeSet(_bridge);
  }

  /**
   * @dev Override {ERC20Blacklisted-_beforeTokenTransfer}
   */
  function _beforeTokenTransfer(
    address _from,
    address _to,
    uint256 _tokenId
  ) internal virtual override(ERC20, ERC20Blacklisted) {
    ERC20Blacklisted._beforeTokenTransfer(_from, _to, _tokenId);
  }

  /**
   * @dev Override {ERC20Votes-_afterTokenTransfer}
   */
  function _afterTokenTransfer(
    address _from,
    address _to,
    uint256 _amount
  ) internal virtual override(ERC20, ERC20Votes) {
    ERC20Votes._afterTokenTransfer(_from, _to, _amount);
  }

  /**
   * @dev Override {ERC20Votes-_mint}
   */
  function _mint(
    address _account,
    uint256 _amount
  ) internal override(ERC20, ERC20Votes) {
    ERC20Votes._mint(_account, _amount);
  }

  /**
   * @dev Override {ERC20Votes-_burn}
   */
  function _burn(
    address _account,
    uint256 _amount
  ) internal override(ERC20, ERC20Votes) {
    ERC20Votes._burn(_account, _amount);
  }

  /**
   * @dev Override {ERC20Votes-_maxSupply}
   */
  function _maxSupply() internal view virtual override returns (uint224) {
    return CAP;
  }
}
