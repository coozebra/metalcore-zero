// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IApprovalReceiver.sol";
import "../lib/Whitelist.sol";

contract ApprovalCaller is ReentrancyGuard, Whitelist {
  /**
   * @dev Addition to ERC20 token methods. It allows to
   * approve the transfer of value and execute a call with the sent data.
   * Beware that changing an allowance with this method brings the risk that
   * someone may use both the old and the new allowance by unfortunate
   * transaction ordering. One possible solution to mitigate this race condition
   * is to first reduce the spender's allowance to 0 and set the desired value
   * afterwards:
   * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   * @param _spender The address that will spend the funds.
   * @param _value The amount of tokens to be spent.
   * @param _data ABI-encoded contract call to call `_spender` address.
   * @return true if the call function was executed successfully
   */
  function approveAndCall(
    address _spender,
    uint256 _value,
    bytes memory _data
  ) external nonReentrant returns (bool) {
    require(whitelist[_spender], "ApprovalCaller: SPENDER_NOT_WHITELISTED");
    IERC20(address(this)).approve(_spender, _value);

    require(
      IApprovalReceiver(_spender).receiveApproval(msg.sender, _value, address(this), _data),
      "ApprovalCaller: EXTERNAL_CALL_FAILED"
    );

    return true;
  }
}
