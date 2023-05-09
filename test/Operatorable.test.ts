import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer, Contract } from 'ethers';

describe('Operatorable', () => {
  let contract: Contract;
  let owner: Signer, alice: Signer, bob: Signer;
  let ownerAddress: string, aliceAddress: string, bobAddress: string;

  before(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    const Operatorable = await ethers.getContractFactory('Operatorable');
    contract = await Operatorable.deploy();
  });

  describe('Operator role add/remove', async () => {
    it('addOperator()', async () => {
      await contract.addOperator(aliceAddress);
      expect(await contract.isOperator(aliceAddress)).to.be.true;
    });
    it('removeOperator()', async () => {
      await contract.removeOperator(aliceAddress);
      await contract.removeOperator(bobAddress);
      expect(await contract.isOperator(aliceAddress)).to.be.false;
    });
    describe('reverts if', async () => {
      it('non owner call addOperator, removeOperator', async () => {
        await expect(contract.connect(alice).addOperator(aliceAddress))
          .to.be.revertedWith('Ownable: caller is not the owner');
        await expect(contract.connect(alice).removeOperator(aliceAddress))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });
      it('try to add zero address operator', async () => {
        await expect(contract.addOperator(ethers.constants.AddressZero)).to.be.revertedWith('InvalidAddress()');
      });
    });
  });

  describe('Ownership', async () => {
    it('transferOwnership()', async () => {
      await contract.transferOwnership(bobAddress);
      expect(await contract.owner()).to.eq(bobAddress);
      // check old owner lose admin and operator roles
      expect(await contract.hasRole(ethers.constants.HashZero, ownerAddress)).to.be.false;
      expect(await contract.isOperator(ownerAddress)).to.be.false;
      // check new owner is granted admin and operator roles
      expect(await contract.hasRole(ethers.constants.HashZero, bobAddress)).to.be.true;
      expect(await contract.isOperator(bobAddress)).to.be.true;
    });
    describe('reverts if', async () => {
      it('non owner call transferOwnership()', async () => {
        await expect(contract.connect(alice).transferOwnership(bobAddress))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });
    });
  });
});
