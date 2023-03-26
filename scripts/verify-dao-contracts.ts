import { run } from 'hardhat';

const verify = async (contractAddress: string, args: any[]) => {
  try {
    await run('verify:verify', {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (error) {
    console.error(error);
  }
};

const main = async () => {
  // Mock USDT token
  await verify('0x539b63ec732C2BBE71105C7E84748b0Ad458dF14', [
    'Tether',
    'USDT',
  ]);
  // Market
  await verify('0x2F4062C7746EF3f1A806dE29C3375C1D2714b303', [
    '0x84Db632cC873c176BBc46591c6665dE5B674E5bA', // WDR token
  ]);
  // Task manager
  await verify('0x76838BBd7ABCddA9C50324Fa4AdCb798a6a8d934', []);
  // WDR token
  await verify('0x84Db632cC873c176BBc46591c6665dE5B674E5bA', []);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
