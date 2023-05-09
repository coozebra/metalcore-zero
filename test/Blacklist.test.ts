import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer, Contract } from 'ethers';

describe('Blacklist', async () => {
  let contract: Contract;
  let alice: Signer, bob: Signer;
  let aliceAddress: string, bobAddress: string;

  before(async () => {
    [, alice, bob] = await ethers.getSigners();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    const Blacklist = await ethers.getContractFactory('Blacklist');
    contract = await Blacklist.deploy();
  });

  describe('Blacklist', async () => {
    it('addBlacklist()', async () => {
      await contract.addBlacklist([aliceAddress, bobAddress, ethers.constants.AddressZero]);
      expect(await contract.blacklist(aliceAddress)).to.be.true;
      expect(await contract.blacklist(bobAddress)).to.be.true;
    });
    it('removeBlacklist()', async () => {
      await contract.removeBlacklist([bobAddress, ethers.constants.AddressZero]);
      expect(await contract.blacklist(bobAddress)).to.be.false;
    });
    describe('reverts if', async () => {
      it('non-owner call', async () => {
        await expect(contract.connect(alice).addBlacklist([bobAddress]))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });
    });
  });
});
