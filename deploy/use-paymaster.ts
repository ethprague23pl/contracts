import { Provider, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deployAAFactory, deployAccount } from "./utils/deploy";
import {sendTx} from './utils/sendTX';

require("dotenv").config();

// Put the address of the deployed paymaster and the Greeter Contract in the .env file
const PAYMASTER_ADDRESS = "0x2B3c9020E658d8b20F3ea46568b0c6Cb596C49E7";
const EVENT_CONTRACT_ADDRESS = "0xfea4495f2541411B4460c69142cD63Cb0CB1A5Bc";
const AA_FACTORY_ADDRESS_LIVE = '0x50BFb217F72A4e00a65040d64120002C7798A393';

const WALLET = process.env.PRIVATE_KEY;

function getEvent(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
  const artifact = hre.artifacts.readArtifactSync("Event");
  return new ethers.Contract(EVENT_CONTRACT_ADDRESS, artifact.abi, wallet);
}

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://zksync2-testnet.zksync.dev");
  const wallet = new Wallet(WALLET!, provider);

  const event = getEvent(hre, wallet);
  const randomWallet = Wallet.createRandom();

  // const factory = await deployAAFactory(wallet);
  // console.log('factory')
  const account = await deployAccount(wallet, randomWallet, AA_FACTORY_ADDRESS_LIVE);
  console.log('account', account.address)

  await(await wallet.sendTransaction({
    to: account.address,
    value: ethers.utils.parseEther('0.005')
  })).wait();

  let tx = await event.populateTransaction.buy(1, {
    value: ethers.utils.parseEther('0')
  });

  console.log(tx);

  const resp = await sendTx(provider, account, randomWallet, tx);
  await resp.wait();

  // let ownerOf = await event.populateTransaction.balanceOf(account.address, {
  //     value: ethers.utils.parseEther('0')
  //   });


  // const ownerOfResp = await sendTx(provider, account, randomWallet, ownerOf);
  // const conf = await ownerOfResp.wait();
  // console.log(conf);

  // tx = {
  //   ...tx,
  //   from: account.address,
  //   to: EVENT_CONTRACT_ADDRESS,
  //   value: ethers.utils.parseEther("0"),
  //   chainId: (await provider.getNetwork()).chainId,
  //   nonce: await provider.getTransactionCount(account.address),
  //   type: 113,
  //   gasPrice: await provider.getGasPrice(),
  //   gasLimit: ethers.BigNumber.from(1000000),
  //   customData: {
  //     gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
  //   } as types.Eip712Meta
  // };

  // const signedTxHash = EIP712Signer.getSignedDigest(tx);
  // const signature = ethers.utils.arrayify(
  //   ethers.utils.joinSignature(wallet._signingKey().signDigest(signedTxHash))
  // );

  // tx.customData = {
  //   ...tx.customData,
  //   customSignature: signature,
  // };

  // console.log("Request", tx)

  // const resp = await provider.sendTransaction(utils.serialize(tx));

  // resp.wait();

  // console.log("response:", resp)

  // const gasPrice = await provider.getGasPrice();

  // // Loading the Paymaster Contract
  // const deployer = new Deployer(hre, wallet);
  // const paymasterArtifact = await deployer.loadArtifact("Paymaster");
  
  // const PaymasterFactory = new ContractFactory(
  //   paymasterArtifact.abi,
  //   paymasterArtifact.bytecode,
  //   deployer.zkWallet
  // );
  // const PaymasterContract = PaymasterFactory.attach(PAYMASTER_ADDRESS);

  // // Estimate gas fee for the transaction
  // const gasLimit = await event.estimateGas.buy(
  //   1,
  //   {
  //     // customData: {
  //     //   gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
  //     //   paymasterParams: utils.getPaymasterParams(PAYMASTER_ADDRESS, {
  //     //     type: "ApprovalBased",
  //     //     token: TOKEN_ADDRESS,
  //     //     // Set a large allowance just for estimation
  //     //     minimalAllowance: ethers.BigNumber.from(`100000000000000000000`),
  //     //     // Empty bytes as testnet paymaster does not use innerInput
  //     //     innerInput: new Uint8Array(),
  //     //   }),
  //     // },
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

  // console.log(gasLimit)

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
