//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./lib/PausableOwned.sol";
import "./lib/Signer.sol";
import "./token/Asset.sol";
import "./token/Resource.sol";
import "./token/Currency.sol";
import "./Error.sol";

contract GamePortal is IERC721Receiver, IERC1155Receiver, PausableOwned, Signer {
  using ECDSA for bytes32;
  using Address for address;
  using SafeERC20 for IERC20;

  struct Accepted {
    bool erc20;
    bool erc721;
    bool erc1155;
  }

  // token address => accepted structure
  mapping(address => Accepted) public accepted;
  
  event LogERC721Received(
    address indexed operator,
    address indexed from,
    uint256 tokenId,
    bytes data
  );

  event LogERC1155Received(
    address indexed operator,
    address indexed from,
    uint256 id,
    uint256 value,
    bytes data
  );

  event LogERC1155BatchReceived(
    address indexed operator,
    address indexed from,
    uint256[] ids,
    uint256[] values,
    bytes data
  );

  event LogERC20Deposited(
    IERC20 indexed token,
    uint256 amount,
    address indexed account
  );

  event LogERC721Deposited(
    IERC721 indexed token,
    uint256 tokenId,
    address indexed account
  );

  event LogERC1155Deposited(
    IERC1155 indexed token,
    uint256 tokenId,
    uint256 amount,
    address indexed account
  );

  event LogERC20Withdrawn(
    IERC20 indexed token,
    uint256 amount,
    address indexed account
  );

  event LogERC721Withdrawn(
    IERC721 indexed token,
    uint256 tokenId,
    address indexed account
  );

  event LogERC1155Withdrawn(
    IERC1155 indexed token,
    uint256 tokenId,
    uint256 amount,
    address indexed account
  );

  event LogTokenAcceptanceSet(
    address indexed token,
    Accepted accepted
  );

  event LogAssetMerged(
    Asset indexed asset,
    uint256 tokenId0,
    uint256 tokenId1,
    uint256 newTokenId
  );

  event LogAssetCrafted(
    Asset indexed asset, 
    uint256 newTokenId
  );

  /**
   * @param _signer signer wallet
   */
  constructor(address _signer) Signer(_signer) { 
    // The body is empty because of {Signer-_setSigner}
  }  
  
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
   * Override {IERC1155Receiver-onERC1155Received}
   */
  function onERC1155Received(
    address _operator,
    address _from,
    uint256 _id,
    uint256 _value,
    bytes calldata _data
  ) external override returns (bytes4) {
    emit LogERC1155Received(_operator, _from, _id, _value, _data);
    return this.onERC1155Received.selector;
  }

  /**
   * Override {IERC1155Receiver-onERC1155BatchReceived}
   */
  function onERC1155BatchReceived(
    address _operator,
    address _from,
    uint256[] calldata _ids,
    uint256[] calldata _values,
    bytes calldata _data
  ) external override returns (bytes4) {
    emit LogERC1155BatchReceived(_operator, _from, _ids, _values, _data);
    return this.onERC1155BatchReceived.selector;
  }

  /**
   * @dev Set token acceptance
   *
   * Requirements:
   * - Only contract owner can call
   * @param _token token address; must be contract address
   * @param _accepted acceptance
   */
  function setTokenAcceptance(
    address _token,
    Accepted calldata _accepted
  ) external onlyOwner {
    if (!address(_token).isContract()) revert NotContract();

    accepted[_token] = _accepted;
    emit LogTokenAcceptanceSet(_token, _accepted);
  }
  
  /**
   * @dev Deposit ERC20 to the GP
   *
   * Requirements:
   * - Caller must approve the GP contract for `_token`
   * - Not paused
   * @param _token ERC20; must be accepted ERC20
   * @param _amount deposit amount; must not be zero
   * @param _sig signature signed off signer wallet; must be valid
   */
  function depositERC20(
    IERC20 _token,
    uint256 _amount,
    bytes calldata _sig
  ) external whenNotPaused {
    if (!accepted[address(_token)].erc20) revert NotAcceptedERC20();
    if (_amount == 0) revert InvalidAmount();

    bytes32 msgHash = keccak256(abi.encodePacked(
      "depositERC20",
      super._chainId(), 
      _token, 
      _amount, 
      msg.sender, 
      ++nonces[msg.sender]
    ));

    if (!super._verify(msgHash, _sig)) revert InvalidSignature();

    emit LogERC20Deposited(_token, _amount, msg.sender);
    _token.safeTransferFrom(msg.sender, address(this), _amount);
  }

  /**
   * @dev Deposit ERC721 to the GP
   *
   * Requirements:
   * - Not paused
   * @param _token ERC721; must be accepted ERC721
   * @param _tokenId deposit token id
   * @param _sig signature signed off signer wallet; must be valid
   */
  function depositERC721(
    IERC721 _token,
    uint256 _tokenId,
    bytes calldata _sig
  ) external whenNotPaused {
    if (!accepted[address(_token)].erc721) revert NotAcceptedERC721();

    bytes32 msgHash = keccak256(abi.encodePacked(
      "depositERC721",
      super._chainId(), 
      _token, 
      _tokenId, 
      msg.sender,
      ++nonces[msg.sender]
    ));

    if (!super._verify(msgHash, _sig)) revert InvalidSignature();

    emit LogERC721Deposited(_token, _tokenId, msg.sender);
    _token.safeTransferFrom(msg.sender, address(this), _tokenId);
  }

  /**
   * @dev Deposit ERC1155 to the GP
   *
   * Requirements:
   * - Not paused
   * @param _token ERC1155; must be accepted ERC1155
   * @param _tokenId deposit token id
   * @param _amount deposit amount; must not be zero
   * @param _sig signature signed off signer wallet; must be valid
   */
  function depositERC1155(
    IERC1155 _token,
    uint256 _tokenId,
    uint256 _amount,
    bytes calldata _sig
  ) external whenNotPaused {
    if (!accepted[address(_token)].erc1155) revert NotAcceptedERC1155();
    if (_amount == 0) revert InvalidAmount();

    bytes32 msgHash = keccak256(abi.encodePacked(
      "depositERC1155",
      super._chainId(), 
      _token, 
      _tokenId, 
      _amount, 
      msg.sender,
      ++nonces[msg.sender]
    ));

    if (!super._verify(msgHash, _sig)) revert InvalidSignature();

    emit LogERC1155Deposited(_token, _tokenId, _amount, msg.sender);
    _token.safeTransferFrom(msg.sender, address(this), _tokenId, _amount, "");
  }

  /**
   * @dev Withdraw ERC20
   * 
   * Requirements:
   * - Not paused
   * @param _token ERC20; must be accepted ERC20
   * @param _amount withdraw amount; must not be zero
   * @param _sig signature signed off signer wallet; must be valid
   */
  function withdrawERC20(
    IERC20 _token,
    uint256 _amount,
    bytes calldata _sig
  ) external whenNotPaused {
    if (!accepted[address(_token)].erc20) revert NotAcceptedERC20();
    if (_amount == 0) revert InvalidAmount();

    bytes32 msgHash = keccak256(abi.encodePacked(
      "withdrawERC20",
      super._chainId(), 
      _token, 
      _amount, 
      msg.sender,
      ++nonces[msg.sender]
    ));

    if (!super._verify(msgHash, _sig)) revert InvalidSignature();

    emit LogERC20Withdrawn(_token, _amount, msg.sender);
    _token.safeTransfer(msg.sender, _amount);
  }

  /**
   * @dev Withdraw ERC721
   * 
   * Requirements:
   * - Not paused
   * @param _token ERC721; must be accepted ERC721
   * @param _tokenId withdraw token id
   * @param _sig signature signed off signer wallet; must be valid
   */
  function withdrawERC721(
    IERC721 _token,
    uint256 _tokenId,
    bytes calldata _sig
  ) external whenNotPaused {
    if (!accepted[address(_token)].erc721) revert NotAcceptedERC721();

    bytes32 msgHash = keccak256(abi.encodePacked(
      "withdrawERC721",
      super._chainId(), 
      _token, 
      _tokenId, 
      msg.sender,
      ++nonces[msg.sender]
    ));

    if (!super._verify(msgHash, _sig)) revert InvalidSignature();

    _withdrawERC721(_token, _tokenId, msg.sender);
  }

  /**
   * @dev Withdraw a batch of ERC721
   *
   * Requirements:
   * - Not paused
   * @param _token ERC721; must be accepted ERC721
   * @param _tokenIds array of withdraw token ids
   * @param _sig signature signed off signer wallet; must be valid
   */
  function withdrawERC721Batch(
    IERC721 _token,
    uint256[] calldata _tokenIds,
    bytes calldata _sig
  ) external whenNotPaused {
    if (!accepted[address(_token)].erc721) revert NotAcceptedERC721();
    
    bytes32 msgHash = keccak256(abi.encodePacked(
      "withdrawERC721Batch",
      super._chainId(), 
      _token, 
      _tokenIds, 
      msg.sender,
      ++nonces[msg.sender]
    ));

    if (!super._verify(msgHash, _sig)) revert InvalidSignature();

    unchecked {
      // we are not able to accept enough data to overflow `i`
      for (uint256 i = 0; i < _tokenIds.length; i++) {
        _withdrawERC721(_token, _tokenIds[i], msg.sender);
      }
    }
  }

  /**
   * @dev Withdraw ERC1155
   *
   * Requirements:
   * - Not paused
   * @param _token ERC1155; must be accepted ERC1155
   * @param _tokenId withdraw token id
   * @param _amount withdraw amount; must not be zero
   * @param _sig signature signed off signer wallet; must be valid
   */
  function withdrawERC1155(
    IERC1155 _token,
    uint256 _tokenId,
    uint256 _amount,
    bytes calldata _sig
  ) external whenNotPaused {
    if (!accepted[address(_token)].erc1155) revert NotAcceptedERC1155();

    bytes32 msgHash = keccak256(abi.encodePacked(
      "withdrawERC1155",
      super._chainId(), 
      _token, 
      _tokenId, 
      _amount, 
      msg.sender,
      ++nonces[msg.sender]
    ));

    if (!super._verify(msgHash, _sig)) revert InvalidSignature();

    _withdrawERC1155(_token, _tokenId, _amount, msg.sender);
  }

  /**
   * @dev Withdraw a batch of ERC1155
   * See {_withdrawERC1155}
   *
   * Requirements:
   * - Not paused
   * @param _token ERC1155; must be accepted ERC1155
   * @param _tokenIds array of withdraw token ids
   * @param _amounts array of withdraw amounts; must not have zero
   * @param _sig signature signed off signer wallet; must be valid
   */
  function withdrawERC1155Batch(
    IERC1155 _token,
    uint256[] calldata _tokenIds,
    uint256[] calldata _amounts,
    bytes calldata _sig
  ) external whenNotPaused {
    if (!accepted[address(_token)].erc1155) revert NotAcceptedERC1155();

    bytes32 msgHash = keccak256(abi.encodePacked(
      "withdrawERC1155Batch",
      super._chainId(), 
      _token, 
      _tokenIds, 
      _amounts, 
      msg.sender,
      ++nonces[msg.sender]
    ));
    
    if (!super._verify(msgHash, _sig)) revert InvalidSignature();

    unchecked {
      // we are not able to accept enough data to overflow `i`
      for (uint256 i = 0; i < _tokenIds.length; i++) {
        _withdrawERC1155(_token, _tokenIds[i], _amounts[i], msg.sender);
      }
    }
  }

  /**
   * @dev Call {Asset:mint(address)}
   *
   * Requirements:
   * - Only contract owner can call
   * - Not paused
   * @param _asset asset contract; must be accepted ERC721
   * @param _account mintee address; must not be zero address
   */
  function mintAsset(
    Asset _asset,
    address _account
  ) external onlyOwner whenNotPaused {
    if (!accepted[address(_asset)].erc721) revert NotAcceptedERC721();

    _asset.mint(_account);
  }

  /**
   * @dev Call {Asset:mintBatch(address,uint256)}
   *
   * Requirements:
   * - Only contract owner can call
   * - Not paused
   * @param _asset asset contract; must be accepted ERC721
   * @param _account mintee address; must not be zero address
   * @param _amount amount of newly creating tokens; must not be zero
   */
  function mintBatchAsset(
    Asset _asset,
    address _account,
    uint256 _amount
  ) external onlyOwner whenNotPaused {
    if (!accepted[address(_asset)].erc721) revert NotAcceptedERC721();
    if (_amount == 0) revert InvalidAmount();

    _asset.mintBatch(_account, _amount);
  }

  /**
   * @dev Merge gaming assets
   * Burn `_tokenId0` and `_tokenId1` and mint a new asset
   *
   * Requirements:
   * - Only contract owner can call
   * - Burning tokens must be locked
   * - Not paused
   * @param _asset asset contract; must be accepted ERC721
   * @param _tokenId0 merging token id#0
   * @param _tokenId1 merging token id#1
   */
  function mergeAsset(
    Asset _asset,
    uint256 _tokenId0,
    uint256 _tokenId1
  ) external onlyOwner whenNotPaused {
    if (!accepted[address(_asset)].erc721) revert NotAcceptedERC721();
    if (_asset.ownerOf(_tokenId0) != address(this)) revert NFTNotLocked();
    if (_asset.ownerOf(_tokenId1) != address(this)) revert NFTNotLocked();

    _asset.burn(_tokenId0);
    _asset.burn(_tokenId1);
    uint256 newTokenId = _asset.mint(address(this));
    emit LogAssetMerged(_asset, _tokenId0, _tokenId1, newTokenId);
  }
  
  /**
   * @dev Craft new gaming asset
   * Burn `_tokenIds` and `_amounts` resources
   * Burn `_currencyAmount` Currency token
   * Mint a new NFT
   *
   * Requirements:
   * - Burning resources and currency must be locked
   * - Only contract owner can call
   * - Not paused
   * @param _asset asset contract; must be accepted ERC721
   * @param _resource resource contract; must be accepted ERC1155
   * @param _currency in-game token contract; must be accepted ERC20
   * @param _tokenIds array of burning resource ids
   * @param _amounts array of burning resource amounts
   * @param _currencyAmount burning currency amount
   */
  function craftAsset(
    Asset _asset,
    Resource _resource,
    Currency _currency,
    uint256[] calldata _tokenIds,
    uint256[] calldata _amounts,
    uint256 _currencyAmount
  ) external onlyOwner whenNotPaused {
    if (!accepted[address(_asset)].erc721) revert NotAcceptedERC721();
    if (!accepted[address(_resource)].erc1155) revert NotAcceptedERC1155();
    if (!accepted[address(_currency)].erc20) revert NotAcceptedERC20();

    _resource.burnBatch(address(this), _tokenIds, _amounts);
    _currency.burn(_currencyAmount);
    uint256 newTokenId = _asset.mint(address(this));
    emit LogAssetCrafted(_asset, newTokenId);
  }

  /**
   * @dev Call {Asset:burn}
   *
   * Requirements:
   * - Only contract owner can call
   * - Not paused
   * @param _asset asset contract; must be accepted ERC721
   * @param _tokenId burning token id
   */
  function burnAsset(
    Asset _asset,
    uint256 _tokenId
  ) external onlyOwner whenNotPaused {
    if (!accepted[address(_asset)].erc721) revert NotAcceptedERC721();
    
    _asset.burn(_tokenId);
  }

  /**
   * @dev Call {Asset:burn} multiple times
   *
   * Requirements:
   * - Only contract owner can call
   * - Not paused
   * @param _asset asset contract; must be accepted ERC721
   * @param _tokenIds array of burning token ids; must not be empty array
   */
  function burnBatchAsset(
    Asset _asset,
    uint256[] calldata _tokenIds
  ) external onlyOwner whenNotPaused {
    if (!accepted[address(_asset)].erc721) revert NotAcceptedERC721();
    if (_tokenIds.length == 0) revert EmptyArray();

    unchecked {
      // we are not accepting enough data to overflow `i`
      for (uint256 i = 0; i < _tokenIds.length; i++) {
        _asset.burn(_tokenIds[i]);
      }
    }
  }

  /**
   * @dev Call {Resource-create}
   *
   * Requirements:
   * - Only contract owner can call
   * - Not paused
   * @param _resource resource nft contract; must be accepted ERC1155
   * @param _amount amount of newly created resources; must not be zero
   */
  function createResource(
    Resource _resource,
    uint256 _amount
  ) external onlyOwner whenNotPaused {
    if (!accepted[address(_resource)].erc1155) revert NotAcceptedERC1155();

    _resource.create(_amount);
  }

  /**
   * @dev Call {Resource-mintBatch}
   *
   * Requirements:
   * - Only contract owner can call
   * - Not paused
   * @param _resource resource nft contract; must be accepted ERC1155
   * @param _account receiver wallet
   * @param _tokenIds array of minting token ids; 0 < element <= `tokenId` of resource nft
   * @param _amounts array of minting amounts
   */
  function mintBatchResource(
    Resource _resource,
    address _account,
    uint256[] calldata _tokenIds,
    uint256[] calldata _amounts
  ) external onlyOwner whenNotPaused {
    if (!accepted[address(_resource)].erc1155) revert NotAcceptedERC1155();

    _resource.mintBatch(_account, _tokenIds, _amounts);
  }

  /**
   * Override {IERC165-supportsInterface}
   */
  function supportsInterface(bytes4 _interfaceId) public view virtual override returns (bool) {
    return _interfaceId == type(IERC721Receiver).interfaceId || _interfaceId == type(IERC1155Receiver).interfaceId;
  }

  /**
   * @dev Withdraw ERC721
   * @param _token ERC721
   * @param _tokenId withdraw token id
   * @param _account receiver wallet
   */
  function _withdrawERC721(
    IERC721 _token,
    uint256 _tokenId,
    address _account
  ) private {
    emit LogERC721Withdrawn(_token, _tokenId, _account);
    _token.safeTransferFrom(address(this), _account,  _tokenId);
  }

  /**
   * @dev Withdraw ERC1155
   * @param _token ERC1155
   * @param _tokenId withdraw token id
   * @param _amount withdraw amount
   * @param _account receiver wallet
   */
  function _withdrawERC1155(
    IERC1155 _token,
    uint256 _tokenId,
    uint256 _amount,
    address _account
  ) private {
    if (_amount == 0) revert InvalidAmount();

    emit LogERC1155Withdrawn(_token, _tokenId, _amount, _account);
    _token.safeTransferFrom(address(this), msg.sender, _tokenId, _amount, "");
  }
}
