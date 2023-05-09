import { ethers } from 'hardhat';

async function main() {
  const Sale = await ethers.getContractFactory('Sale');
  const sale = await Sale.deploy(
    '0x1C05D32C85aD201369eEb74C11cE2d4357E3753C',
    '0xc4d58cf543045fd55b9e8e89e884b6b2c76d4a02',
    1000000
  );

  console.log('Sale contract deployed to:', sale.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
