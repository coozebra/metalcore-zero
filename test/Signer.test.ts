import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer, Contract, Wallet } from 'ethers';

describe('Signer', async () => {
  let contract: Contract;
  let alice: Signer;
  let signer0: Wallet, signer1: Wallet;

  before(async () => {
    [, alice] = await ethers.getSigners();
    // signer wallet
    signer0 = ethers.Wallet.createRandom();
    signer1 = ethers.Wallet.createRandom();
    const SignerContractFactory = await ethers.getContractFactory('Signer');
    contract = await SignerContractFactory.deploy(signer0.address);
  });

  describe('setSigner()', async () => {
    it('expect to set new signer', async () => {
      await expect(contract.setSigner(signer1.address)).to.emit(contract, 'LogSignerSet').withArgs(signer1.address);
    });
    describe('reverts if', async () => {
      it('non owner call', async () => {
        await expect(contract.connect(alice).setSigner(signer0.address))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });
      it('new signer is same as old one', async () => {
        await expect(contract.setSigner(signer1.address)).to.be.revertedWith('NoChangeToTheState()');
      });
      it('new signer is zero or contract address', async () => {
        await expect(contract.setSigner(ethers.constants.AddressZero)).to.be.revertedWith('InvalidAddress()');
        await expect(contract.setSigner(contract.address)).to.be.revertedWith('InvalidAddress()');
      });
    });
  });

});

