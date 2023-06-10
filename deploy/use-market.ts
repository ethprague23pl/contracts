import { ContractFactory, Provider, Wallet, utils } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deployAAFactory, deployAccount } from "./utils/deploy";
import {sendTx} from './utils/sendTX';
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

require("dotenv").config();

// Put the address of the deployed paymaster and the Greeter Contract in the .env file
// const PAYMASTER_ADDRESS = "0xE21a69457F71b25E42E0EFcEC9007b3AC99213E9";
// const EVENT_CONTRACT_ADDRESS = "0xf7540AfbaF8524d64Be38BAb83B2fDB0a8a1A704";
// const AA_FACTORY_ADDRESS_LIVE = '0xf697da1ee9FbC53e53438F5722a094f7EcB9328d';
// const USDC_MOCK_ADDRESS = '0x44506EB966EF8c03F8618ecc4eCA3FD50e628a23'

const WALLET ='0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

// function getEvent(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
//   const artifact = hre.artifacts.readArtifactSync("Event");
//   return new ethers.Contract(EVENT_CONTRACT_ADDRESS, artifact.abi, wallet);
// }

// function getPaymaster(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
//   const artifact = hre.artifacts.readArtifactSync("Paymaster");
//   return new ethers.Contract(PAYMASTER_ADDRESS, artifact.abi, wallet);
// }

export default async function (hre: HardhatRuntimeEnvironment) {
  // const provider = new Provider("https://zksync2-testnet.zksync.dev");
  const provider = new Provider("http://localhost:3050/");
  const wallet = new Wallet(WALLET!, provider);
//   const randWallet = Wallet.createRandom();
  const deployer1 = new Deployer(hre, wallet);
  const randomWallet = Wallet.createRandom();
  // Loading the Paymaster Contract
  const deployer = new Deployer(hre, randomWallet);

  console.log(`Empty wallet's address: ${randomWallet.address}`);
  console.log(`Empty wallet's private key: ${randomWallet.privateKey}`);

  // Deploying the Event
  const eventArtifact = await deployer1.loadArtifact("Event");
  const marketArtifact = await deployer1.loadArtifact("Market");

  console.log("walletBalance", await wallet.getBalance())

  const event = await deployer1.deploy(eventArtifact, [100, 0]);
  const market = await deployer1.deploy(marketArtifact);
  console.log(`Event address: ${event.address}`);
  console.log(`Market address: ${market.address}`);

  const factory = await deployAAFactory(wallet);
  console.log('Factory address:', factory.address)

const account = await deployAccount(wallet, randomWallet, factory.address);
//   console.log('AAccount address:', account.address)

    //   console.log(gasLimit2.toBigInt())
   // // INFO: SEND TX TO ACCOUNT ABSTRACTION
   const test = (await wallet.populateTransaction({
    to: account.address,
    value: ethers.utils.parseEther('200'),
    gasLimit: ethers.BigNumber.from(10000000),
    // type: 113
  }));

  const resp = await(await wallet.sendTransaction(test)).wait()
//   console.log("sfafas", resp)

  let buyTx = await event.populateTransaction.buy(1, {
    value: ethers.utils.parseEther('2')
  })

  console.log("adgadgadgad", buyTx)

  const buyResp = await sendTx(provider, account, wallet, buyTx )

  console.log("adgadgadgad")

  await buyResp.wait();

  console.log("Dispaly test")







 

  // let tx = await event.populateTransaction.buy(1, {
  //   value: ethers.utils.parseEther('0')
  // });

  // console.log(tx);

  // const resp = await sendTx(provider, account, randomWallet, tx);
  // await resp.wait();

  // // INFO: NUMBER MINTED!!!!
  // const numberMintedTx = await event.populateTransaction.numberMinted(account.address)

  // const respMinted = await sendTx(provider, account, randomWallet, numberMintedTx);
  // const r = await respMinted.wait();
  // console.log(r)


  // Deploying the paymaster
//   const paymasterArtifact = await deployer1.loadArtifact("NewPaymaster");
//   const paymaster = await deployer1.deploy(paymasterArtifact, [erc20.address]);
//   console.log(`Paymaster address: ${paymaster.address}`);

   // Supplying paymaster with ETH.
//    await (
//     await deployer1.zkWallet.sendTransaction({
//       to: paymaster.address,
//       value: ethers.utils.parseEther("0.5"),
//     })
//   ).wait();

  // Setting the dAPIs in Paymaster. Head over to the API3 Market (https://market.api3.org) 
  // to verify dAPI proxy contract addresses and whether they're funded or not.
//   const ETHUSDdAPI = "0x28ce555ee7a3daCdC305951974FcbA59F5BdF09b";
//   const USDCUSDdAPI = "0x946E3232Cc18E812895A8e83CaE3d0caA241C2AB";
//   const setProxy = paymaster.setDapiProxy(USDCUSDdAPI, ETHUSDdAPI)
//   await (await setProxy).wait()
//   console.log("dAPI Proxies Set!");

    // Supplying the ERC20 tokens to the empty wallet:
    // await // We will give the empty wallet 5k mUSDC:
    // (await erc20.mint(randomWallet.address, "5000000000000000000000")).wait();
  
    console.log("Minted 5k mUSDC for the empty wallet");

    // FIXME: Broken
    // const erc20Balance = await randomWallet.getBalance(erc20.address);
    // console.log(`ERC20 balance of the user before tx: ${erc20Balance}`);
  
    // const PaymasterFactory = new ContractFactory(
    //   paymasterArtifact.abi,
    //   paymasterArtifact.bytecode,
    //   deployer.zkWallet
    // );
    // const PaymasterContract = PaymasterFactory.attach(paymaster.address);

  //   // Estimate gas fee for the transaction
  // const gasLimit = await event.estimateGas.buy(
  //   1,
  //   {
  //     customData: {
  //       gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
  //       paymasterParams: utils.getPaymasterParams(paymaster.address, {
  //         type: "ApprovalBased",
  //         token: erc20.address,
  //         // Set a large allowance just for estimation
  //         minimalAllowance: ethers.BigNumber.from(`100000000000000000000`),
  //         // Empty bytes as testnet paymaster does not use innerInput
  //         innerInput: new Uint8Array(),
  //       }),
  //     },
  //   }
  // );

  // console.log(gasLimit);
  const gasPrice = await provider.getGasPrice();

    // Gas estimation:
    // const fee = gasPrice.mul(gasLimit.toString());
    // console.log(`Estimated ETH FEE (gasPrice * gasLimit): ${fee}`);
  
    // Calling the dAPI to get the ETH price:
    // const ETHUSD = await PaymasterContract.readDapi(
    //   "0x28ce555ee7a3daCdC305951974FcbA59F5BdF09b"
    // );
    // const USDCUSD = await PaymasterContract.readDapi(
    //   "0x946E3232Cc18E812895A8e83CaE3d0caA241C2AB"
    // );

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
