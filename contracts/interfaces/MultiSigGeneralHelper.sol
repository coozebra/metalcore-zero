//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./PowerMultiSig.sol";

contract MultiSigGeneralHelper is PowerMultiSig {
  constructor(
    address[] memory _owners,
    uint256[] memory _powers,
    uint256 _requiredPower
  ) PowerMultiSig(_owners, _powers, _requiredPower) { }

  // ========== helpers for: Operatorable

  function submitAddOperatorTx(
    address _destination,
    address _account
  ) external returns (uint256) {
    bytes memory data = abi.encodeWithSignature("addOperator(address)", _account);
    return submitTransaction(_destination, 0, data);
  }

  function submitRemoveOperatorTx(
    address _destination,
    address _account
  ) external returns (uint256) {
    bytes memory data = abi.encodeWithSignature("removeOperator(address)", _account);
    return submitTransaction(_destination, 0, data);
  }

  function submitPauseTx(
    address _destination
  ) external returns (uint256) {
    bytes memory data = abi.encodeWithSignature("pause()");
    return submitTransaction(_destination, 0, data);
  }

  function submitUnpauseTx(
    address _destination
  ) external returns (uint256) {
    bytes memory data = abi.encodeWithSignature("unpause()");
    return submitTransaction(_destination, 0, data);
  }

  // ========== helpers for: BaseNFT

  function submitSetBaseTokenURITx(
    address _destination,
    string memory _baseTokenURI
  ) public returns (uint256) {
    bytes memory data = abi.encodeWithSignature("setBaseTokenURI(string)", _baseTokenURI);
    return submitTransaction(_destination, 0, data);
  }

  function submitAddBlacklistTx(
    address _destination,
    address[] memory _accounts
  ) public returns (uint256) {
    bytes memory data = abi.encodeWithSignature("addBlacklist(address[])", _accounts);
    return submitTransaction(_destination, 0, data);
  }

  function submitRemoveBlacklistTx(
    address _destination,
    address[] memory _accounts
  ) public returns (uint256) {
    bytes memory data = abi.encodeWithSignature("removeBlacklist(address[])", _accounts);
    return submitTransaction(_destination, 0, data);
  }

  // ========== helpers for: BaseSale

  function submitStartSaleTx(
    address _destination
  ) public returns (uint256) {
    bytes memory data = abi.encodeWithSignature("startSale()");
    return submitTransaction(_destination, 0, data);
  }

  function submitEndSaleTx(
    address _destination
  ) public returns (uint256) {
    bytes memory data = abi.encodeWithSignature("endSale()");
    return submitTransaction(_destination, 0, data);
  }

  function submitSetPriceTx(
    address _destination,
    uint256 _price
  ) public returns (uint256) {
    bytes memory data = abi.encodeWithSignature("setPrice(uint256)", _price);
    return submitTransaction(_destination, 0, data);
  }

  function submitSetMaxMintTx(
    address _destination,
    uint256 _maxMint
  ) public returns (uint256) {
    bytes memory data = abi.encodeWithSignature("setMaxMint(uint256)", _maxMint);
    return submitTransaction(_destination, 0, data);
  }

  function submitMintUnsoldTokensTx(
    address _destination,
    uint256 _amount
  ) public returns (uint256) {
    bytes memory data = abi.encodeWithSignature("mintUnsoldTokens(uint256)", _amount);
    return submitTransaction(_destination, 0, data);
  }

  function submitWithdrawEthTx(
    address _destination,
    address _to
  ) public returns (uint256) {
    bytes memory data = abi.encodeWithSignature("withdrawEth(address)", _to);
    return submitTransaction(_destination, 0, data);
  }

  // ========== helpers for: PreSale

  function submitSetMaxMintPerAddressTx(
    address _destination,
    uint8 _maxMintPerAddress
  ) public returns (uint256) {
    bytes memory data = abi.encodeWithSignature("setMaxMintPerAddress(uint8)", _maxMintPerAddress);
    return submitTransaction(_destination, 0, data);
  }

  function submitAddWhitelistTx(
    address _destination,
    address[] memory _accounts
  ) public returns (uint256) {
    bytes memory data = abi.encodeWithSignature("addWhitelist(address[])", _accounts);
    return submitTransaction(_destination, 0, data);
  }

  function submitRemoveWhitelistTx(
    address _destination,
    address[] memory _accounts
  ) public returns (uint256) {
    bytes memory data = abi.encodeWithSignature("removeWhitelist(address[])", _accounts);
    return submitTransaction(_destination, 0, data);
  }

  // ========== helpers for: Sale

  function submitSetMaxMintPerTxTx(
    address _destination,
    uint8 _maxMintPerTx
  ) public returns (uint256) {
    bytes memory data = abi.encodeWithSignature("setMaxMintPerTx(uint8)", _maxMintPerTx);
    return submitTransaction(_destination, 0, data);
  }

  // ========== helpers for: FAB

  function submitMintTx(
    address _destination,
    address _account,
    uint256 _amount
  ) public returns (uint256) {
    bytes memory data = abi.encodeWithSignature("mint(address,uint256)", _account, _amount);
    return submitTransaction(_destination, 0, data);
  }
}
