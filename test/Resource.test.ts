import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer, Contract } from 'ethers';

describe('Resource', () => {
  let contract: Contract;
  let alice: Signer, bob: Signer;
  let aliceAddress: string, bobAddress: string;

  before(async () => {
    [, alice, bob] = await ethers.getSigners();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    const Resource = await ethers.getContractFactory('Resource');
    contract = await Resource.deploy(
      'https://api.example.com/metadata/{id}.json'
    );
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

  describe('Create', async () => {
    it('create()', async () => {
      // caller is contract owner
      await expect(contract.create(2)).to.emit(contract, 'LogCreated').withArgs(1, 2);
      expect((await contract.tokenId()).toString()).to.eq('2');
      // caller is minter
      await contract.addMinter(aliceAddress);
      await expect(contract.connect(alice).create(2)).to.emit(contract, 'LogCreated').withArgs(3, 4);
      expect((await contract.tokenId()).toString()).to.eq('4');

    });
    describe('reverts if', async () => {
      it('caller is not minter', async () => {
        await expect(contract.connect(bob).create(1)).to.be.revertedWith('NoMinterRole()');
      });
      it('amount is zero', async () => {
        await expect(contract.create(0)).to.be.revertedWith('InvalidAmount()');
      });
    });
  });

  describe('Mint batch', async () => {
    it('mintBatch()', async () => {
      // caller is contract owner
      await expect(contract.mintBatch(bobAddress, [1, 2], [10, 20])).to.emit(contract, 'LogMintedBatch')
        .withArgs(bobAddress, [1, 2], [10, 20]);
      expect((await contract.balanceOf(bobAddress, 1)).toString()).to.eq('10');
      expect((await contract.balanceOf(bobAddress, 2)).toString()).to.eq('20');
      // caller is minter
      // allowance
      await contract.increaseAllowance(aliceAddress, 30);
      await expect(contract.connect(alice).mintBatch(bobAddress, [1, 2], [10, 20])).to.emit(contract, 'LogMintedBatch')
        .withArgs(bobAddress, [1, 2], [10, 20]);
    });
    describe('reverts if', async () => {
      it('caller is not minter', async () => {
        await expect(contract.connect(bob).mintBatch(bobAddress, [1, 2], [10, 20]))
          .to.be.revertedWith('NoMinterRole()');
      });
      it('token id is not valid', async () => {
        await expect(contract.mintBatch(bobAddress, [1, 10], [10, 20])).to.be.revertedWith('InvalidNFTId()');
        await expect(contract.mintBatch(bobAddress, [0, 2], [10, 20])).to.be.revertedWith('InvalidNFTId()');
      });
      it('allowance exceed', async () => {
        await expect(contract.connect(alice).mintBatch(bobAddress, [1, 2], [10, 20]))
          .to.be.revertedWith('ExceedMinterAllowance()');
      });
    });
  });
});
