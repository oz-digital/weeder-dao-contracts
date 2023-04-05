import { ethers, upgrades } from 'hardhat';

const main = async () => {
  const factory = await ethers.getContractFactory('WeederToken');
  const token = await upgrades.deployProxy(factory).then((i) => i.deployed());

  console.log(`Weeder Digital Token (WDR) deployed to ${token.address}`);
};

main()
  .then(() => console.log('Weeder token is deployed'))
  .catch((error) => console.error(error));
