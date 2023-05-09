import { ethers } from 'hardhat';

async function main() {
  const Asset = await ethers.getContractFactory('Asset');
  const asset = await Asset.deploy('Generic ERC721', 'ASSET', 'https://api.example.com/metadata/', 0);

  console.log('Asset contract deployed to:', asset.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
