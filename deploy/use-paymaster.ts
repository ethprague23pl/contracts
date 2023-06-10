import { Provider, Wallet, utils } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deployAAFactory, deployAccount } from "./utils/deploy";
import {sendTx} from './utils/sendTX';
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

require("dotenv").config();

// Put the address of the deployed paymaster and the Greeter Contract in the .env file
const PAYMASTER_ADDRESS = "0xE21a69457F71b25E42E0EFcEC9007b3AC99213E9";
const EVENT_CONTRACT_ADDRESS = "0xf7540AfbaF8524d64Be38BAb83B2fDB0a8a1A704";
const AA_FACTORY_ADDRESS_LIVE = '0xf697da1ee9FbC53e53438F5722a094f7EcB9328d';
const USDC_MOCK_ADDRESS = '0x44506EB966EF8c03F8618ecc4eCA3FD50e628a23'

const WALLET = process.env.PRIVATE_KEY;

function getEvent(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
  const artifact = hre.artifacts.readArtifactSync("Event");
  return new ethers.Contract(EVENT_CONTRACT_ADDRESS, artifact.abi, wallet);
}

function getPaymaster(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
  const artifact = hre.artifacts.readArtifactSync("Paymaster");
  return new ethers.Contract(PAYMASTER_ADDRESS, artifact.abi, wallet);
}

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://zksync2-testnet.zksync.dev");
  const wallet = new Wallet(WALLET!, provider);
  const deployer = new Deployer(hre, wallet);
  const randomWallet = Wallet.createRandom();

  // Deploying the Event
  const eventArtifact = await deployer.loadArtifact("Event");
  const event = await deployer.deploy(eventArtifact, [100, 0]);
  console.log(`Event address: ${event.address}`);

  const factory = await deployAAFactory(wallet);
  console.log('Factory address:', factory.address)

  const account = await deployAccount(wallet, randomWallet, factory.address);
  console.log('AAccount address:', account.address)

  // INFO: SEND TX TO ACCOUNT ABSTRACTION
  await(await wallet.sendTransaction({
    to: account.address,
    value: ethers.utils.parseEther('0.0005')
  })).wait();

  let tx = await event.populateTransaction.buy(1, {
    value: ethers.utils.parseEther('0')
  });

  console.log(tx);

  const resp = await sendTx(provider, account, randomWallet, tx);
  await resp.wait();

  // INFO: NUMBER MINTED!!!!
  // const numberMintedTx = await event.populateTransaction.numberMinted(account.address)

  // const respMinted = await sendTx(provider, account, randomWallet, numberMintedTx);
  // const r = await respMinted.wait();
  // console.log(r)

  

  // // Deploying the ERC20 token
  // const erc20Artifact = await deployer.loadArtifact("MyERC20");
  // const erc20 = await deployer.deploy(erc20Artifact, ["USDC", "USDC", 18]);
  // console.log(`ERC20 address: ${erc20.address}`);

  // // Deploying the paymaster
  // const paymasterArtifact = await deployer.loadArtifact("NewPaymaster");
  // const paymaster = await deployer.deploy(paymasterArtifact, [erc20.address]);
  // console.log(`Paymaster address: ${paymaster.address}`);

  //  // Supplying paymaster with ETH.
  //  await (
  //   await deployer.zkWallet.sendTransaction({
  //     to: paymaster.address,
  //     value: ethers.utils.parseEther("0.05"),
  //   })
  // ).wait();

  // // Setting the dAPIs in Paymaster. Head over to the API3 Market (https://market.api3.org) 
  // // to verify dAPI proxy contract addresses and whether they're funded or not.
  // const ETHUSDdAPI = "0x28ce555ee7a3daCdC305951974FcbA59F5BdF09b";
  // const USDCUSDdAPI = "0x946E3232Cc18E812895A8e83CaE3d0caA241C2AB";
  // const setProxy = paymaster.setDapiProxy(USDCUSDdAPI, ETHUSDdAPI)
  // await (await setProxy).wait()
  // console.log("dAPI Proxies Set!")

  // // Estimate gas fee for the transaction
  // const gasLimit = await event.estimateGas.buy(
  //   1,
  //   {
  //     value: ethers.utils.parseEther('0'),
  //     customData: {
  //       gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
  //       paymasterParams: utils.getPaymasterParams(PAYMASTER_ADDRESS, {
  //         type: "ApprovalBased",
  //         token: EVENT_CONTRACT_ADDRESS,
  //         minimalAllowance: ethers.BigNumber.from(`100000000000000000000`),
  //         // Empty bytes as testnet paymaster does not use innerInput
  //         innerInput: new Uint8Array(),
  //       }),
  //     },
  //   }
  // );

  // console.log(gasLimit);
  
  // const gasPrice = await provider.getGasPrice();

  //  // Gas estimation:
  //  const fee = gasPrice.mul(gasLimit.toString());
  //  console.log(`Estimated ETH FEE (gasPrice * gasLimit): ${fee}`);

  // // Gas estimation:
  // const fee = gasPrice.mul(gasLimit.toString());
  // console.log(`Estimated ETH FEE (gasPrice * gasLimit): ${fee}`);

  // // Encoding the "ApprovalBased" paymaster flow's input
  // const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
  //   type: "ApprovalBased",
  //   token: EVENT_CONTRACT_ADDRESS,
  //   minimalAllowance: ethers.BigNumber.from(`100000000000000000000`),
  //   innerInput: new Uint8Array(),
  // });

  // await (
  //   await event
  //     .connect(emptyWallet)
  //     .mint(1, {
  //       // specify gas values
  //       maxFeePerGas: gasPrice,
  //       maxPriorityFeePerGas: 0,
  //       gasLimit: gasLimit,
  //       // paymaster info
  //       customData: {
  //         paymasterParams: paymasterParams,
  //         gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
  //       },
  //     })
  // ).wait();

  // const res = await provider.getBalance(emptyWallet.address);

  // console.log(`ETH Balance of the user after tx: ${res}`);
  // console.log(`Message in contract now is: ${await event.ownerOf(emptyWallet.address)}`);
}
