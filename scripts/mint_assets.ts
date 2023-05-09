import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
dotenv.config();

const { ASSET_ADDRESS, DISTRIBUTOR_ADDRESS } = process.env;

async function main() {

  const Asset = await ethers.getContractFactory('Asset');
  const asset = await Asset.attach(ASSET_ADDRESS as string);

  for (let i = 0; i < 10; i++) {
    console.log('Minting 250 new assets');
    await asset.mintBatch(DISTRIBUTOR_ADDRESS as string, 250);
  }

  console.log(Number(await asset.totalSupply()));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
