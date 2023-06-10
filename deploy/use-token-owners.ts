/* eslint-disable @typescript-eslint/no-var-requires */
import { ContractFactory, Provider, Wallet, utils } from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

require('dotenv').config();

const WALLET =
  process.env.NODE_ENV === 'test'
    ? '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110'
    : process.env.PRIVATE_KEY;

function getEvent(
  hre: HardhatRuntimeEnvironment,
  wallet: Wallet,
  eventAddress: string,
) {
  const artifact = hre.artifacts.readArtifactSync('Event');
  return new ethers.Contract(eventAddress, artifact.abi, wallet);
}

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider('https://testnet.era.zksync.dev');
  // const provider = new Provider("http://localhost:3050/");

  const wallet = new Wallet(
    '0x78d6f2e70fe59a0e7f48ceb6b606d5973225b0f97c5ba8aadefcbaf59e429c59',
    provider,
  );
  const deployer1 = new Deployer(hre, wallet);

  const eventArtifact = await deployer1.loadArtifact('Event');
  const event = new ethers.Contract(
    '0xf1062fA2fBA3C7628602836118Db8caEa9851053',
    eventArtifact.abi,
    wallet,
  );

  console.log(`Tokens of owner: ${await event.tokensOfOwner(wallet.address)}`);
}
