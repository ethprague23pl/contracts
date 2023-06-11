/* eslint-disable @typescript-eslint/no-var-requires */
import { ContractFactory, Provider, Wallet, utils } from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

require('dotenv').config();

const WALLET = process.env.PRIVATE_KEY;

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
  const event = await deployer1.deploy(eventArtifact, [
    4,
    0,
    0,
    '0x7720f64Dd997c6b540B8cf52704917fcBB359EE5',
  ]);
  console.log(`Event address: ${event.address}`);

  const marketArtifact = await deployer1.loadArtifact('Market');
  const market = await deployer1.deploy(marketArtifact);
  console.log(`Market address: ${market.address}`);

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
      value: ethers.utils.parseEther('0.0005'),
    })
  ).wait();

  console.log('Paymaster funded with 0.0005 ETH');

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

  //   console.log(paymasterParams);

  await (
    await userEvent.connect(randomWallet).buy(2, {
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

  const tokens = await event.tokensOfOwner(randomWallet.address);
  console.log(`Minted now by randomWallet address is: `, tokens[0]);

  await (
    await userEvent.connect(wallet).setMaxSellPrice(10, {
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

  console.log('max sell price');

  const prices = await userEvent.connect(wallet).getTicketPrices({
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
  });

  console.log('maxPrice', prices[1]);

  await (
    await userEvent.connect(randomWallet).approve(market.address, 1, {
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
  console.log('approvedddd');
  await (
    await market.connect(randomWallet).listItem(event.address, 1, 20, {
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
  console.log('gdljklgdakljgadjlkagkl');

  const resp = await market.connect(randomWallet).getListing(event.address, 1, {
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
  });

  console.log('response', resp);
  console.log(
    'main wallet before buy',
    (await wallet.getBalance()).toHexString(),
  );

  await (
    await market.connect(wallet).buyItem(event.address, 1, {
      // specify gas values
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: 0,
      gasLimit: gasLimit,
      // paymaster info
      value: ethers.utils.parseEther('0.00000000000000002'),
      customData: {
        paymasterParams: paymasterParams,
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      },
    })
  ).wait();
  console.log('balance after buy', await event.tokensOfOwner(wallet.address));

  await (
    await market.connect(randomWallet).withdrawProceeds({
      // specify gas values
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: 0,
      gasLimit: gasLimit,
      // paymaster info
      //   value: ethers.utils.parseEther('0.00000000000000002'),
      customData: {
        paymasterParams: paymasterParams,
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      },
    })
  ).wait();

  console.log(
    'balance after withdraw',
    (await randomWallet.getBalance()).toHexString(),
  );
  console.log(
    'main wallet after withdraw',
    (await wallet.getBalance()).toHexString(),
  );
}
