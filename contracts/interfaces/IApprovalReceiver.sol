// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

interface IApprovalReceiver {
  function receiveApproval(
    address _from,
    uint256 _value,
    address _tokenContract,
    bytes calldata _extraData
  ) external returns (bool);
}
