import { ethers } from 'hardhat';

async function main() {
  const Distributor = await ethers.getContractFactory('Distributor');
  const distributor = await Distributor.deploy();

  console.log('Distributor contract deployed to:', distributor.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
