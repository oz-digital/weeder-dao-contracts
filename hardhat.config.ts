// plugins for hardhat
import 'hardhat-dependency-compiler';
import '@openzeppelin/hardhat-upgrades';
import '@nomiclabs/hardhat-etherscan';
import '@nomicfoundation/hardhat-toolbox';

import { HardhatUserConfig } from 'hardhat/config';
import * as dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.18',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  dependencyCompiler: {
    paths: [
      '@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol',
    ],
  },
  defaultNetwork: 'polygon_mumbai',
  networks: {
    hardhat: {},
    polygon_mumbai: {
      url: process.env.POLYGON_MUMBAI_RPC_URL,
      accounts: [
        process.env.PRIVATE_KEY!,
        process.env.PRIVATE_KEY_1!,
        process.env.PRIVATE_KEY_2!,
        process.env.PRIVATE_KEY_3!,
        process.env.PRIVATE_KEY_4!,
      ],
      gasPrice: 3000000000,
    },
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },
};

export default config;
