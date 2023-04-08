import { ethers } from 'hardhat';
import prompts from 'prompts';

const main = async (name: string, symbol: string): Promise<void> => {
  const factory = await ethers.getContractFactory('ERC20PresetMinterPauser');
  const token = await factory.deploy(name, symbol).then((i) => i.deployed());

  console.log(`ERC20 token ${name}(${symbol}) deployed to ${token.address}`);
};

prompts([
  { type: 'text', name: 'name', message: "What's token name?" },
  { type: 'text', name: 'symbol', message: "What's token symbol?" },
])
  .then((r) => main(r.name, r.symbol))
  .then(() => console.log('ERC20 token is deployed'))
  .catch((error) => console.error(error));
