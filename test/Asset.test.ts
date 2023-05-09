import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer, Contract } from 'ethers';

describe('Asset', () => {
  let contract: Contract;
  let bridge: Signer, alice: Signer, bob: Signer, carol: Signer;
  let bridgeAddress: string, aliceAddress: string, bobAddress: string, carolAddress: string;

  before(async () => {
    [, bridge, alice, bob, carol] = await ethers.getSigners();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    carolAddress = await carol.getAddress();
    bridgeAddress = await bridge.getAddress();
    const Asset = await ethers.getContractFactory('Asset');  
    contract = await Asset.deploy(
      'Test asset',
      'ANFT',
      'https://api.example.com/metadata/',
      0
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

  describe('Pausability', async () => {
    it('pause()', async () => {
      await contract.pause();
      expect(await contract.paused()).to.be.true;
    });
    it('unpause()', async () => {
      await contract.unpause();
      expect(await contract.paused()).to.be.false;
    });
    describe('reverts if', async () => {
      it('non-owner call', async () => {
        await expect(contract.connect(alice).pause())
          .to.be.revertedWith('Ownable: caller is not the owner');
      });
    });
  });

  describe('mint()', async () => {
    it('expect to mint', async () => {
      // caller is contract owner
      await expect(contract['mint(address)'](bobAddress)).to.emit(contract, 'LogMinted').withArgs(bobAddress, 1);
      // caller is minter
      await contract.addMinter(aliceAddress);
      // allowance
      await contract.increaseAllowance(aliceAddress, 1);
      await expect(contract.connect(alice)['mint(address)'](carolAddress))
        .to.emit(contract, 'LogMinted').withArgs(carolAddress, 2);      
      expect(await contract.tokenURI(1)).to.eq('https://api.example.com/metadata/1');
      expect(await contract.ownerOf(1)).to.eq(bobAddress);
      expect(await contract.ownerOf(2)).to.eq(carolAddress);
    });
    describe('reverts if', async () => {
      it('non minter call', async () => {
        await expect(contract.connect(bob)['mint(address)'](carolAddress)).to.be.revertedWith('NoMinterRole()');
      });
      it('allowance exceed', async () => {
        await expect(contract.connect(alice)['mint(address)'](carolAddress))
          .to.be.revertedWith('ExceedMinterAllowance()');
      });
    });
  });

  describe('mintBatch()', async () => {
    it('expect to mint batch', async () => {
      // caller is contract owner
      await contract['mintBatch(address,uint256)'](bobAddress, 2);
      expect(await contract.ownerOf(3)).to.eq(bobAddress);
      expect(await contract.ownerOf(4)).to.eq(bobAddress);
      // caller is minter
      // allowance
      await contract.increaseAllowance(aliceAddress, 2);
      await contract.connect(alice)['mintBatch(address,uint256)'](carolAddress, 2);
      expect(await contract.ownerOf(5)).to.eq(carolAddress);
      expect(await contract.ownerOf(6)).to.eq(carolAddress);
    });
    describe('reverts if', async () => {
      it('non minter call', async () => {
        await expect(contract.connect(bob)['mintBatch(address,uint256)'](carolAddress, 2))
          .to.be.revertedWith('NoMinterRole()');
      });
      it('allowance exceed', async () => {
        await expect(contract.connect(alice)['mintBatch(address,uint256)'](carolAddress, 2))
          .to.be.revertedWith('ExceedMinterAllowance()');
      });
    });
  });

  describe('mint() by bridge', async () => {
    it('expect to mint by bridge', async () => {
      // caller is bridge contract
      await contract.addMinter(bridgeAddress);
      // allowance
      await contract.increaseAllowance(bridgeAddress, 1);
      await expect(contract.connect(bridge)['mint(address,uint256)'](carolAddress, 101))
        .to.emit(contract, 'LogMinted').withArgs(carolAddress, 101);      
    });
    describe('reverts if', async () => {
      it('non bridge call', async () => {
        await expect(contract.connect(bob)['mint(address,uint256)'](carolAddress, 101))
          .to.be.revertedWith('NoMinterRole()');
      });
      it('allowance exceed', async () => {
        await expect(contract.connect(alice)['mint(address,uint256)'](carolAddress, 101))
          .to.be.revertedWith('ExceedMinterAllowance()');
      });
    });
  });

  describe('mintBatch() by bridge', async () => {
    it('expect to mint batch by bridge', async () => {
      // caller is bridge contract      
      // allowance
      await contract.increaseAllowance(bridgeAddress, 2);
      await contract.connect(bridge)['mintBatch(address,uint256[])'](carolAddress, [102, 103]);
      expect(await contract.ownerOf(102)).to.eq(carolAddress);
      expect(await contract.ownerOf(103)).to.eq(carolAddress);
    });
    describe('reverts if', async () => {
      it('non minter call', async () => {
        await expect(contract.connect(bob)['mintBatch(address,uint256[])'](carolAddress, [102, 103]))
          .to.be.revertedWith('NoMinterRole()');
      });
      it('allowance exceed', async () => {
        await expect(contract.connect(bridge)['mintBatch(address,uint256[])'](carolAddress, [102, 103]))
          .to.be.revertedWith('ExceedMinterAllowance()');
      });
    });
  });

  describe('BaseURI', async () => {
    it('expect to change base uri', async () => {
      await contract.setBaseTokenURI('http://new-baseURI/');
      expect(await contract.baseTokenURI()).to.be.equal('http://new-baseURI/');
    });
    describe('reverts if', async () => {
      it('non contract owner tries to change the baseURI', async () => {
        await expect(
          contract.connect(alice).setBaseTokenURI('http://new-baseURI-alice/')
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });
  });
});
