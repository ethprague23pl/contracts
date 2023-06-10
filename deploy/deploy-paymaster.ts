import { Wallet } from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

require('dotenv').config();

export default async function (hre: HardhatRuntimeEnvironment) {
  const wallet = new Wallet(process.env.PRIVATE_KEY!);
  const deployer = new Deployer(hre, wallet);

  // // Deploying the paymaster
  const paymasterArtifact = await deployer.loadArtifact('Paymaster');
  const paymaster = await deployer.deploy(paymasterArtifact, [
    '0xf7540AfbaF8524d64Be38BAb83B2fDB0a8a1A704',
  ]);
  console.log(`Paymaster address: ${paymaster.address}`);

  await (
    await deployer.zkWallet.sendTransaction({
      to: paymaster.address,
      value: ethers.utils.parseEther('0.005'),
    })
  ).wait();

  console.log(`Done!`);
}
