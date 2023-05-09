import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

const { SIGNER_ADDRESS } = process.env;

async function main() {
  const GamePortal = await ethers.getContractFactory('GamePortal');
  const gamePortal = await GamePortal.deploy(SIGNER_ADDRESS);

  console.log('GamePortal contract deployed to:', gamePortal.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
