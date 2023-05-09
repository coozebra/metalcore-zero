import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer, Contract, Wallet } from 'ethers';
import { deployMockContract, MockContract } from '@ethereum-waffle/mock-contract';

import Asset from '../artifacts/contracts/token/Asset.sol/Asset.json';

describe('Claimer', () => {
  let contract: Contract;
  let owner: Signer, alice: Signer, bob: Signer, carol: Signer;
  let aliceAddress: string;
  let signer: Wallet;
  let CHAIN_ID: number;
  let asset: MockContract;

  beforeEach(async () => {
    [owner, alice, bob, carol] = await ethers.getSigners();
    aliceAddress = await alice.getAddress();
    CHAIN_ID = 31337;
    // signer wallet
    signer = ethers.Wallet.createRandom();
    const ClaimerFactory = await ethers.getContractFactory('Claimer');
    contract = await ClaimerFactory.deploy(signer.address);
    asset = await deployMockContract(owner, Asset.abi);
    await contract.deployed();
  });

  describe('claimAsset()', () => {
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
        ['uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, asset.address, maximum, source, aliceAddress, nonce]
      );

      const msgHashBinary = ethers.utils.arrayify(msgHash);
      const signature = await signer.signMessage(msgHashBinary);

      await expect(
        contract.connect(alice).claimAsset(asset.address, amount, maximum, source, signature)
      ).to.be.revertedWith('InvalidAmount()');
    });

    it('cannot claim more than the maximum', async () => {
      amount = 10;
      maximum = 9;

      const msgHash = ethers.utils.solidityKeccak256(
        ['uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, asset.address, maximum, source, aliceAddress, nonce]
      );

      const msgHashBinary = ethers.utils.arrayify(msgHash);
      const signature = await signer.signMessage(msgHashBinary);

      await expect(
        contract.connect(alice).claimAsset(asset.address, amount, maximum, source, signature)
      ).to.be.revertedWith('InvalidAmount()');
    });

    it('cannot send invalid maximum', async () => {
      amount = 10;
      maximum = 9;

      const msgHash = ethers.utils.solidityKeccak256(
        ['uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, asset.address, maximum, source, aliceAddress, nonce]
      );

      const msgHashBinary = ethers.utils.arrayify(msgHash);
      const signature = await signer.signMessage(msgHashBinary);

      await expect(
        contract.connect(alice).claimAsset(asset.address, amount, 100, source, signature)
      ).to.be.revertedWith('InvalidSignature()');
    });

    it('cannot over claim in multiple transactions', async () => {
      const amount1 = 2;
      const amount2 = 4;
      maximum = 4;

      const msgHash1 = ethers.utils.solidityKeccak256(
        ['uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, asset.address, maximum, source, aliceAddress, nonce]
      );

      const msgHashBinary1 = ethers.utils.arrayify(msgHash1);
      const signature1 = await signer.signMessage(msgHashBinary1);

      await asset.mock['mintBatch(address,uint256)'].withArgs(aliceAddress, amount1.toString()).returns();

      await contract.connect(alice).claimAsset(asset.address, amount1, maximum, source, signature1);

      const claimedKey = ethers.utils.solidityKeccak256(
        ['address', 'address', 'uint256'],
        [aliceAddress, asset.address, source]
      );

      expect((await contract.claimed(claimedKey)).toString()).to.be.eq(amount1.toString());

      const msgHash2 = ethers.utils.solidityKeccak256(
        ['uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, asset.address, maximum, source, aliceAddress, nonce + 1]
      );

      const msgHashBinary2 = ethers.utils.arrayify(msgHash2);
      const signature2 = await signer.signMessage(msgHashBinary2);

      await expect(
        contract.connect(alice).claimAsset(asset.address, amount2, maximum, source, signature2)
      ).to.be.revertedWith('InvalidAmount()');
    });

    it('can claim a valid amount', async () => {
      amount = 1;
      maximum = 1;

      const msgHash = ethers.utils.solidityKeccak256(
        ['uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, asset.address, maximum, source, aliceAddress, 1]
      );

      const msgHashBinary = ethers.utils.arrayify(msgHash);
      const signature = await signer.signMessage(msgHashBinary);

      await asset.mock['mintBatch(address,uint256)'].withArgs(aliceAddress, amount.toString()).returns();

      await contract.connect(alice).claimAsset(asset.address, amount, maximum, source, signature);

      const claimedKey = ethers.utils.solidityKeccak256(
        ['address', 'address', 'uint256'],
        [aliceAddress, asset.address, source]
      );

      expect((await contract.claimed(claimedKey)).toString()).to.be.eq(amount.toString());
    });

    it('can claim valid amounts in multiple transactions', async () => {
      const amount1 = 3;
      const amount2 = 1;
      maximum = 4;

      const msgHash1 = ethers.utils.solidityKeccak256(
        ['uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, asset.address, maximum, source, aliceAddress, nonce]
      );

      const msgHashBinary1 = ethers.utils.arrayify(msgHash1);
      const signature1 = await signer.signMessage(msgHashBinary1);

      await asset.mock['mintBatch(address,uint256)'].withArgs(aliceAddress, amount1.toString()).returns();

      await contract.connect(alice).claimAsset(asset.address, amount1, maximum, source, signature1);

      const claimedKey = ethers.utils.solidityKeccak256(
        ['address', 'address', 'uint256'],
        [aliceAddress, asset.address, source]
      );

      expect((await contract.claimed(claimedKey)).toString()).to.be.eq(amount1.toString());

      const msgHash2 = ethers.utils.solidityKeccak256(
        ['uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
        [CHAIN_ID, asset.address, maximum, source, aliceAddress, nonce + 1]
      );

      const msgHashBinary2 = ethers.utils.arrayify(msgHash2);
      const signature2 = await signer.signMessage(msgHashBinary2);

      await asset.mock['mintBatch(address,uint256)'].withArgs(aliceAddress, amount2.toString()).returns();

      await contract.connect(alice).claimAsset(asset.address, amount2, maximum, source, signature2);

      expect((await contract.claimed(claimedKey)).toString()).to.be.eq(maximum.toString());
    });
  });
});
