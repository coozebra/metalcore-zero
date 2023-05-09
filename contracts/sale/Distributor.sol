// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../Error.sol";

contract Distributor is Ownable, IERC721Receiver {
  using Address for address;

  // ERC721 address => accepted status
  mapping(IERC721 => bool) public acceptedERC721s;
  
  event LogERC721Received(
    address indexed operator,
    address indexed from,
    uint256 tokenId,
    bytes data
  );

  event LogERC721WithdrawnBatch(
    IERC721 indexed token,
    uint256[] tokenIds,
    address[] accounts
  );

  event LogERC721AcceptanceSet(
    IERC721 indexed token,
    bool accepted
  );
  
  /**
   * Override {IERC721Receiver-onERC721Received}
   */
  function onERC721Received(
    address _operator,
    address _from,
    uint256 _tokenId,
    bytes calldata _data
  ) external override returns (bytes4) {
    emit LogERC721Received(_operator, _from, _tokenId, _data);
    return this.onERC721Received.selector;
  }

  /**
   * @dev Set ERC721 acceptance
   * 
   * Requirements:
   * - Only contract owner can call
   * @param _token ERC721 contract; must be contract address
   * @param _accepted accepted status
   */
  function setERC721Acceptance(
    IERC721 _token,
    bool _accepted
  ) external onlyOwner {
    if (!address(_token).isContract()) revert NotContract();

    acceptedERC721s[_token] = _accepted;
    emit LogERC721AcceptanceSet(_token, _accepted);
  }

  /**
   * @dev Withdraw a batch of ERC721
   * 
   * Requirements:
   * - Only contract owner can call
   * @param _token ERC721 contract; must be accepted
   * @param _tokenIds array of token ids: all the tokens must belong to the Distributor
   * @param _accounts array of receiver wallets; must not have zero address
   */
  function withdrawBatch(
    IERC721 _token,
    uint256[] calldata _tokenIds,
    address[] calldata _accounts
  ) external onlyOwner {
    if (!acceptedERC721s[_token]) revert NotAcceptedERC721();
    if (_tokenIds.length != _accounts.length) revert ArrayLengthMismatch();

    for (uint256 i = 0; i < _accounts.length; i++) {
      _token.safeTransferFrom(address(this), _accounts[i], _tokenIds[i]);
    }

    emit LogERC721WithdrawnBatch(_token, _tokenIds, _accounts);
  }
}
