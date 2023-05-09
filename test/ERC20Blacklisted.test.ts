import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer, Contract } from 'ethers';

describe('ERC20Blacklisted', async () => {
  let contract: Contract;
  let alice: Signer, bob: Signer;
  let bobAddress: string;

  before(async () => {
    [, alice, bob] = await ethers.getSigners();
    bobAddress = await bob.getAddress();
    const ERC20Blacklisted = await ethers.getContractFactory('ERC20Blacklisted');
    contract = await ERC20Blacklisted.deploy('MetalCore Token', 'MGT');
  });

  describe('Blacklist transfer disable', async () => {
    it('expect to revert blacklisted wallet transfer', async () => {
      await contract.addBlacklist([bobAddress]);
      await expect(contract.connect(alice).transfer(bobAddress, ethers.utils.parseEther('10')))
        .to.be.revertedWith('ERC20Blacklisted: TOKEN_TRANSFER_DISABLED');
    });
  });
});
