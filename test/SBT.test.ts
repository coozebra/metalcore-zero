import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer, Contract, Wallet } from 'ethers';

describe('SBT', () => {
  let contract: Contract;
  let owner: Signer, alice: Signer, bob: Signer, carol: Signer;
  let aliceAddress: string, bobAddress: string, carolAddress: string;
  let signer: Wallet;
  let CHAIN_ID: number;

  beforeEach(async () => {
    [owner, alice, bob, carol] = await ethers.getSigners();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    carolAddress = await carol.getAddress();
    CHAIN_ID = 31337;
    // signer wallet
    signer = ethers.Wallet.createRandom();
    const SBT = await ethers.getContractFactory('SBT');
    contract = await SBT.deploy(signer.address, 'SBT Name', 'SBT Symbol', 'ipfs://sbt/');
    await contract.deployed();
  });

  describe('claim()', () => {
    let amount: number;
    let maximum: number;
    let source: number;
    let nonce: number;

    beforeEach(async () => {
      amount = 0;
      maximum = 0;
      source = 0;
      nonce = 1;
    });

    it('does not allow amount 0', async () => {
      const msgHash = ethers.utils.solidityKeccak256(
        ['uint256', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, maximum, source, aliceAddress, nonce]
      );

      const msgHashBinary = ethers.utils.arrayify(msgHash);
      const signature = await signer.signMessage(msgHashBinary);

      await expect(
        contract.connect(alice).claim(amount, maximum, source, signature)
      ).to.be.revertedWith('InvalidAmount()');
    });

    it('cannot claim more than the maximum', async () => {
      amount = 10;
      maximum = 9;

      const msgHash = ethers.utils.solidityKeccak256(
        ['uint256', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, maximum, source, aliceAddress, nonce]
      );

      const msgHashBinary = ethers.utils.arrayify(msgHash);
      const signature = await signer.signMessage(msgHashBinary);

      await expect(
        contract.connect(alice).claim(amount, maximum, source, signature)
      ).to.be.revertedWith('InvalidAmount()');
    });

    it('cannot send invalid maximum', async () => {
      amount = 10;
      maximum = 9;

      const msgHash = ethers.utils.solidityKeccak256(
        ['uint256', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, maximum, source, aliceAddress, nonce]
      );

      const msgHashBinary = ethers.utils.arrayify(msgHash);
      const signature = await signer.signMessage(msgHashBinary);

      await expect(
        contract.connect(alice).claim(amount, 100, source, signature)
      ).to.be.revertedWith('InvalidSignature()');
    });

    it('cannot over claim in multiple transactions', async () => {
      const amount1 = 2;
      const amount2 = 4;
      maximum = 4;

      const msgHash1 = ethers.utils.solidityKeccak256(
        ['uint256', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, maximum, source, aliceAddress, nonce]
      );

      const msgHashBinary1 = ethers.utils.arrayify(msgHash1);
      const signature1 = await signer.signMessage(msgHashBinary1);

      await contract.connect(alice).claim(amount1, maximum, source, signature1);

      const claimedKey = ethers.utils.solidityKeccak256(
        ['address', 'uint256'],
        [aliceAddress, source]
      );

      expect((await contract.balanceOf(aliceAddress)).toString()).to.be.eq(amount1.toString());
      expect((await contract.claimed(claimedKey)).toString()).to.be.eq(amount1.toString());

      const msgHash2 = ethers.utils.solidityKeccak256(
        ['uint256', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, maximum, source, aliceAddress, nonce + 1]
      );

      const msgHashBinary2 = ethers.utils.arrayify(msgHash2);
      const signature2 = await signer.signMessage(msgHashBinary2);

      await expect(
        contract.connect(alice).claim(amount2, maximum, source, signature2)
      ).to.be.revertedWith('InvalidAmount()');

      expect((await contract.balanceOf(aliceAddress)).toString()).to.be.eq(amount1.toString());
    });

    it('can claim a valid amount', async () => {
      amount = 1;
      maximum = 1;

      const msgHash = ethers.utils.solidityKeccak256(
        ['uint256', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, maximum, source, aliceAddress, 1]
      );

      const msgHashBinary = ethers.utils.arrayify(msgHash);
      const signature = await signer.signMessage(msgHashBinary);

      await contract.connect(alice).claim(amount, maximum, source, signature);

      const claimedKey = ethers.utils.solidityKeccak256(
        ['address', 'uint256'],
        [aliceAddress, source]
      );

      expect((await contract.claimed(claimedKey)).toString()).to.be.eq(amount.toString());
      expect((await contract.balanceOf(aliceAddress)).toString()).to.be.eq(amount.toString());
    });

    it('can claim valid amounts in multiple transactions', async () => {
      const amount1 = 3;
      const amount2 = 1;
      maximum = 4;

      const msgHash1 = ethers.utils.solidityKeccak256(
        ['uint256', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, maximum, source, aliceAddress, nonce]
      );

      const msgHashBinary1 = ethers.utils.arrayify(msgHash1);
      const signature1 = await signer.signMessage(msgHashBinary1);

      await contract.connect(alice).claim(amount1, maximum, source, signature1);

      const claimedKey = ethers.utils.solidityKeccak256(
        ['address', 'uint256'],
        [aliceAddress, source]
      );

      expect((await contract.balanceOf(aliceAddress)).toString()).to.be.eq(amount1.toString());
      expect((await contract.claimed(claimedKey)).toString()).to.be.eq(amount1.toString());

      const msgHash2 = ethers.utils.solidityKeccak256(
        ['uint256', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, maximum, source, aliceAddress, nonce + 1]
      );

      const msgHashBinary2 = ethers.utils.arrayify(msgHash2);
      const signature2 = await signer.signMessage(msgHashBinary2);

      await contract.connect(alice).claim(amount2, maximum, source, signature2);

      expect((await contract.balanceOf(aliceAddress)).toString()).to.be.eq(maximum.toString());
      expect((await contract.claimed(claimedKey)).toString()).to.be.eq(maximum.toString());
    });
  });

  describe('mint()', () => {
    beforeEach(async () => {
      /* 
      After minting:
      bob -> tokens: 1, 2, 4, 10, 11
      alice -> tokens: 3, 5
      carol -> 6, 7, 8, 9
      */
      await expect(contract.mint(bobAddress))
        .to.emit(contract, 'Attest')
        .withArgs(bobAddress, 1);
      await expect(contract.mint(bobAddress))
        .to.emit(contract, 'Attest')
        .withArgs(bobAddress, 2);
      await expect(contract.mint(aliceAddress))
        .to.emit(contract, 'Attest')
        .withArgs(aliceAddress, 3);
      await expect(contract.mint(bobAddress))
        .to.emit(contract, 'Attest')
        .withArgs(bobAddress, 4);
      await expect(contract.mint(aliceAddress))
        .to.emit(contract, 'Attest')
        .withArgs(aliceAddress, 5);
      await expect(contract.mint(carolAddress))
        .to.emit(contract, 'Attest')
        .withArgs(carolAddress, 6);
      await expect(contract.mint(carolAddress))
        .to.emit(contract, 'Attest')
        .withArgs(carolAddress, 7);
      await expect(contract.mint(carolAddress))
        .to.emit(contract, 'Attest')
        .withArgs(carolAddress, 8);
      await expect(contract.mint(carolAddress))
        .to.emit(contract, 'Attest')
        .withArgs(carolAddress, 9);
      await expect(contract.mint(bobAddress))
        .to.emit(contract, 'Attest')
        .withArgs(bobAddress, 10);
      await expect(contract.mint(bobAddress))
        .to.emit(contract, 'Attest')
        .withArgs(bobAddress, 11);
    });

    it('checks ownerOf', async () => {
      expect(await contract.ownerOf(1)).to.eq(bobAddress);
      expect(await contract.ownerOf(2)).to.eq(bobAddress);
      expect(await contract.ownerOf(4)).to.eq(bobAddress);
      expect(await contract.ownerOf(3)).to.eq(aliceAddress);
      expect(await contract.ownerOf(5)).to.eq(aliceAddress);
      expect(await contract.ownerOf(6)).to.eq(carolAddress);
      expect(await contract.ownerOf(7)).to.eq(carolAddress);
      expect(await contract.ownerOf(8)).to.eq(carolAddress);
      expect(await contract.ownerOf(9)).to.eq(carolAddress);
      expect(await contract.ownerOf(10)).to.eq(bobAddress);
      expect(await contract.ownerOf(11)).to.eq(bobAddress);
    });

    it('checks balanceOf', async () => {
      expect(await contract.balanceOf(bobAddress)).to.eq(5);
      expect(await contract.balanceOf(aliceAddress)).to.eq(2);
      expect(await contract.balanceOf(carolAddress)).to.eq(4);
    });

    it('checks totalSupply()', async () => {
      expect(await contract.totalSupply()).to.eq(11);
    });

    it('checks tokenOfOwnerByIndex', async () => {
      expect(await contract.tokenOfOwnerByIndex(bobAddress, 0)).to.eq(1);
      expect(await contract.tokenOfOwnerByIndex(bobAddress, 1)).to.eq(2);
      expect(await contract.tokenOfOwnerByIndex(bobAddress, 2)).to.eq(4);
      expect(await contract.tokenOfOwnerByIndex(bobAddress, 3)).to.eq(10);
      expect(await contract.tokenOfOwnerByIndex(bobAddress, 4)).to.eq(11);
      expect(await contract.tokenOfOwnerByIndex(aliceAddress, 0)).to.eq(3);
      expect(await contract.tokenOfOwnerByIndex(aliceAddress, 1)).to.eq(5);
      expect(await contract.tokenOfOwnerByIndex(carolAddress, 0)).to.eq(6);
      expect(await contract.tokenOfOwnerByIndex(carolAddress, 1)).to.eq(7);
      expect(await contract.tokenOfOwnerByIndex(carolAddress, 2)).to.eq(8);
      expect(await contract.tokenOfOwnerByIndex(carolAddress, 3)).to.eq(9);
    });
  });

  describe('mintBatch()', () => {
    beforeEach(async () => {
      /* 
      After minting:
      bob -> tokens: 1, 2, 4, 10, 11
      alice -> tokens: 3, 5
      carol -> 6, 7, 8, 9
      */
      await contract.mintBatch([
        bobAddress,
        bobAddress,
        aliceAddress,
        bobAddress,
        aliceAddress,
        carolAddress,
        carolAddress,
        carolAddress,
        carolAddress,
        bobAddress,
        bobAddress,
      ]);
    });

    it('checks ownerOf', async () => {
      expect(await contract.ownerOf(1)).to.eq(bobAddress);
      expect(await contract.ownerOf(2)).to.eq(bobAddress);
      expect(await contract.ownerOf(4)).to.eq(bobAddress);
      expect(await contract.ownerOf(3)).to.eq(aliceAddress);
      expect(await contract.ownerOf(5)).to.eq(aliceAddress);
      expect(await contract.ownerOf(6)).to.eq(carolAddress);
      expect(await contract.ownerOf(7)).to.eq(carolAddress);
      expect(await contract.ownerOf(8)).to.eq(carolAddress);
      expect(await contract.ownerOf(9)).to.eq(carolAddress);
      expect(await contract.ownerOf(10)).to.eq(bobAddress);
      expect(await contract.ownerOf(11)).to.eq(bobAddress);
    });

    it('checks balanceOf', async () => {
      expect(await contract.balanceOf(bobAddress)).to.eq(5);
      expect(await contract.balanceOf(aliceAddress)).to.eq(2);
      expect(await contract.balanceOf(carolAddress)).to.eq(4);
    });

    it('checks totalSupply()', async () => {
      expect(await contract.totalSupply()).to.eq(11);
    });

    it('checks tokenOfOwnerByIndex', async () => {
      expect(await contract.tokenOfOwnerByIndex(bobAddress, 0)).to.eq(1);
      expect(await contract.tokenOfOwnerByIndex(bobAddress, 1)).to.eq(2);
      expect(await contract.tokenOfOwnerByIndex(bobAddress, 2)).to.eq(4);
      expect(await contract.tokenOfOwnerByIndex(bobAddress, 3)).to.eq(10);
      expect(await contract.tokenOfOwnerByIndex(bobAddress, 4)).to.eq(11);
      expect(await contract.tokenOfOwnerByIndex(aliceAddress, 0)).to.eq(3);
      expect(await contract.tokenOfOwnerByIndex(aliceAddress, 1)).to.eq(5);
      expect(await contract.tokenOfOwnerByIndex(carolAddress, 0)).to.eq(6);
      expect(await contract.tokenOfOwnerByIndex(carolAddress, 1)).to.eq(7);
      expect(await contract.tokenOfOwnerByIndex(carolAddress, 2)).to.eq(8);
      expect(await contract.tokenOfOwnerByIndex(carolAddress, 3)).to.eq(9);
    });
  });

  describe('burn()', async () => {
    beforeEach(async () => {
      /* 
      After burning:
      bob -> tokens: 1, 4, 10, 11
      alice -> tokens: 3, 5
      carol -> 7, 8, 9
      */
      await expect(contract.mint(bobAddress))
        .to.emit(contract, 'Attest')
        .withArgs(bobAddress, 1);
      await expect(contract.mint(bobAddress))
        .to.emit(contract, 'Attest')
        .withArgs(bobAddress, 2);
      await expect(contract.mint(aliceAddress))
        .to.emit(contract, 'Attest')
        .withArgs(aliceAddress, 3);
      await expect(contract.mint(bobAddress))
        .to.emit(contract, 'Attest')
        .withArgs(bobAddress, 4);
      await expect(contract.mint(aliceAddress))
        .to.emit(contract, 'Attest')
        .withArgs(aliceAddress, 5);
      await expect(contract.mint(carolAddress))
        .to.emit(contract, 'Attest')
        .withArgs(carolAddress, 6);
      await expect(contract.mint(carolAddress))
        .to.emit(contract, 'Attest')
        .withArgs(carolAddress, 7);
      await expect(contract.mint(carolAddress))
        .to.emit(contract, 'Attest')
        .withArgs(carolAddress, 8);
      await expect(contract.mint(carolAddress))
        .to.emit(contract, 'Attest')
        .withArgs(carolAddress, 9);
      await expect(contract.mint(bobAddress))
        .to.emit(contract, 'Attest')
        .withArgs(bobAddress, 10);
      await expect(contract.mint(bobAddress))
        .to.emit(contract, 'Attest')
        .withArgs(bobAddress, 11);

      await expect(contract.connect(bob).burn(2))
        .to.emit(contract, 'Revoke')
        .withArgs(bobAddress, 2);
      await expect(contract.connect(carol).burn(6))
        .to.emit(contract, 'Revoke')
        .withArgs(carolAddress, 6);
    });

    it('checks ownerOf', async () => {
      expect(await contract.ownerOf(1)).to.eq(bobAddress);
      expect(await contract.ownerOf(4)).to.eq(bobAddress);
      expect(await contract.ownerOf(10)).to.eq(bobAddress);
      expect(await contract.ownerOf(11)).to.eq(bobAddress);
      expect(await contract.ownerOf(3)).to.eq(aliceAddress);
      expect(await contract.ownerOf(5)).to.eq(aliceAddress);
      expect(await contract.ownerOf(7)).to.eq(carolAddress);
      expect(await contract.ownerOf(8)).to.eq(carolAddress);
      expect(await contract.ownerOf(9)).to.eq(carolAddress);
    });

    it('checks balanceOf', async () => {
      expect(await contract.balanceOf(bobAddress)).to.eq(4);
      expect(await contract.balanceOf(aliceAddress)).to.eq(2);
      expect(await contract.balanceOf(carolAddress)).to.eq(3);
    });

    it('checks totalSupply()', async () => {
      expect(await contract.totalSupply()).to.eq(9);
    });

    it('checks tokenOfOwnerByIndex', async () => {
      expect(await contract.tokenOfOwnerByIndex(bobAddress, 0)).to.eq(1);
      expect(await contract.tokenOfOwnerByIndex(bobAddress, 1)).to.eq(11);
      expect(await contract.tokenOfOwnerByIndex(bobAddress, 2)).to.eq(4);
      expect(await contract.tokenOfOwnerByIndex(bobAddress, 3)).to.eq(10);
      expect(await contract.tokenOfOwnerByIndex(aliceAddress, 0)).to.eq(3);
      expect(await contract.tokenOfOwnerByIndex(aliceAddress, 1)).to.eq(5);
      expect(await contract.tokenOfOwnerByIndex(carolAddress, 0)).to.eq(9);
      expect(await contract.tokenOfOwnerByIndex(carolAddress, 1)).to.eq(7);
      expect(await contract.tokenOfOwnerByIndex(carolAddress, 2)).to.eq(8);
    });

    it('doesn\'t allow a non-owner to burn', async () => {
      await expect(contract.connect(alice).burn(1)).to.be.revertedWith(
        'NotTokenOwner()'
      );
    });

    it('doesn\'t allow to burn twice', async () => {
      await expect(contract.connect(bob).burn(2)).to.be.revertedWith(
        'InvalidNFTId()'
      );
    });
  });

  describe('Minterable', async () => {
    it('does not allow a non minter to mint', async () => {
      await expect(contract.connect(bob).mint(bobAddress)).to.be.revertedWith(
        'NoMinterRole()'
      );
    });

    it('allows minter user to mint', async () => {
      await contract.addMinter(bobAddress);
      await contract.increaseAllowance(bobAddress, 1);
      await expect(contract.connect(bob).mint(bobAddress))
        .to.emit(contract, 'Attest')
        .withArgs(bobAddress, 1);
      expect(await contract.minterAllowances(bobAddress)).to.be.equal(0);
    });

    it('allows minter user to mint a batch', async () => {
      await contract.addMinter(bobAddress);
      await contract.increaseAllowance(bobAddress, 2);
      await contract.connect(bob).mintBatch([aliceAddress, carolAddress]);
      expect(await contract.minterAllowances(bobAddress)).to.be.equal(0);
    });

    it('doesn\'t allow minter without enough allowance to mint', async () => {
      await contract.addMinter(bobAddress);
      await expect(contract.connect(bob).mint(bobAddress)).to.revertedWith(
        'ExceedMinterAllowance()'
      );
    });

    it('doesn\'t allow minter without enough allowance to mint a batch', async () => {
      await contract.addMinter(bobAddress);
      await contract.increaseAllowance(bobAddress, 1);
      await expect(
        contract.connect(bob).mintBatch([aliceAddress, carolAddress])
      ).to.revertedWith('ExceedMinterAllowance()');
    });
  });

  describe('Token URI', async () => {
    it('checks the tokenURI based on the numeration', async () => {
      await contract.mint(bobAddress);
      await contract.mint(aliceAddress);
      expect(await contract.tokenURI(1)).to.be.equal('ipfs://sbt/1');
      expect(await contract.tokenURI(2)).to.be.equal('ipfs://sbt/2');
    });

    it('changes the baseURI', async () => {
      contract.connect(owner).setBaseURI('ipfs://sbt-new/');
      await contract.mint(bobAddress);
      await contract.mint(aliceAddress);
      expect(await contract.tokenURI(1)).to.be.equal('ipfs://sbt-new/1');
      expect(await contract.tokenURI(2)).to.be.equal('ipfs://sbt-new/2');
    });

    it('fails if non-owner wants to change the baseURI', async () => {
      await expect(
        contract.connect(alice).setBaseURI('ipfs://alice-token-uri')
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });
});
