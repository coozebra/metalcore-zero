// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../lib/Signer.sol";
import "../token/Asset.sol";

contract Claimer is Signer {
  mapping(bytes32 => uint256) public claimed;

  event LogClaimed(
    address indexed account,
    address indexed token,
    uint256 amount
  );

  constructor(
    address _signer
  ) Signer(_signer) {
    // we call the Signer constructor only
  }

  /**
   * @dev Claim a batch of assets
   * @param _amount claim amount; must not be zero
   * @param _maximum; the max that can be claimed per the off-chain signature
   * @param _source; the source in which the token was awarded
   * @param _signature claim signature; must be valid
   */
  function claimAsset(
    address _token,
    uint256 _amount,
    uint256 _maximum,
    uint256 _source,
    bytes calldata _signature
  ) external {
    if (_amount == 0) revert InvalidAmount();
    if (_amount > _maximum) revert InvalidAmount();

    bytes32 msgHash = keccak256(abi.encodePacked(
        _chainId(),
        _token,
        _maximum,
        _source,
        msg.sender,
        ++nonces[msg.sender]
      ));

    if (!_verify(msgHash, _signature)) revert InvalidSignature();

    bytes32 claimedKey = keccak256(abi.encodePacked(
        msg.sender,
        _token,
        _source
      ));

    uint256 alreadyClaimed = claimed[claimedKey];

    if (alreadyClaimed + _amount > _maximum) revert InvalidAmount();

    Asset(_token).mintBatch(msg.sender, _amount);

    claimed[claimedKey] = alreadyClaimed + _amount;

    emit LogClaimed(msg.sender, _token, _amount);
  }
}
