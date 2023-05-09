// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "../lib/Blacklist.sol";
import "../lib/PausableOwned.sol";
import "../lib/Minterable.sol";
import "../Error.sol";

contract Resource is ERC1155Burnable, ERC1155Pausable, ERC2981, Blacklist, PausableOwned, Minterable {
  using Address for address;

  // Last token ID starting from 1
  uint256 public tokenId;

  event LogCreated(
    uint256 from,
    uint256 to
  );

  event LogMintedBatch(
    address indexed account, 
    uint256[] tokenIds, 
    uint256[] amounts
  );

  event LogMinted(
    address indexed account,
    uint256 tokenId,
    uint256 amount
  );

  event LogBurned(
    address indexed account, 
    uint256 indexed tokenId,
    uint256 amount
  );

  event LogBurnedBatch(
    address indexed account, 
    uint256[] indexed tokenIds, 
    uint256[] indexed amounts
  );

  /**
   * @param _uri uri string
   */
  constructor(string memory _uri) ERC1155(_uri) {
   // The body is empty because of {ERC1155-_setURI}
  }

  /**
   * See {ERC2981-_setDefaultRoyalty}
   *
   * Requirements:
   * - Only `owner` can call
   */
  function setDefaultRoyalty(
    address _receiver, 
    uint96 _feeNumerator
  ) external onlyOwner {
    super._setDefaultRoyalty(_receiver, _feeNumerator);
  }

  /**
   * See {ERC2981-_deleteDefaultRoyalty}
   *
   * Requirements:
   * - Only `owner` can call
   */
  function deleteDefaultRoyalty() external onlyOwner {
    super._deleteDefaultRoyalty();
  }

  /**
   * See {ERC2981-_setTokenRoyalty}
   *
   * Requirements:
   * - Only `owner` can call
   */
  function setTokenRoyalty(
    uint256 _tokenId,
    address _receiver,
    uint96 _feeNumerator
  ) external onlyOwner {
    super._setTokenRoyalty(_tokenId, _receiver, _feeNumerator);
  }

  /**
   * See {ERC2981-_resetTokenRoyalty}
   *
   * Requirements:
   * - Only `owner` can call
   */
  function resetTokenRoyalty(uint256 _tokenId) external onlyOwner {
    super._resetTokenRoyalty(_tokenId);
  }

  /**
   * @dev Create new multiple resources
   * Increase `tokenId` by `_amount`
   * Every type of resources will have unique ids
   *
   * Requirements:
   * - Only minter can call (contract owner is minter)
   * @param _amount amount of newly created resources; must not be zero
   */
  function create(uint256 _amount) external onlyMinter {
    if (_amount == 0) revert InvalidAmount();

    uint256 _tokenId = tokenId;
    if (_tokenId > type(uint256).max - _amount) revert MathOverflow();

    unchecked {
      // we will not overflow because of above check
      emit LogCreated(_tokenId + 1, _tokenId + _amount);
      tokenId = _tokenId + _amount;
    }
  }

  /**
   * @dev Mint a new resource token
   *
   * Requirements:
   * - Only minter can call (contract owner is minter)
   * - Check minting allowance for non owner minter
   * @param _account receiver wallet
   * @param _tokenId minting token id
   * @param _amount minting amount
   */
  function mint(
    address _account,
    uint256 _tokenId,
    uint256 _amount
  ) external onlyMinter decreaseValidAllowance(msg.sender, _amount) {
    if (_tokenId == 0 || _tokenId > tokenId) revert InvalidNFTId();

    super._mint(_account, _tokenId, _amount, "");
    emit LogMinted(_account, _tokenId, _amount);
  }

  /**
   * @dev Mint a batch of resources
   *
   * Requirements:
   * - Only minter can call (contract owner is minter)
   * - Array length must match
   * - Check minting allowance for non owner minter
   * @param _account receiver wallet
   * @param _tokenIds array of minting token ids; 0 < element <= `tokenId`
   * @param _amounts array of minting amounts
   */
  function mintBatch(
    address _account,
    uint256[] calldata _tokenIds,
    uint256[] calldata _amounts
  ) external onlyMinter {
    if (_tokenIds.length != _amounts.length) revert ArrayLengthMismatch();

    uint256 total;

    unchecked {
      // we are not able to accept enough data to overflow `i`
      for (uint256 i = 0; i < _tokenIds.length; i++) {
        if (_tokenIds[i] == 0 || _tokenIds[i] > tokenId) revert InvalidNFTId();
        // we are not accepting `_amounts[i]` that `total` is big enough to overflow
        total += _amounts[i];
      }
    }

    if(msg.sender != owner()) super._decreaseAllowance(msg.sender, total);

    super._mintBatch(_account, _tokenIds, _amounts, "");
    emit LogMintedBatch(_account, _tokenIds, _amounts);
  }

  /**
   * Override {ERC1155Burnable-burn}
   */
  function burn(
    address _account,
    uint256 _id,
    uint256 _value
  ) public virtual override {
    super.burn(_account, _id, _value);
    emit LogBurned(_account, _id, _value);
  }

  /**
   * Override {ERC1155Burnable-burnBatch}
   */
  function burnBatch(
    address _account,
    uint256[] memory _ids,
    uint256[] memory _values
  ) public virtual override {
    super.burnBatch(_account, _ids, _values);
    emit LogBurnedBatch(_account, _ids, _values);
  }

  /**
   * Override {Minterable-transferOwnership}
   */
  function transferOwnership(address _newOwner) public virtual override(Ownable, Minterable) {
    Minterable.transferOwnership(_newOwner);
  }

  /**
   * Override {IERC165-supportsInterface}
   */
  function supportsInterface(bytes4 _interfaceId) public view virtual override(ERC1155, ERC2981, AccessControl)
    returns (bool)
  {
    return super.supportsInterface(_interfaceId);
  }

  /**
   * Override {ERC1155Pausable-_beforeTokenTransfer}.
   * Minting, burning and transferring will not happen when paused
   */
  function _beforeTokenTransfer(
    address _operator,
    address _from,
    address _to,
    uint256[] memory _ids,
    uint256[] memory _amounts,
    bytes memory _data
  ) internal virtual override(ERC1155, ERC1155Pausable) {
    if (blacklist[_from] || blacklist[_to]) revert BlacklistedTransfer();

    ERC1155Pausable._beforeTokenTransfer(_operator, _from, _to, _ids, _amounts, _data);
  }
}
