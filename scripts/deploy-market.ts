import { ethers, upgrades } from 'hardhat';

const main = async (): Promise<void> => {
  const factory = await ethers.getContractFactory('Market');
  const token = await upgrades.deployProxy(factory).then((i) => i.deployed());

  console.log(`Market deployed to ${token.address}`);
};

main()
  .then(() => console.log('Market is deployed'))
  .catch((error) => console.error(error));
