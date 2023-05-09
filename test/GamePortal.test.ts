import { deployMockContract, MockContract } from '@ethereum-waffle/mock-contract';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer, Contract, Wallet } from 'ethers';

import Asset from '../artifacts/contracts/token/Asset.sol/Asset.json';
import Resource from '../artifacts/contracts/token/Resource.sol/Resource.json';
import Currency from '../artifacts/contracts/token/Currency.sol/Currency.json';
import IERC20 from '../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json';

describe('GamePortal', () => {
  let contract: Contract, erc20: MockContract, currency: MockContract, asset: MockContract, resource: MockContract;
  let owner: Signer, alice: Signer, bob: Signer;
  let aliceAddress: string, bobAddress: string;
  let signer: Wallet, newSigner: Wallet;
  let CHAIN_ID: number;

  before(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    // mock contracts
    erc20 = await deployMockContract(owner, IERC20.abi);
    currency = await deployMockContract(owner, Currency.abi);
    asset = await deployMockContract(owner, Asset.abi);
    resource = await deployMockContract(owner, Resource.abi);
    // signer wallet
    signer = ethers.Wallet.createRandom();
    const GamePortal = await ethers.getContractFactory('GamePortal');
    contract = await GamePortal.deploy(signer.address);
    CHAIN_ID = 31337;
  });
  
  describe('setTokenAcceptance()', async () => {
    it('expect to set accepted tokens', async () => {
      await contract.setTokenAcceptance(erc20.address, { erc20: true });
      expect((await contract.accepted(erc20.address)).erc20).to.be.true;
    });

    describe('reverts if', async () => {
      it('caller is not contract owner', async () => {
        await expect(contract.connect(alice).setTokenAcceptance(erc20.address, { erc20: true }))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('token is not contract address', async () => {
        await expect(contract.setTokenAcceptance(aliceAddress, { erc20: true })).to.be.revertedWith('NotContract()');
      });
    });
  });

  describe('depositERC20()', async () => {
    it('expect to deposit erc20', async () => {
      // signature
      const msgHash = ethers.utils.solidityKeccak256(
        ['string', 'uint256', 'address', 'uint256', 'address', 'uint256'],
        ['depositERC20', CHAIN_ID, erc20.address, ethers.utils.parseEther('10'), aliceAddress, 1]
      );
      const msgHashBinary = ethers.utils.arrayify(msgHash);
      const sig = await signer.signMessage(msgHashBinary);
      
      await erc20.mock.transferFrom.withArgs(aliceAddress, contract.address, ethers.utils.parseEther('10'))
        .returns(true);

      await contract.connect(alice).depositERC20(erc20.address, ethers.utils.parseEther('10'), sig);
    });

    describe('reverts if', async () => {
      it('token is not accepted', async () => {
        await expect(contract.depositERC20(aliceAddress, ethers.utils.parseEther('10'), ethers.constants.HashZero))
          .to.be.revertedWith('NotAcceptedERC20()');
      });

      it('amount is zero', async () => {
        await expect(contract.depositERC20(erc20.address, 0, ethers.constants.HashZero))
          .to.be.revertedWith('InvalidAmount()');
      });
    });
  });

  describe('depositERC721()', async () => {
    it('expect to deposit erc721', async () => {
      // acceptance
      await contract.setTokenAcceptance(asset.address, { erc721: true });
      
      await asset.mock['safeTransferFrom(address,address,uint256)']
        .withArgs(aliceAddress, contract.address, 1).returns();
      // signature
      const msgHash = ethers.utils.solidityKeccak256(
        ['string', 'uint256', 'address', 'uint256', 'address', 'uint256'],
        ['depositERC721', CHAIN_ID, asset.address, 1, aliceAddress, 2]
      );
      const msgHashBinary = ethers.utils.arrayify(msgHash);
      const sig = await signer.signMessage(msgHashBinary);

      await expect(contract.connect(alice).depositERC721(asset.address, 1, sig))
        .to.emit(contract, 'LogERC721Deposited');
    });

    describe('reverts if', async () => {
      it('token is not accepted', async () => {
        await expect(contract.connect(alice).depositERC721(aliceAddress, 1, ethers.constants.HashZero))
          .to.be.revertedWith('NotAcceptedERC721()');
      });
    });
  });

  describe('depositERC1155()', async () => {
    it('expect to deposit erc1155', async () => {
      // acceptance
      await contract.setTokenAcceptance(resource.address, { erc1155: true });
      
      await resource.mock['safeTransferFrom(address,address,uint256,uint256,bytes)']
        .withArgs(aliceAddress, contract.address, 1, 10, '0x').returns();
      // signature
      const msgHash = ethers.utils.solidityKeccak256(
        ['string', 'uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
        ['depositERC1155', CHAIN_ID, resource.address, 1, 10, aliceAddress, 3]
      );
      const msgHashBinary = ethers.utils.arrayify(msgHash);
      const sig = await signer.signMessage(msgHashBinary);

      await expect(contract.connect(alice).depositERC1155(resource.address, 1, 10, sig))
        .to.emit(contract, 'LogERC1155Deposited');
    });

    describe('reverts if', async () => {
      it('token is not accepted', async () => {
        await expect(contract.connect(alice).depositERC1155(aliceAddress, 1, 10, ethers.constants.HashZero))
          .to.be.revertedWith('NotAcceptedERC1155()');
      });
      
      it('amount is zero', async () => {
        await expect(contract.connect(alice).depositERC1155(resource.address, 1, 0, ethers.constants.HashZero))
          .to.be.revertedWith('InvalidAmount()');
      });
    });
  });

  describe('withdrawERC20()', async () => {
    it('expect to withdraw erc20', async () => {
      // signature
      const msgHash = ethers.utils.solidityKeccak256(
        ['string', 'uint256', 'address', 'uint256', 'address', 'uint256'],
        ['withdrawERC20', CHAIN_ID, erc20.address, ethers.utils.parseEther('10'), aliceAddress, 4]
      );
      const msgHashBinary = ethers.utils.arrayify(msgHash);
      const sig = await signer.signMessage(msgHashBinary);
      
      await erc20.mock.transfer.withArgs(aliceAddress, ethers.utils.parseEther('10')).returns(true);

      await contract.connect(alice).withdrawERC20(erc20.address, ethers.utils.parseEther('10'), sig);
    });

    describe('reverts if', async () => {
      it('token is not accepted', async () => {
        await expect(contract.withdrawERC20(aliceAddress, ethers.utils.parseEther('10'), ethers.constants.HashZero))
          .to.be.revertedWith('NotAcceptedERC20()');
      });

      it('amount is zero', async () => {
        await expect(contract.withdrawERC20(erc20.address, 0, ethers.constants.HashZero))
          .to.be.revertedWith('InvalidAmount()');
      });
    });
  });

  describe('withdrawERC721()', async () => {
    it('expect to withdraw erc721', async () => {
      await asset.mock['safeTransferFrom(address,address,uint256)']
        .withArgs(contract.address, aliceAddress, 1).returns();
      // signature
      const msgHash = ethers.utils.solidityKeccak256(
        ['string', 'uint256', 'address', 'uint256', 'address', 'uint256'],
        ['withdrawERC721', CHAIN_ID, asset.address, 1, aliceAddress, 5]
      );
      const msgHashBinary = ethers.utils.arrayify(msgHash);
      const sig = await signer.signMessage(msgHashBinary);

      await expect(contract.connect(alice).withdrawERC721(asset.address, 1, sig))
        .to.emit(contract, 'LogERC721Withdrawn');

      // withdraw batch
      await asset.mock['safeTransferFrom(address,address,uint256)']
        .withArgs(contract.address, aliceAddress, 2).returns();
      // signature
      const msgHash1 = ethers.utils.solidityKeccak256(
        ['string', 'uint256', 'address', 'uint256[]', 'address', 'uint256'],
        ['withdrawERC721Batch', CHAIN_ID, asset.address, [1, 2], aliceAddress, 6]
      );
      const msgHashBinary1 = ethers.utils.arrayify(msgHash1);
      const sig1 = await signer.signMessage(msgHashBinary1);

      await contract.connect(alice).withdrawERC721Batch(asset.address, [1, 2], sig1);
    });

    describe('reverts if', async () => {
      it('token is not accepted', async () => {
        await expect(contract.connect(alice).withdrawERC721(aliceAddress, 1, ethers.constants.HashZero))
          .to.be.revertedWith('NotAcceptedERC721()');
      });
    });
  });

  describe('withdrawERC1155()', async () => {
    it('expect to withdraw erc1155', async () => {
      // acceptance
      await contract.setTokenAcceptance(resource.address, { erc1155: true });
      
      await resource.mock['safeTransferFrom(address,address,uint256,uint256,bytes)']
        .withArgs(contract.address, aliceAddress, 1, 10, '0x').returns();
      // signature
      const msgHash = ethers.utils.solidityKeccak256(
        ['string', 'uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
        ['withdrawERC1155', CHAIN_ID, resource.address, 1, 10, aliceAddress, 7]
      );
      const msgHashBinary = ethers.utils.arrayify(msgHash);
      const sig = await signer.signMessage(msgHashBinary);

      await expect(contract.connect(alice).withdrawERC1155(resource.address, 1, 10, sig))
        .to.emit(contract, 'LogERC1155Withdrawn');

      // withdraw batch
      await resource.mock['safeTransferFrom(address,address,uint256,uint256,bytes)']
        .withArgs(contract.address, aliceAddress, 2, 20, '0x').returns();
      // signature
      const msgHash1 = ethers.utils.solidityKeccak256(
        ['string', 'uint256', 'address', 'uint256[]', 'uint256[]', 'address', 'uint256'],
        ['withdrawERC1155Batch', CHAIN_ID, resource.address, [1, 2], [10, 20], aliceAddress, 8]
      );
      const msgHashBinary1 = ethers.utils.arrayify(msgHash1);
      const sig1 = await signer.signMessage(msgHashBinary1);

      await contract.connect(alice).withdrawERC1155Batch(resource.address, [1, 2], [10, 20], sig1);      
    });

    describe('reverts if', async () => {
      it('token is not accepted', async () => {
        await expect(contract.connect(alice).withdrawERC1155(aliceAddress, 1, 10, ethers.constants.HashZero))
          .to.be.revertedWith('NotAcceptedERC1155()');
      });      
    });
  });

  describe('mintAsset()', async () => {
    it('expect to mint a new asset', async () => {
      await asset.mock.mint.withArgs(aliceAddress).returns(1);

      await contract.mintAsset(asset.address, aliceAddress);
    });

    describe('reverts if', async () => {
      it('caller is not contract owner', async () => {
        await expect(contract.connect(alice).mintAsset(asset.address, aliceAddress))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('token is not accepted', async () => {
        await expect(contract.mintAsset(aliceAddress, aliceAddress))
          .to.be.revertedWith('NotAcceptedERC721()');
      });
    });
  });

  describe('mintBatchAsset()', async () => {
    it('expect to mint batch of new assets', async () => {
      await asset.mock['mintBatch(address,uint256)'].withArgs(aliceAddress, 2).returns();

      await contract.mintBatchAsset(asset.address, aliceAddress, 2);
    });

    describe('reverts if', async () => {
      it('caller is not contract owner', async () => {
        await expect(contract.connect(alice).mintBatchAsset(asset.address, aliceAddress, 2))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('token is not accepted', async () => {
        await expect(contract.mintBatchAsset(aliceAddress, aliceAddress, 2))
          .to.be.revertedWith('NotAcceptedERC721()');
      });
    });
  });

  describe('mergeAsset()', async () => {
    it('expect to merge assets', async () => {
      await asset.mock.ownerOf.withArgs(1).returns(contract.address);
      await asset.mock.ownerOf.withArgs(2).returns(contract.address);
      await asset.mock.burn.withArgs(1).returns();
      await asset.mock.burn.withArgs(2).returns();
      await asset.mock.mint.withArgs(contract.address).returns(3);

      await expect(contract.mergeAsset(asset.address, 1, 2))
        .to.emit(contract, 'LogAssetMerged');
    });

    describe('reverts if', async () => {
      it('caller is not contract owner', async () => {
        await expect(contract.connect(alice).mergeAsset(asset.address, 1, 2))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('token is not accepted', async () => {
        await expect(contract.mergeAsset(aliceAddress, 1, 2))
          .to.be.revertedWith('NotAcceptedERC721()');
      });

      it('merging nfts are not locked in the game portal', async () => {
        await asset.mock.ownerOf.withArgs(1).returns(bobAddress);

        await expect(contract.mergeAsset(asset.address, 1, 2))
          .to.be.revertedWith('NFTNotLocked()');
      });
    });
  });

  describe('craftAsset()', async () => {
    it('expect to craft asset', async () => {
      // acceptance
      await contract.setTokenAcceptance(currency.address, { erc20: true });
      
      await resource.mock.burnBatch.withArgs(contract.address, [1, 2], [10, 20]).returns();
      await currency.mock.burn.withArgs(ethers.utils.parseEther('10')).returns();
      await asset.mock.mint.withArgs(contract.address).returns(1);

      await contract.craftAsset(
        asset.address, 
        resource.address, 
        currency.address, 
        [1, 2], 
        [10, 20], 
        ethers.utils.parseEther('10')
      );
    });

    describe('reverts if', async () => {
      it('caller is not contract owner', async () => {
        await expect(contract.connect(alice).craftAsset(
          asset.address, 
          resource.address, 
          currency.address, 
          [1, 2], 
          [10, 20], 
          ethers.utils.parseEther('10')
        )).to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('tokens are not accepted', async () => {
        await expect(contract.craftAsset(
          aliceAddress, 
          resource.address, 
          currency.address, 
          [1, 2], 
          [10, 20], 
          ethers.utils.parseEther('10')
        )).to.be.revertedWith('NotAcceptedERC721()');
        // skip not accepted ERC20 and ERC1155 reverts
      });
    });
  });

  describe('burnAsset()', async () => {
    it('expect to burn asset', async () => {
      await asset.mock.burn.withArgs(1).returns();

      await contract.burnAsset(asset.address, 1);
    });

    describe('reverts if', async () => {
      it('caller is not contract owner', async () => {
        await expect(contract.connect(alice).burnAsset(asset.address, 1))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('token is not accepted', async () => {
        await expect(contract.burnAsset(aliceAddress, 1))
          .to.be.revertedWith('NotAcceptedERC721()');
      });
    });
  });

  describe('burnBatchAsset()', async () => {
    it('expect to burn batch of assets', async () => {
      await asset.mock.burn.withArgs(1).returns();
      await asset.mock.burn.withArgs(2).returns();

      await contract.burnBatchAsset(asset.address, [1, 2]);
    });

    describe('reverts if', async () => {
      it('caller is not contract owner', async () => {
        await expect(contract.connect(alice).burnBatchAsset(asset.address, [1, 2]))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('token is not accepted', async () => {
        await expect(contract.burnBatchAsset(aliceAddress, [1, 2]))
          .to.be.revertedWith('NotAcceptedERC721()');
      });

      it('token id array is empty', async () => {
        await expect(contract.burnBatchAsset(asset.address, []))
          .to.be.revertedWith('EmptyArray()');
      });
    });
  });

  describe('createResource()', async () => {
    it('expect to call create() of resource contract', async () => {
      await resource.mock.create.withArgs(2).returns();

      await contract.createResource(resource.address, 2);
    });
    
    describe('reverts if', async () => {
      it('caller is not contract owner', async () => {
        await expect(contract.connect(alice).createResource(resource.address, 2))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('token is not accepted', async () => {
        await expect(contract.createResource(aliceAddress, 2)).to.be.revertedWith('NotAcceptedERC1155()');
      });
    });
  });

  describe('mintBatchResource()', async () => {
    it('expect to call mintBatch() of resource contract', async () => {
      await resource.mock.mintBatch.withArgs(aliceAddress, [1, 2], [10, 20]).returns();

      await contract.mintBatchResource(resource.address, aliceAddress, [1, 2], [10, 20]);
    });
    
    describe('reverts if', async () => {
      it('caller is not contract owner', async () => {
        await expect(contract.connect(alice).mintBatchResource(resource.address, aliceAddress, [1, 2], [10, 20]))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('token is not accepted', async () => {
        await expect(contract.mintBatchResource(aliceAddress, aliceAddress, [1, 2], [10, 20]))
          .to.be.revertedWith('NotAcceptedERC1155()');
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

  describe('setSigner()', async () => {
    it('expect to set new signer', async () => {
      newSigner = ethers.Wallet.createRandom();
      await expect(contract.setSigner(newSigner.address))
        .to.emit(contract, 'LogSignerSet').withArgs(newSigner.address);
    });

    describe('reverts if', async () => {
      it('caller is not contract owner', async () => {
        await expect(contract.connect(alice).setSigner(newSigner.address))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });

      it('new signer is same as old one', async () => {
        await expect(contract.setSigner(newSigner.address)).to.be.revertedWith('NoChangeToTheState()');
      });

      it('new signer is zero or contract address', async () => {
        await expect(contract.setSigner(ethers.constants.AddressZero)).to.be.revertedWith('InvalidAddress()');
        await expect(contract.setSigner(asset.address)).to.be.revertedWith('InvalidAddress()');
      });
    });
  });
});
