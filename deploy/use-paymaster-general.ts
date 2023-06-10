import { ContractFactory, Provider, Wallet, utils } from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployAAFactory, deployAccount } from './utils/deploy';
import { sendTx } from './utils/sendTX';
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

  const wallet = new Wallet(WALLET!, provider);
  const deployer1 = new Deployer(hre, wallet);
  const randomWallet = Wallet.createRandom().connect(provider);

  console.log(`Empty wallet's address: ${randomWallet.address}`);
  console.log(`Empty wallet's private key: ${randomWallet.privateKey}`);

  // Deploying the Event
  const eventArtifact = await deployer1.loadArtifact('Event');
  const event = await deployer1.deploy(eventArtifact, [100, 0, 0]);
  console.log(`Event address: ${event.address}`);

  // Deploying the ERC20 token
  const erc20Artifact = await deployer1.loadArtifact('USDCMOCK');
  const erc20 = await deployer1.deploy(erc20Artifact, ['USDC', 'USDC', 18]);
  console.log(`ERC20 address: ${erc20.address}`);

  // Deploying the paymaster
  const paymasterArtifact = await deployer1.loadArtifact('NewPaymaster');
  const paymaster = await deployer1.deploy(paymasterArtifact, [erc20.address]);
  console.log(`Paymaster address: ${paymaster.address}`);

  // Supplying paymaster with ETH.
  await (
    await deployer1.zkWallet.sendTransaction({
      to: paymaster.address,
      value: ethers.utils.parseEther('0.005'),
    })
  ).wait();

  console.log('Paymaster funded with 0.005 ETH');

  const paymasterParams = utils.getPaymasterParams(paymaster.address, {
    type: 'General',
    innerInput: new Uint8Array(),
  });

  const userEvent = getEvent(hre, randomWallet, event.address);

  // Estimate gas fee for the transaction
  const gasLimit = await userEvent.estimateGas.buy(1, {
    value: ethers.utils.parseEther('0'),
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams: paymasterParams,
    },
  });

  console.log('Gas Limit:', gasLimit);
  const gasPrice = await provider.getGasPrice();

  // Gas estimation:
  const fee = gasPrice.mul(gasLimit.toString());
  console.log(`Estimated ETH FEE (gasPrice * gasLimit): ${fee}`);

  console.log(paymasterParams);

  await (
    await userEvent.connect(randomWallet).buy(1, {
      // specify gas values
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: 0,
      gasLimit: gasLimit,
      // paymaster info
      value: ethers.utils.parseEther('0'),
      customData: {
        paymasterParams: paymasterParams,
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      },
    })
  ).wait();

  console.log(
    `Minted now by randomWallet address is: ${await event.numberMinted(
      randomWallet.address,
    )}`,
  );
}
