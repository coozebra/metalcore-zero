// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./ERC4973Enumerable.sol";
import "../lib/PausableOwned.sol";
import "../lib/Minterable.sol";
import "../lib/Signer.sol";
import "../Error.sol";

contract SBT is ERC4973Enumerable, PausableOwned, Minterable, Signer {
  uint256 public tokenId;

  mapping(bytes32 => uint256) public claimed;

  event LogClaimed(
    address indexed account,
    uint256 amount
  );

  constructor(
    address _signer,
    string memory _name,
    string memory _symbol,
    string memory _baseURI
  ) Signer(_signer) ERC4973(_name, _symbol, _baseURI) {
    // we call the ERC4973 constructor only
  }

  /**
   * @dev Mints a token
   * The _mint function from ERC4973 emits the `Attest` event
   * of the specification with the `tokenId` and the `owner`
   *
   * Requirements:
   * - Only minter can call (contract owner is minter)
   * @param _to receiver wallet
   */
  function mint(address _to)
    external
    onlyMinter
    decreaseValidAllowance(msg.sender, 1)
  {
    unchecked {
      // we don't overflow in a lifetime
      tokenId += 1;
    }

    _mint(_to, tokenId);
  }

  /**
   * @dev Mints a batch of tokens, one per account provided
   * The _mint function from ERC4973 emits the `Attest`
   * of the specification with the `tokenId` and the `owner`
   * for each of the tokens emited. A non valid address will
   * make this function to revert.
   *
   * Requirements:
   * - Only minter can call (contract owner is minter)
   * @param _accounts receiver wallet
   */
  function mintBatch(address[] calldata _accounts)
    external
    onlyMinter
    decreaseValidAllowance(msg.sender, _accounts.length)
  {
    uint256 newTokenId = tokenId;

    unchecked {
      // The 3 add operations on `i`, `newTokenId` and `tokenId` are safe to
      // uncheck since the `_accounts.length` will be restricted to a low value
      // (<100K), this is set by the contract owner

      for (uint256 i = 0; i < _accounts.length; i++) {
        newTokenId += 1;
        _mint(_accounts[i], newTokenId);
      }

      tokenId += _accounts.length;
    }
  }
  
  /**
   * @dev Claim a batch of tokens
   * @param _amount claim amount; must not be zero
   * @param _maximum; the max that can be claimed per the off-chain signature
   * @param _source; the source in which the sbt was awarded
   * @param _signature claim signature; must be valid
   */
  function claim(
    uint256 _amount,
    uint256 _maximum,
    uint256 _source,
    bytes calldata _signature
  ) external {
    if (_amount == 0) revert InvalidAmount();
    if (_amount > _maximum) revert InvalidAmount();

    bytes32 msgHash = keccak256(abi.encodePacked(
      _chainId(), 
      _maximum,
      _source,
      msg.sender,
      ++nonces[msg.sender]
    ));

    if (!_verify(msgHash, _signature)) revert InvalidSignature();

    bytes32 claimedKey = keccak256(abi.encodePacked(
      msg.sender,
      _source
    ));

    uint256 alreadyClaimed = claimed[claimedKey];

    if (alreadyClaimed + _amount > _maximum) revert InvalidAmount();

    uint256 newTokenId = tokenId;

    unchecked {
      // The 3 add operations on `i`, `newTokenId` and `tokenId` are safe to
      // uncheck because the `_amount` will be restricted to a low value

      for (uint256 i = 0; i < _amount; i++) {
        newTokenId += 1;
        _mint(msg.sender, newTokenId);
      }
    }

    claimed[claimedKey] = alreadyClaimed + _amount;
    tokenId = newTokenId;
    emit LogClaimed(msg.sender, _amount);
  }

  /// @inheritdoc IERC4973
  function burn(uint256 _tokenId) external override {
    _burn(_tokenId);
  }

  /**
   * @dev Sets a new baseURI used by the tokenURI function
   * `<baseURI> + <tokenId> + <baseExtension>`
   */
  function setBaseURI(string memory _baseURI) external onlyOwner {
    _setBaseURI(_baseURI);
  }

  /**
   * Override {Minterable-transferOwnership}
   */
  function transferOwnership(address _newOwner)
    public
    override(Ownable, Minterable)
  {
    Minterable.transferOwnership(_newOwner);
  }

  /// @inheritdoc IERC165
  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC4973, AccessControl)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }
}
