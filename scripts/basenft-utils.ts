import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const {
  DEPLOYER_PRIVATE_KEY, // OWNER KEY
  ACCOUNT1,
  ACCOUNT2,
  ACCOUNT3,
} = process.env;

const owner = new ethers.Wallet(DEPLOYER_PRIVATE_KEY as string);
const account1 = new ethers.Wallet(ACCOUNT1 as string);
const account2 = new ethers.Wallet(ACCOUNT2 as string);
const account3 = new ethers.Wallet(ACCOUNT3 as string);
  
let baseNFT: Contract;
let contractAddress = '0x196dbAf7c379B57c32b61FE41e648638d7526Df4';

async function deployContract() {
  const BaseNFT = await ethers.getContractFactory('BaseNFT');

  baseNFT = await BaseNFT.deploy(
    'Infantry',
    'INFT',
    'https://api.example.com/infantry-metadata/');

  contractAddress = baseNFT.address;
  console.log('Success: contract deployed with address: ', contractAddress);
}

async function initContract() {
  const BaseNFT = await ethers.getContractFactory('BaseNFT');
  baseNFT = await BaseNFT.attach(contractAddress);
}

async function mintToken() {
  const to = owner.address;
  await baseNFT.mint(to);
  console.log('Success: minting 1 token to', to);
}

async function mintBatch() {
  await baseNFT.mintBatch([
    account1.address,
    account2.address,
    account3.address
  ]);

  console.log('Success: minting 3 tokens for 3 accounts',
    account1.address,
    account2.address,
    account3.address);
}

async function changeBaseURI() {
  await baseNFT.setBaseTokenURI(
    'https://gateway.pinata.cloud/ipfs/QmSnNTtoARVQC51nnrZLRvutB98YKhXzwDzeUJ675dD1kj/'
  );
  console.log('Change base URI successful');
  console.log('token URI', await baseNFT.tokenURI(1));
}

async function printBalances() {
  const balance0 = await baseNFT.balanceOf(owner.address);
  const balance1 = await baseNFT.balanceOf(account1.address);
  const balance2 = await baseNFT.balanceOf(account2.address);
  const balance3 = await baseNFT.balanceOf(account3.address);

  console.log('owner', owner.address, Number(balance0));
  console.log('acc 1', account1.address, Number(balance1));
  console.log('acc 2', account2.address, Number(balance2));
  console.log('acc 3', account3.address, Number(balance3));
}

async function printOwner() {
  const owner1 = await baseNFT.ownerOf(1);
  const owner2 = await baseNFT.ownerOf(2);
  const owner3 = await baseNFT.ownerOf(3);
  const owner4 = await baseNFT.ownerOf(4);

  console.log('owner 1', owner1);
  console.log('owner 2', owner2);
  console.log('owner 3', owner3);
  console.log('owner 4', owner4);
}

async function main() {
  // initContract or deployContract should be first executed
  await initContract();
  //await deployContract();

  //await mintToken();
  //await mintBatch();
  //await changeBaseURI();

  await printBalances();
  await printOwner();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
