import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';

dotenv.config();

const { BRIDGE_ADDRESS } = process.env;

async function main() {
  const MGT = await ethers.getContractFactory('MGT');
  const mgt = await MGT.deploy(BRIDGE_ADDRESS);

  console.log('MGT contract deployed to:', mgt.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
