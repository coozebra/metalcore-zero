import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract, Wallet } from 'ethers';

describe('Distributor', () => {
  // ------------ skipping for now -------------- //

  // let distributor: Contract, asset: Contract;
  // const walletArray: Wallet[] = [];

  // before(async () => {
  //   for (let i = 0; i < 250; i++) {
  //     walletArray.push(Wallet.createRandom());
  //   }

  //   const Distributor = await ethers.getContractFactory('Distributor');
  //   distributor = await Distributor.deploy();
  //   const Asset = await ethers.getContractFactory('Asset');
  //   asset = await Asset.deploy('Asset', 'Asset', 'ipfs://dummy');
  // });

  // describe('mint ERC721 assets in batches and assign them to Distributor', async () => {

  //   before(async () => {
  //     await asset.mintBatch(distributor.address, 250, { gasLimit: 30000000 });
  //     await distributor.setERC721Acceptance(asset.address, true);
  //   });

  //   it('check that there are 250 tokens minted', async () => {
  //     expect(Number(await asset.totalSupply())).to.be.equal(250);
  //   });

  //   it('accept asset contract', async () => {
  //     expect(await distributor.acceptedERC721s(asset.address)).to.be.true;
  //   });

  //   it('balance of Distributor is 250', async () => {
  //     expect(Number(await asset.balanceOf(distributor.address))).to.be.equal(250);
  //   });

  //   it('send the tokens to each wallet', async () => {
  //     const tokenIds = Array.from(Array(250).keys()).map(x => x + 1);
  //     const newAddresses = walletArray.slice(0, 250).map(wallet => wallet.address);

  //     await distributor.withdrawBatch(asset.address, tokenIds, newAddresses);

  //     expect(Number(await asset.balanceOf(distributor.address))).to.be.equal(0);
  //     for (const wallet of walletArray) {
  //       expect(Number(await asset.balanceOf(wallet.address))).to.be.equal(1);
  //     }
  //   });
  // });
});
