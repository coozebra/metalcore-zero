import { deployMockContract, MockContract } from '@ethereum-waffle/mock-contract';
import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { Signer, Contract, Wallet } from 'ethers';

import Asset from '../artifacts/contracts/token/Asset.sol/Asset.json';

describe('Sale', async () => {
  let contract: Contract, asset: MockContract;
  let owner: Signer, operator: Signer, alice: Signer, bob: Signer, carol: Signer;
  let operatorAddress: string, aliceAddress: string, bobAddress: string, carolAddress: string;
  let signer: Wallet;
  let CHAIN_ID: number;
  let msgHash, msgHashBinary, sig: any;

  before(async () => {
    [owner, operator, alice, bob, carol] = await ethers.getSigners();
    operatorAddress = await operator.getAddress();
    aliceAddress = await alice.getAddress();
    bobAddress = await bob.getAddress();
    carolAddress = await carol.getAddress();
    asset = await deployMockContract(owner, Asset.abi);
    // signer wallet
    signer = ethers.Wallet.createRandom();
    const Sale = await ethers.getContractFactory('Sale');
    // minting cap is 10
    contract = await Sale.deploy(signer.address, asset.address, 10);
    await contract.addOperator(operatorAddress);
    CHAIN_ID = 31337;
  });

  describe('Eth transfer', async () => {
    it('expect not to allow Eth transfer with no data', async () => {
      await expect(alice.sendTransaction({to: contract.address, value: ethers.utils.parseEther('1')}))
        .to.be.revertedWith('EthReceived()');
    });
  });

  describe('setPrice()', async () => {
    it('expect to set price', async () => {
      await expect(contract.connect(operator).setPrice(ethers.utils.parseEther('2.5'))).to.emit(contract, 'LogPriceSet')
        .withArgs(ethers.utils.parseEther('2.5'));      
    });
    describe('reverts if', async () => {
      it('non operator call', async () => {
        await expect(contract.connect(alice).setPrice(ethers.utils.parseEther('2.5')))
          .to.be.revertedWith('NoOperatorRole()');
      });
    });
  });

  describe('setMaxMintPerTx()', async () => {
    it('expect to set max mint per tx', async () => {
      await expect(contract.connect(operator).setMaxMintPerTx(2)).to.emit(contract, 'LogMaxMintPerTxSet').withArgs(2);
    });
    describe('reverts if', async () => {
      it('non operator call', async () => {
        await expect(contract.connect(alice).setMaxMintPerTx(3)).to.be.revertedWith('NoOperatorRole()');
      });
      it('zero value', async () => {
        await expect(contract.connect(operator).setMaxMintPerTx(0)).to.be.revertedWith('InvalidMaxMintPerTx()');
      });
      it('no change to the sate', async () => {
        await expect(contract.connect(operator).setMaxMintPerTx(2)).to.be.revertedWith('NoChangeToTheState()');
        // reset 3
        await contract.connect(operator).setMaxMintPerTx(3);
      });
    });
  });
  
  describe('setMaxMintPerAddress()', async () => {
    it('expect to set max mint per address', async () => {
      await expect(contract.connect(operator).setMaxMintPerAddress(2))
        .to.emit(contract, 'LogMaxMintPerAddressSet').withArgs(2);
    });
    describe('reverts if', async () => {
      it('non operator call', async () => {
        await expect(contract.connect(alice).setMaxMintPerAddress(3)).to.be.revertedWith('NoOperatorRole()');
      });
      it('zero value', async () => {
        await expect(contract.connect(operator).setMaxMintPerAddress(0))
          .to.be.revertedWith('InvalidMaxMintPerAddress()');
      });
      it('no change to the state', async () => {
        await expect(contract.connect(operator).setMaxMintPerAddress(2)).to.be.revertedWith('NoChangeToTheState()');
        // reset 3
        await contract.connect(operator).setMaxMintPerAddress(3);
      });
    });
  });

  describe('increaseMaxMintable()', async () => {
    it('expect to increase max mintable limit', async () => {
      await expect(contract.connect(operator).increaseMaxMintable(6))
        .to.emit(contract, 'LogMaxMintableSet').withArgs(6);
    });
    describe('reverts if', async () => {
      it('non operator call', async () => {
        await expect(contract.connect(alice).increaseMaxMintable(6)).to.be.revertedWith('NoOperatorRole()');
      });
      it('zero amount', async () => {
        await expect(contract.connect(operator).increaseMaxMintable(0)).to.be.revertedWith('InvalidAmount()');
      });
      it('exceed minting cap', async () => {
        await expect(contract.connect(operator).increaseMaxMintable(5)).to.be.revertedWith('ExceedCap()');
      });
    });
  });

  describe('purchase()', async () => {
    describe('pre-sale', async () => {
      it('expect to purchase', async () => {        
        await expect(contract.connect(operator).startPresale())
          .to.emit(contract, 'LogPresaleStarted').withArgs(operatorAddress);
        // mocks
        await asset.mock['mintBatch(address,uint256)'].withArgs(aliceAddress, 2).returns();
        
        // signature
        msgHash = ethers.utils.solidityKeccak256(
          ['uint256', 'address', 'uint256', 'address', 'uint256'],
          [CHAIN_ID, asset.address, 2, aliceAddress, 1]
        );
        msgHashBinary = ethers.utils.arrayify(msgHash);
        sig = await signer.signMessage(msgHashBinary);

        await contract.connect(alice).purchase(2, sig, {value: ethers.utils.parseEther('6')});

        expect((await contract.mintedPresale(aliceAddress)).toString()).to.eq('2');
        expect((await contract.minted(aliceAddress)).toString()).to.eq('0');
        expect((await contract.totalMinted()).toString()).to.eq('2');
        expect((await waffle.provider.getBalance(contract.address)).toString()).to.eq('5000000000000000000');
      });
      describe('reverts if', async () => {
        it('purchase amount is 0', async () => {
          await expect(contract.connect(alice).purchase(0, sig, {value: ethers.utils.parseEther('6')}))
            .to.be.revertedWith('InvalidAmount()');
        });
        it('purchase amount exceed max mint per tx', async () => {
          await expect(contract.connect(alice).purchase(4, sig, {value: ethers.utils.parseEther('6')}))
            .to.be.revertedWith('ExceedMaxMintPerTx()');
        });
        it('signature is invalid', async () => {
          await expect(contract.connect(bob).purchase(1, sig, {value: ethers.utils.parseEther('6')}))
            .to.be.revertedWith('InvalidSignature()');
        });
        it('same nonce', async () => {
          // wrong signature with the same nonce
          msgHash = ethers.utils.solidityKeccak256(
            ['uint256', 'address', 'uint256', 'address', 'uint256'],
            [CHAIN_ID, asset.address, 1, aliceAddress, 1]
          );
          msgHashBinary = ethers.utils.arrayify(msgHash);
          sig = await signer.signMessage(msgHashBinary);
          
          await expect(contract.connect(alice).purchase(1, sig, {value: ethers.utils.parseEther('6')}))
            .to.be.revertedWith('InvalidSignature()');
        }); 
        it('purchase amount exceed max mint per address', async () => {
          // signature
          msgHash = ethers.utils.solidityKeccak256(
            ['uint256', 'address', 'uint256', 'address', 'uint256'],
            [CHAIN_ID, asset.address, 2, aliceAddress, 2]
          );
          msgHashBinary = ethers.utils.arrayify(msgHash);
          sig = await signer.signMessage(msgHashBinary);
          
          await expect(contract.connect(alice).purchase(2, sig, {value: ethers.utils.parseEther('6')}))
            .to.be.revertedWith('ExceedMaxMintPerAddress()');
        }); 
        it('eth is not enough', async () => {
          // signature
          msgHash = ethers.utils.solidityKeccak256(
            ['uint256', 'address', 'uint256', 'address', 'uint256'],
            [CHAIN_ID, asset.address, 1, aliceAddress, 2]
          );
          msgHashBinary = ethers.utils.arrayify(msgHash);
          sig = await signer.signMessage(msgHashBinary);
          
          await expect(contract.connect(alice).purchase(1, sig, {value: ethers.utils.parseEther('0.2')}))
            .to.be.revertedWith('InsufficientEth()');
        });
      });
    });
    describe('sale', async () => {
      it('expect to purchase', async () => {
        // sale start
        await expect(contract.connect(operator).startSale())
          .to.emit(contract, 'LogSaleStarted').withArgs(operatorAddress);
        
        // mocks
        await asset.mock['mintBatch(address,uint256)'].withArgs(bobAddress, 2).returns();

        await contract.connect(bob).purchase(2, ethers.constants.HashZero, {value: ethers.utils.parseEther('6')});

        expect((await contract.minted(bobAddress)).toString()).to.eq('2');
        expect((await contract.mintedPresale(bobAddress)).toString()).to.eq('0');
        expect((await contract.totalMinted()).toString()).to.eq('4');
        expect((await waffle.provider.getBalance(contract.address)).toString()).to.eq('10000000000000000000');
      });
      describe('reverts if', async () => {
        it('purchase amount exceed max mint per address', async () => {
          await expect(contract.connect(bob).purchase(
            2,  
            ethers.constants.HashZero, 
            {value: ethers.utils.parseEther('6')})
          ).to.be.revertedWith('ExceedMaxMintPerAddress()');
        });
        it('exceed max mintable limit', async () => {
          await expect(contract.connect(carol).purchase(
            3, 
            ethers.constants.HashZero, 
            {value: ethers.utils.parseEther('6')})
          ).to.be.revertedWith('ExceedMaxMintable()');
        });
        it('sale is ended', async () => {
          await expect(contract.connect(operator).endSale())
            .to.emit(contract, 'LogSaleEnded').withArgs(operatorAddress);
          await expect(contract.connect(carol).purchase(
            2,  
            ethers.constants.HashZero, 
            {value: ethers.utils.parseEther('6')})
          ).to.be.revertedWith('SaleNotGoing()');
        });
      });
    });
  });  

  describe('mintUnsoldTokens()', async () => {
    it('expect to mint unsold tokens', async () => {
      // mocks
      await asset.mock['mintBatch(address,uint256)'].withArgs(carolAddress, 6).returns();

      await expect(contract.connect(operator).mintUnsoldTokens(carolAddress))
        .to.emit(contract, 'LogUnsoldTokensMinted').withArgs(carolAddress, ethers.BigNumber.from('6'));

      expect((await contract.totalMinted()).toString()).to.eq('10');
    });
    describe('reverts if', async () => {
      it('non operator call', async () => {
        await expect(contract.connect(alice).mintUnsoldTokens(carolAddress)).to.be.revertedWith('NoOperatorRole()');
      });
      it('NFT sold out', async () => {
        await expect(contract.connect(operator).mintUnsoldTokens(carolAddress)).to.be.revertedWith('NFTSoldOut()');
      });
      it('sale is not ended', async () => {
        await contract.connect(operator).startSale();
        await expect(contract.connect(operator).mintUnsoldTokens(carolAddress)).to.be.revertedWith('SaleNotEnded');
      });
    });
  });

  describe('withdrawEth()', async () => {
    it('expect to withdraw eth', async () => {
      await expect(contract.withdrawEth(carolAddress))
        .to.emit(contract, 'LogEthSent').withArgs(carolAddress, ethers.utils.parseEther('10'));
    });
    describe('reverts if', async () => {
      it('non owner call', async () => {
        await expect(contract.connect(operator).withdrawEth(carolAddress))
          .to.be.revertedWith('Ownable: caller is not the owner');
      });
      it('zero address', async () => {
        await expect(contract.withdrawEth(ethers.constants.AddressZero)).to.be.revertedWith('InvalidAddress');
      });
    });
  });
});
