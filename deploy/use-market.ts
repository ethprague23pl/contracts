import { ContractFactory, Provider, Wallet, utils } from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployAAFactory, deployAccount } from './utils/deploy';
import { sendTx } from './utils/sendTX';
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
  const randomWallet = Wallet.createRandom();
  const newWallet = new Wallet(randomWallet.privateKey, provider);

  console.log(`Empty wallet's address: ${randomWallet.address}`);
  console.log(`Empty wallet's private key: ${randomWallet.privateKey}`);

  // Deploying the Event
  const eventArtifact = await deployer1.loadArtifact('Event');
  const event = await deployer1.deploy(eventArtifact, [100, 0]);
  console.log(`Event address: ${event.address}`);

  const factory = await deployAAFactory(wallet);
  console.log('Factory address:', factory.address);

  const account = await deployAccount(wallet, randomWallet, factory.address);
  console.log('AAccount address:', account.address);

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
      value: ethers.utils.parseEther('0.005'),
    })
  ).wait();

  // Setting the dAPIs in Paymaster. Head over to the API3 Market (https://market.api3.org)
  // to verify dAPI proxy contract addresses and whether they're funded or not.
  const ETHUSDdAPI = '0x28ce555ee7a3daCdC305951974FcbA59F5BdF09b';
  const USDCUSDdAPI = '0x946E3232Cc18E812895A8e83CaE3d0caA241C2AB';
  const setProxy = paymaster.setDapiProxy(USDCUSDdAPI, ETHUSDdAPI);
  await (await setProxy).wait();
  console.log('dAPI Proxies Set!');

  // Supplying the ERC20 tokens to the empty wallet:
  // We will give the empty wallet 5k mUSDC:
  await (
    await erc20.mint(randomWallet.address, '500000000000000000000000')
  ).wait();

  console.log('Minted 50k mUSDC for the empty wallet');

  const erc20Balance = await erc20.balanceOf(randomWallet.address);
  console.log(`ERC20 balance of the user before tx: ${erc20Balance}`);

  const PaymasterFactory = new ContractFactory(
    paymasterArtifact.abi,
    paymasterArtifact.bytecode,
    deployer1.zkWallet,
  );
  const PaymasterContract = PaymasterFactory.attach(paymaster.address);

  const newEvent = await getEvent(hre, newWallet, event.address);

  // Estimate gas fee for the transaction
  const gasLimit = await newEvent.estimateGas.buy(1, {
    value: ethers.utils.parseEther('0'),
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams: utils.getPaymasterParams(paymaster.address, {
        type: 'ApprovalBased',
        token: erc20.address,
        // Set a large allowance just for estimation
        minimalAllowance: ethers.BigNumber.from(`100000000000000000000`),
        // Empty bytes as testnet paymaster does not use innerInput
        innerInput: new Uint8Array(),
      }),
    },
  });

  console.log(gasLimit);
  const gasPrice = await provider.getGasPrice();

  // Gas estimation:
  const fee = gasPrice.mul(gasLimit.toString());
  console.log(`Estimated ETH FEE (gasPrice * gasLimit): ${fee}`);

  // Calling the dAPI to get the ETH price:
  const ETHUSD = await PaymasterContract.readDapi(
    '0x28ce555ee7a3daCdC305951974FcbA59F5BdF09b',
  );
  const USDCUSD = await PaymasterContract.readDapi(
    '0x946E3232Cc18E812895A8e83CaE3d0caA241C2AB',
  );

  // Checks old allowance (for testing purposes):
  const checkSetAllowance = await erc20.allowance(
    randomWallet.address,
    paymaster.address,
  );
  console.log(`ERC20 allowance for paymaster : ${checkSetAllowance}`);

  console.log(`ETH/USD dAPI Value: ${ETHUSD}`);
  console.log(`USDC/USD dAPI Value: ${USDCUSD}`);

  // Calculating the USD fee:
  const usdFee = fee.mul(ETHUSD).div(USDCUSD);
  console.log(`Estimated USD FEE: ${usdFee}`);

  console.log(`Current name is: ${await event.getName()}`);

  // Encoding the "ApprovalBased" paymaster flow's input
  const paymasterParams = utils.getPaymasterParams(paymaster.address, {
    type: 'ApprovalBased',
    token: erc20.address,
    // set minimalAllowance to the estimated fee in erc20
    minimalAllowance: ethers.BigNumber.from(usdFee),
    // empty bytes as testnet paymaster does not use innerInput
    innerInput: new Uint8Array(),
  });

  console.log(paymasterParams);

  await (
    await event.connect(newWallet).buy(1, {
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

  const newErc20Balance = await erc20.balanceOf(randomWallet.address);

  console.log(`ERC20 Balance of the user after tx: ${newErc20Balance}`);
  console.log(
    `Transaction fee paid in ERC20 was ${erc20Balance.sub(newErc20Balance)}`,
  );
  console.log(
    `Minted now by randomWallet address is: ${await event.numberMinted(
      randomWallet.address,
    )}`,
  );
}
