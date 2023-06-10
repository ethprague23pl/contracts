import { utils, Wallet, Provider, EIP712Signer, types, Contract } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { GASLIMIT } from "./utils/helper";
// import { sendTx } from "./utils/sendAATx";

require('dotenv').config();

// const RICH_WALLET_PK = process.env.NODE_ENV == "test" ? '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110' : process.env.PRIVATE_KEY;
const RICH_WALLET_PK = process.env.PRIVATE_KEY;
// QUESTIONS
// HOW TO TRANSFER ETH FROM MULTISIG TO ANOTHER WALLET?
// HOW TO INVOKE TRANSACTION USING MULTISIG ACC

const AA_FACTORY_ADDRESS_LIVE = '0x50BFb217F72A4e00a65040d64120002C7798A393';
const EVENT_ADDRESS_LIVE = "0x6A6c2b0EaBBe0701D90b915482E150D032d76A1B";

const deployFactory = async (hre: HardhatRuntimeEnvironment) => {
  // Private key of the account used to deploy
  const wallet = new Wallet(RICH_WALLET_PK!);
  const deployer = new Deployer(hre, wallet);
  const factoryArtifact = await deployer.loadArtifact("AAFactory");
  const aaArtifact = await deployer.loadArtifact("XAAccount");

  // Getting the bytecodeHash of the account
  const bytecodeHash = utils.hashBytecode(aaArtifact.bytecode);

  const factory = await deployer.deploy(
    factoryArtifact,
    [bytecodeHash],
    {
      gasLimit: ethers.utils.hexlify(10000000)
    },
    [
      // Since the factory requires the code of the multisig to be available,
      // we should pass it here as well.
      aaArtifact.bytecode,
    ],
  );

  console.log(`AA factory address: ${factory.address}`);

  return factory;
}

const deployFactory2 = async (deployer: Deployer) => {
  const factoryArtifact = await deployer.loadArtifact("AAFactory");
  const accountArtifact = await deployer.loadArtifact("AAccount");
  const bytecodeHash = utils.hashBytecode(factoryArtifact.bytecode);

  const factory = <Contract>(await deployer.deploy(
    factoryArtifact, 
    [bytecodeHash], 
    undefined, 
    [factoryArtifact.bytecode]
  ));

  return factory;
}

export async function deployAccount (wallet: Wallet, deployer: Deployer) {
  const factory = await deployFactory(deployer.hre);

  console.log(`AAfactory: "${factory}"`)
  console.log(factory)

  // await deployAccountOnly(deployer.hre);


  // const salt = ethers.constants.HashZero; 
  // const owner2 = Wallet.createRandom();
  // const transaction = await (await factory.deployAccount(salt, wallet.address, owner2.address, GASLIMIT));

  // console.log('tx', transaction);

  // const xx = await utils.getDeployedContracts(transaction);

  // console.log('xx', xx)
  // const accountAddr = (await utils.getDeployedContracts(transaction))[0].deployedAddress
  
  // const accountContract = new ethers.Contract(accountAddr, accountArtifact.abi, wallet)
  // console.log(`account: "${accountContract.address}",`)

  //   // The two owners of the multisig
  //   const owner1 = Wallet.createRandom();
  //   const owner2 = Wallet.createRandom();

  // const tx = await factory.populateTransaction.deployAccount(
  //   salt,
  //   // wallet.address,
  //   owner1.address,
  //   owner2.address,
  //   GASLIMIT
  // );

  // console.log(tx);

  // await tx.wait();


  // const abiCoder = new ethers.utils.AbiCoder();
  // const multisigAddress = utils.create2Address(
  //   factory.address,
  //   await factory.aaBytecodeHash(),
  //   salt,
  //   abiCoder.encode(["address"], [wallet.address])
  // );

  // console.log(`Account deployed on address ${multisigAddress}`);

  // const accountContract = new ethers.Contract(multisigAddress, accountArtifact.abi, wallet);

  // return accountContract;
}

export async function deployEvent (hre: HardhatRuntimeEnvironment) {
  // Private key of the account used to deploy
  const wallet = new Wallet(RICH_WALLET_PK!);
  const deployer = new Deployer(hre, wallet);
  const eventArtifact = await deployer.loadArtifact("Event");

  const event = await deployer.deploy(
    eventArtifact,
    [50, 0],
    {
      gasLimit: ethers.utils.hexlify(10000000)
    }
  );

  console.log(`Event address: ${event.address}`);

  return event;
}

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://testnet.era.zksync.dev	");
  const wallet = new Wallet(RICH_WALLET_PK!).connect(provider);
  const factoryArtifact = await hre.artifacts.readArtifact("AAFactory");
  const aaArtifact = await hre.artifacts.readArtifact("XAAccount");

  if(EVENT_ADDRESS_LIVE) {
    const event = await deployEvent(hre);
    console.log(event);
  }

  console.log(`Event address: ${EVENT_ADDRESS_LIVE}`);
  
  // const factory = await deployFactory(hre);
  // console.log(factory.address)

  const aaFactory = new ethers.Contract(
    AA_FACTORY_ADDRESS_LIVE,
    factoryArtifact.abi,
    wallet
  );

  const randomWallet = Wallet.createRandom();

  // const salt = ethers.constants.HashZero;
  const salt = ethers.utils.hashMessage("kodziak1416@gmail.com");
  const tx = await aaFactory.deployAccount(
    salt,
    randomWallet.address
  );
  await tx.wait();

  const abiCoder = new ethers.utils.AbiCoder();
  const aaAddress = utils.create2Address(
    aaFactory.address,
    await aaFactory.aaBytecodeHash(),
    salt,
    abiCoder.encode(["address"], [randomWallet.address])
  );
  console.log("Owner PK & Address:", wallet.privateKey, wallet.address)
  console.log(`Account deployed on address ${aaAddress}`);

  await(await wallet.sendTransaction({
    to: aaAddress,
    value: ethers.utils.parseEther('0.0005')
  })).wait()

  let multisigBalance = await provider.getBalance(aaAddress);

  console.log("new account balance:", multisigBalance.toString())

  const gasPrice = await provider.getGasPrice();

  let aaTx = {
    from: aaAddress,
    to: wallet.address,
    gasPrice: gasPrice,
    gasLimit: ethers.BigNumber.from(1000000),
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(aaAddress),
    type: 113,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,
    value: ethers.utils.parseEther('0.0002'),
    data: "0x"
  };

  console.log(EIP712Signer.getSignInput(aaTx));

  const signedTxHash = EIP712Signer.getSignedDigest(aaTx);
  console.log(signedTxHash)

  aaTx.customData = {
    ...aaTx.customData,
    customSignature: ethers.utils.arrayify(ethers.utils.joinSignature(randomWallet._signingKey().signDigest(signedTxHash)))
  };

  console.log(
    `The multisig's nonce before the first tx is ${await provider.getTransactionCount(
      aaAddress
    )}`
  );

  const sentTx = await provider.sendTransaction(utils.serialize(aaTx));
  await sentTx.wait();

  console.log(
    `The multisig's nonce after the first tx is ${await provider.getTransactionCount(
      aaAddress
    )}`
  );
}
