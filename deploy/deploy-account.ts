import { utils, Wallet, Provider, EIP712Signer, types, Contract } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { GASLIMIT } from "./utils/helper";

const RICH_WALLET_PK = process.env.NODE_ENV == "test" ? '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110' : process.env.PRIVATE_KEY;
const RICH_WALLET_OWNER_PK = '0x850683b40d4a740aa6e745f889a6fdc8327be76e122f5aba645a5b02d0248db8';

// QUESTIONS
// HOW TO TRANSFER ETH FROM MULTISIG TO ANOTHER WALLET?
// HOW TO INVOKE TRANSACTION USING MULTISIG ACC

const deployFactory = async (hre: HardhatRuntimeEnvironment) => {
  // Private key of the account used to deploy
  const wallet = new Wallet(RICH_WALLET_PK!);
  const deployer = new Deployer(hre, wallet);
  const aaArtifact = await deployer.loadArtifact("AAFactory");

  const bytecodeHash = utils.hashBytecode(aaArtifact.bytecode);

  const factory = await deployer.deploy(
    aaArtifact,
    [bytecodeHash],
    undefined,
    [
      // Since the factory requires the code of the multisig to be available,
      // we should pass it here as well.
      aaArtifact.bytecode,
    ]
  );

  console.log(`AA factory address: ${factory.address}`);

  return factory;
}

const deployFactory2 = async (deployer: Deployer) => {
  // Deploy AccountFactory
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
  const accountArtifact = await deployer.loadArtifact("AAccount");

  const factory = await deployFactory(deployer.hre);

  console.log(`AAfactory: "${factory.address}"`)

  const salt = ethers.constants.HashZero; 
  // const transaction = await (await factory.deployAccount(salt, wallet.address, GASLIMIT)).wait();

  // await transaction.wait();
  // console.log('tx', transaction);

  // const xx = await utils.getDeployedContracts(transaction);

  // console.log('xx', xx)
  // const accountAddr = (await utils.getDeployedContracts(transaction))[0].deployedAddress
  
  // const accountContract = new ethers.Contract(accountAddr, accountArtifact.abi, wallet)
  // console.log(`account: "${accountContract.address}",`)

  const deployAATransaction = await (await factory.deployAccount(
    salt,
    wallet.address
  ));

  const abiCoder = new ethers.utils.AbiCoder();
  const multisigAddress = utils.create2Address(
    factory.address,
    await factory.aaBytecodeHash(),
    salt,
    abiCoder.encode(["address"], [wallet.address])
  );
  console.log("Owner PK & Address:", wallet.privateKey, wallet.address)
  console.log(`Account deployed on address ${multisigAddress}`);
}

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = Provider.getDefaultProvider();

  const wallet = new Wallet(RICH_WALLET_PK!).connect(provider);
  const deployer = new Deployer(hre, wallet);

  const account = await deployAccount(wallet, deployer);
  console.log(account);

  
  // const walletBalance = await provider.getBalance(wallet.address);
  // console.log('w address', wallet.address, walletBalance)

  // const aaFactory = await deployFactory(hre);
  

  // // const owner = Wallet.createRandom();
  // const owner = new Wallet(RICH_WALLET_OWNER_PK!).connect(provider);

  // // For the simplicity of the tutorial, we will use zero hash as salt
  // const salt = ethers.constants.HashZero;

  // // deploy account owned by owner
  // const deployAATransaction = await (await aaFactory.deployAccount(
  //   salt,
  //   owner.address
  // ));

  // // Getting the address of the deployed contract account
  // const abiCoder = new ethers.utils.AbiCoder();
  // const multisigAddress = utils.create2Address(
  //   aaFactory.address,
  //   await aaFactory.aaBytecodeHash(),
  //   salt,
  //   abiCoder.encode(["address"], [owner.address])
  // );
  // console.log("Owner PK & Address:", owner.privateKey, owner.address)
  // console.log(`Account deployed on address ${multisigAddress}`);

  // // console.log("Sending funds to multisig account");
  // // Send funds to the multisig account we just deployed
  // await (
  //   await wallet.sendTransaction({
  //     to: multisigAddress,
  //     // You can increase the amount of ETH sent to the multisig
  //     value: ethers.utils.parseEther("0.008"),
  //   })
  // ).wait();

  // let multisigBalance = await provider.getBalance(multisigAddress);

  // console.log(`Multisig account balance is ${multisigBalance.toString()}`);

  // // owner.address - OWNER OF MULTISIG ACCOUNT


  // const accountAddr = (await utils.getDeployedContracts(deployAATransaction))[0].deployedAddress
  // const accountContract = new ethers.Contract(accountAddr, accountArtifact.abi, wallet)

  // // Transaction to deploy a new account using the multisig we just deployed
  // let aaTx = await aaFactory.populateTransaction.deployAccount(
  //   salt,
  //   // These are accounts that will own the newly deployed account
  //   Wallet.createRandom().address
  // );

  // const gasLimit = await provider.estimateGas(aaTx);
  // const gasPrice = await provider.getGasPrice();

  // aaTx = {
  //   ...aaTx,
  //   // deploy a new account using the multisig
  //   from: multisigAddress,
  //   gasLimit: gasLimit,
  //   gasPrice: gasPrice,
  //   chainId: (await provider.getNetwork()).chainId,
  //   nonce: await provider.getTransactionCount(multisigAddress),
  //   type: 113,
  //   customData: {
  //     gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
  //   } as types.Eip712Meta,
  //   value: ethers.BigNumber.from(0),
  // };
  // const signedTxHash = EIP712Signer.getSignedDigest(aaTx);

  // aaTx.customData = {
  //   ...aaTx.customData,
  //   customSignature: ethers.utils.arrayify(ethers.utils.joinSignature(owner._signingKey().signDigest(signedTxHash)))
  // };

  // const aaTx2 = {
  //   ...aaTx,
  //   from: wallet.address,
  //   to: multisigAddress,
  //   gasLimit: gasLimit,
  //   gasPrice: gasPrice,
  //   chainId: (await provider.getNetwork()).chainId,
  //   nonce: await provider.getTransactionCount(multisigAddress),
  //   type: 113,
  //   customData: {
  //     gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
  //   } as types.Eip712Meta,
  //   value: ethers.BigNumber.from(0),
  // };

  // console.log(
  //   `The multisig's nonce before the first tx is ${await provider.getTransactionCount(
  //     multisigAddress
  //   )}`
  // );
  
  // await(await wallet.sendTransaction({
  //   to: multisigAddress,
  //   value: ethers.utils.parseEther('0.0002')
  // })).wait()

  // multisigBalance = await provider.getBalance(multisigAddress);

  // console.log("new account balance:", multisigBalance.toString())

  // const sentTx = await provider.sendTransaction(utils.serialize(aaTx));
  // await sentTx.wait();

  // // Checking that the nonce for the account has increased
  // console.log(
  //   `The multisig's nonce after the first tx is ${await provider.getTransactionCount(
  //     multisigAddress
  //   )}`
  // );
  
  // multisigBalance = await provider.getBalance(multisigAddress);

  // console.log(`Multisig account balance is now ${multisigBalance.toString()}`);
}
