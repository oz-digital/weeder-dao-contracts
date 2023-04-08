import { run } from 'hardhat';

const verify = async (contractAddress: string, args: any[]): Promise<void> =>
  run('verify:verify', {
    address: contractAddress,
    constructorArguments: args,
  });

const main = async (): Promise<void> => {
  await verify('0xa42C2152bDA5fD130fB2B0098dC21Ee35d20D2f9', []);
  await verify('0xE11702CF04621D395E75680C29d3dbF81484e875', []);
};

main()
  .then(() => console.log('Contracts are verified on polygonscan'))
  .catch((error) => console.error(error));
