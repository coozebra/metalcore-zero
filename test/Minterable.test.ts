import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer, Contract } from 'ethers';

describe('Minterable', () => {
  let contract: Contract;
  let owner: Signer, alice: Signer, bob: Signer;
  let ownerAddress: string, aliceAddress: string, bobAddress: string;

  before(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    const Minterable = await ethers.getContractFactory('Minterable');
    contract = await Minterable.deploy();
  });

  describe('Minter role add/remove', async () => {
    it('addMinter()', async () => {
      await contract.addMinter(aliceAddress);
      expect(await contract.isMinter(aliceAddress)).to.be.true;
    });
    it('removeMinter()', async () => {
      await contract.removeMinter(aliceAddress);
      await contract.removeMinter(bobAddress);
      expect(await contract.isMinter(aliceAddress)).to.be.false;
    });
    describe('reverts if', async () => {
      it('non owner call addMinter, removeMinter', async () => {
        await expect(contract.connect(alice).addMinter(aliceAddress))
          .to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(alice).removeMinter(aliceAddress))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });
      it('try to add zero address minter', async () => {
        await expect(contract.addMinter(ethers.constants.AddressZero)).to.be.revertedWith('InvalidAddress()');
      });
    });
  });

  describe('Allowance', async () => {
    it('increaseAllowance()', async () => {
      await contract.addMinter(aliceAddress);
      await contract.increaseAllowance(aliceAddress, 100);
      await contract.increaseAllowance(aliceAddress, 200);
      expect((await contract.minterAllowances(aliceAddress)).toString()).to.eq('300');
    });
    it('decreaseAllowance()', async () => {
      await contract.decreaseAllowance(aliceAddress, 150);
      expect((await contract.minterAllowances(aliceAddress)).toString()).to.eq('150');
    });
    describe('reverts if', async () => {
      it('caller is not contract owner for both', async () => {
        await expect(contract.connect(alice).increaseAllowance(aliceAddress, 100))
          .to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(alice).decreaseAllowance(aliceAddress, 100))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });
      it('minter wallet is zero address or contract owner for both', async () => {
        await expect(contract.increaseAllowance(ethers.constants.AddressZero, 100))
          .to.be.revertedWith('InvalidAddress()');
        await expect(contract.increaseAllowance(ownerAddress, 100))
          .to.be.revertedWith('InvalidAddress()');
        await expect(contract.decreaseAllowance(ethers.constants.AddressZero, 100))
          .to.be.revertedWith('InvalidAddress()');
        await expect(contract.decreaseAllowance(ownerAddress, 100))
          .to.be.revertedWith('InvalidAddress()');
      });
      it('zero amount for increaseAllowance()', async () => {
        await expect(contract.increaseAllowance(aliceAddress, 0))
          .to.be.revertedWith('InvalidAmount()');
      });
      it('amount exceed for decreaseAllowance()', async () => {
        await expect(contract.decreaseAllowance(aliceAddress, 200))
          .to.be.revertedWith('ExceedMinterAllowance()');
      });
    });
  });

  describe('Ownership', async () => {
    it('transferOwnership()', async () => {
      await contract.transferOwnership(bobAddress);
      expect(await contract.owner()).to.eq(bobAddress);
      // check old owner lose admin and minter roles
      expect(await contract.hasRole(ethers.constants.HashZero, ownerAddress)).to.be.false;
      expect(await contract.isMinter(ownerAddress)).to.be.false;
      // check new owner is granted admin and minter roles
      expect(await contract.hasRole(ethers.constants.HashZero, bobAddress)).to.be.true;
      expect(await contract.isMinter(bobAddress)).to.be.true;
    });
    describe('reverts if', async () => {
      it('non owner call transferOwnership()', async () => {
        await expect(contract.connect(alice).transferOwnership(bobAddress))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });
    });
  });
});
