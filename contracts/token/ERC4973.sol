// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/IERC4973.sol";
import "../Error.sol";

abstract contract ERC4973 is ERC165, IERC4973 {
  using Strings for uint256;

  string private _name;
  string private _symbol;
  string private _baseURI;

  mapping(uint256 => address) private _owners;
  mapping(address => uint256) private _balances;

  constructor(
    string memory name_,
    string memory symbol_,
    string memory baseURI_
  ) {
    _name = name_;
    _symbol = symbol_;
    _baseURI = baseURI_;
  }

  function name() public view returns (string memory) {
    return _name;
  }

  function symbol() public view returns (string memory) {
    return _symbol;
  }

  function baseURI() public view returns (string memory) {
    return _baseURI;
  }

  function tokenURI(uint256 tokenId) public view returns (string memory) {
    if (!_exists(tokenId)) revert InvalidNFTId();

    return
      bytes(_baseURI).length != 0
        ? string(abi.encodePacked(_baseURI, tokenId.toString()))
        : "";
  }

  /// @inheritdoc IERC165
  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override
    returns (bool)
  {
    return
      interfaceId == type(IERC4973).interfaceId ||
      super.supportsInterface(interfaceId);
  }

  /// @inheritdoc IERC4973
  function balanceOf(address owner) public view override returns (uint256) {
    if (owner == address(0)) revert InvalidAddress();

    return _balances[owner];
  }

  /// @inheritdoc IERC4973
  function ownerOf(uint256 tokenId) public view override returns (address) {
    address owner = _owners[tokenId];

    if (owner == address(0)) revert InvalidNFTId();

    return owner;
  }

  /**
   * @dev Mint a token to an addresses. This address will hold the
   * token till is burned by the address owner.
   * The function emits the `Attest` event specified in the standard.
   * See {IERC4973-Attest}
   */
  function _mint(address to, uint256 tokenId) internal virtual {
    if (_exists(tokenId)) revert NFTAlreadyMinted();

    if (to == address(0)) revert InvalidAddress();

    _beforeTokenTransfer(address(0), to, tokenId);

    unchecked {
      // we don't overflow in a lifetime
      _balances[to] += 1;
    }

    _owners[tokenId] = to;

    emit Attest(to, tokenId);
  }

  function _setBaseURI(string memory baseURI_) internal virtual {
    _baseURI = baseURI_;
  }

  /**
   * @dev Burns a token
   * The function emits the `Revoke` event specified in the standard.
   * See {IERC4973-Revoke}
   */
  function _burn(uint256 tokenId) internal virtual {
    address owner = ownerOf(tokenId);

    if (msg.sender != owner) revert NotTokenOwner();

    _beforeTokenTransfer(owner, address(0), tokenId);

    unchecked {
      // balance[owner] cannot be 0 at this point, ownerOf(tokenId) reverts
      // for non-existing token IDs
      _balances[owner] -= 1;
    }

    delete _owners[tokenId];

    emit Revoke(owner, tokenId);
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual {}

  function _exists(uint256 tokenId) internal view returns (bool) {
    return _owners[tokenId] != address(0);
  }
}
