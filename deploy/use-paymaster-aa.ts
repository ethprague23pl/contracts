import {
  ContractFactory,
  EIP712Signer,
  Provider,
  types,
  utils,
  Wallet,
} from 'zksync-web3';
import * as ethers from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

require('dotenv').config();

// Put the address of the deployed paymaster and the Greeter Contract in the .env file
const PAYMASTER_ADDRESS = '0x2B3c9020E658d8b20F3ea46568b0c6Cb596C49E7';
const EVENT_CONTRACT_ADDRESS = '0xfea4495f2541411B4460c69142cD63Cb0CB1A5Bc';
const AA_FACTORY_ADDRESS_LIVE = '0x50BFb217F72A4e00a65040d64120002C7798A393';
const RICH_WALLET_PK = process.env.PRIVATE_KEY;

// Wallet private key
// ⚠️ Never commit private keys to file tracking history, or your account could be compromised.
const EMPTY_WALLET_PRIVATE_KEY = Wallet.createRandom().privateKey;

function getEvent(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
  const artifact = hre.artifacts.readArtifactSync('Event');
  return new ethers.Contract(EVENT_CONTRACT_ADDRESS, artifact.abi, wallet);
}

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider('https://testnet.era.zksync.dev	');
  const emptyWallet = new Wallet(EMPTY_WALLET_PRIVATE_KEY!);
  const wallet = new Wallet(RICH_WALLET_PK!).connect(provider);
  const deployer = new Deployer(hre, wallet);

  // Obviously this step is not required, but it is here purely to demonstrate that indeed the wallet has no ether.
  // const ethBalance = await emptyWallet.getBalance();
  // if (!ethBalance.eq(0)) {
  //   throw new Error("The wallet is not empty");
  // }

  const event = getEvent(hre, emptyWallet);

  // const gasPrice = await provider.getGasPrice();

  // Loading the Paymaster Contract
  const paymasterArtifact = await deployer.loadArtifact('Paymaster');
  const factoryArtifact = await deployer.loadArtifact('AAFactory');

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
  const aaFactory = new ethers.Contract(
    AA_FACTORY_ADDRESS_LIVE,
    factoryArtifact.abi,
    wallet,
  );

  const randomWallet = Wallet.createRandom();

  // const salt = ethers.constants.HashZero;
  const salt = ethers.utils.hashMessage('kodziak1416@gmail.com');
  const tx = await aaFactory.deployAccount(salt, randomWallet.address);
  await tx.wait();

  const abiCoder = new ethers.utils.AbiCoder();
  const aaAddress = utils.create2Address(
    aaFactory.address,
    await aaFactory.aaBytecodeHash(),
    salt,
    abiCoder.encode(['address'], [randomWallet.address]),
  );

  console.log(`Account deployed on address ${aaAddress}`);

  // Encoding the "ApprovalBased" paymaster flow's input
  const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
    type: 'ApprovalBased',
    token: EVENT_CONTRACT_ADDRESS,
    minimalAllowance: ethers.BigNumber.from(10000000000),
    innerInput: new Uint8Array(),
  });

  console.log(paymasterParams);

  let buyTx = await event.populateTransaction.buy(1, {
    value: ethers.utils.parseEther('0'),
  });

  const gasLimit = await provider.estimateGas(buyTx);
  const gasPrice = await provider.getGasPrice();

  // prepare deploy transaction
  buyTx = {
    ...buyTx,
    from: aaAddress,
    gasLimit: gasLimit,
    gasPrice: gasPrice,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(aaAddress),
    type: 113,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams: {
        paymaster: PAYMASTER_ADDRESS,
        paymasterParams: paymasterParams,
      },
    },
    value: ethers.utils.parseEther('0'),
  };

  if (buyTx.gasLimit == undefined) {
    buyTx.gasLimit = await provider.estimateGas(buyTx);
  }

  const signedTxHash = EIP712Signer.getSignedDigest(buyTx);

  buyTx.customData = {
    ...buyTx.customData,
    customSignature: ethers.utils.arrayify(
      ethers.utils.joinSignature(
        randomWallet._signingKey().signDigest(signedTxHash),
      ),
    ),
  };

  console.log(
    `The multisig's nonce before the first tx is ${await provider.getTransactionCount(
      aaAddress,
    )}`,
  );

  const sentTx = await provider.sendTransaction(utils.serialize(buyTx));

  console.log(sentTx);

  // await (
  //   await event
  //     .connect(emptyWallet)
  //     .buy(1, {

  //       // specify gas values
  //       maxFeePerGas: gasPrice,
  //       maxPriorityFeePerGas: 0,
  //       gasLimit: ethers.BigNumber.from(1000000),
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
