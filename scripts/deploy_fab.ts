import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

const { BRIDGE_ADDRESS } = process.env;

async function main() {
  const FAB = await ethers.getContractFactory('FAB');
  const fab = await FAB.deploy(BRIDGE_ADDRESS);

  console.log('FAB contract deployed to:', fab.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
