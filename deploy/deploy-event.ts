import { Wallet } from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

export default async function deployEvent(hre: HardhatRuntimeEnvironment) {
  const RICH_WALLET_PK = process.env.PRIVATE_KEY;

  // Private key of the account used to deploy
  const wallet = new Wallet(RICH_WALLET_PK!);
  const deployer = new Deployer(hre, wallet);
  const eventArtifact = await deployer.loadArtifact('Event');

  const event = await deployer.deploy(eventArtifact, [100, 0], {
    gasLimit: ethers.utils.hexlify(10000000),
  });

  console.log(`Event address: ${event.address}`);

  return event;
}
