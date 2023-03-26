import { ethers } from 'hardhat';
import prompts from 'prompts';

const main = async (name: string, symbol: string) => {
  const ERC20Factory = await ethers.getContractFactory(
    'ERC20PresetMinterPauser',
  );
  const token = await ERC20Factory.deploy(name, symbol);

  await token.deployed();

  console.log(`ERC20 token ${name}(${symbol}) deployed to ${token.address}`);
};

prompts([
  { type: 'text', name: 'name', message: "What's token name?" },
  { type: 'text', name: 'symbol', message: "What's token symbol?" },
])
  .then((r) => main(r.name, r.symbol))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
