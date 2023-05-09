import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer, Contract } from 'ethers';

describe('MGT', async () => {
  let contract: Contract;
  let owner: Signer, bridge: Signer, alice: Signer, bob: Signer;
  let bridgeAddress: string, aliceAddress: string, bobAddress: string;

  before(async () => {
    [owner, bridge, alice, bob] = await ethers.getSigners();
    bridgeAddress = await bridge.getAddress();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    const MGT = await ethers.getContractFactory('MGT');
    contract = await MGT.deploy(bridgeAddress);
  });

  describe('mint()', async () => {
    it('expect to mint', async () => {
      await contract.mint(aliceAddress, ethers.utils.parseEther('100'));
      await contract.connect(bridge).mint(bobAddress, ethers.utils.parseEther('100'));
      expect((await contract.balanceOf(aliceAddress)).toString()).to.eq('100000000000000000000');
    });
    describe('reverts if', async () => {
      it('caller is not owner nor bridge', async () => {
        await expect(contract.connect(alice).mint(aliceAddress, ethers.utils.parseEther('100')))
          .to.be.revertedWith('MGT: CALLER_NO_OWNER_BRIDGE');
      });
      it('mint amount is 0', async () => {
        await expect(contract.mint(aliceAddress, ethers.utils.parseEther('0')))
          .to.be.revertedWith('InvalidAmount');
      });
    });
  });

  describe('burn()', async () => {
    it('expect to burn', async () => {
      await contract.connect(alice).burn(ethers.utils.parseEther('50'));
      expect((await contract.balanceOf(aliceAddress)).toString()).to.eq('50000000000000000000');
    });
  });

  describe('Maxsupply', async () => {
    it('expect to revert if max supply exceed', async () => {
      await expect(contract.mint(aliceAddress, ethers.utils.parseEther('250000000')))
        .to.be.revertedWith('ERC20Votes: total supply risks overflowing votes');
    });
  });

  describe('setBridge()', async () => {
    const newBridgeAddress = '0x15FdAE2bdDeda7eAcD5b666C6B3e2576d0bC23C7';
    it('changes the bridge address', async () => {
      await contract.connect(owner).setBridge(newBridgeAddress);
      const currentBridge = await contract.bridge();
      expect(currentBridge).to.be.equal(newBridgeAddress);
    });
    it('fails to change the bridge address by other than the contract owner', async () => {
      await expect(
        contract.connect(alice).setBridge(newBridgeAddress)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });
});
