import { HardhatUserConfig } from 'hardhat/types';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';

import * as dotenv from 'dotenv';
dotenv.config();

const {
  DEPLOYER_PRIVATE_KEY,
  INFURA_PROJECT_ID,
  ALCHEMY_PROJECT_ID,
  ETHERSCAN_API_KEY,
} = process.env;

const accounts = DEPLOYER_PRIVATE_KEY ? [`0x${DEPLOYER_PRIVATE_KEY}`] : [];

const config: HardhatUserConfig = {
  networks: {
    hardhat: {},
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts,
    },
    polygon_mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_PROJECT_ID}`,
      accounts,
    },
  },
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 100
      }
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  }
};

export default config;
