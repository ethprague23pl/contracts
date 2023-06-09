import { utils, Wallet, Provider, EIP712Signer, types, Contract } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

require('dotenv').config();
const RICH_WALLET_PK = process.env.PRIVATE_KEY;

const AA_FACTORY_ADDRESS_LIVE = '0x50BFb217F72A4e00a65040d64120002C7798A393';
const EVENT_ADDRESS_LIVE = "0x6A6c2b0EaBBe0701D90b915482E150D032d76A1B";

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://zksync2-testnet.zksync.dev");
  const wallet = new Wallet(RICH_WALLET_PK!).connect(provider);
  const factoryArtifact = await hre.artifacts.readArtifact("AAFactory");
  const aaArtifact = await hre.artifacts.readArtifact("XAAccount");

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

  const aAccount = new ethers.Contract(
    aaAddress,
    aaArtifact.abi,
    randomWallet
  );

  let aaTx = await aaFactory.populateTransaction.deployAccount(
    salt,
    randomWallet.address
  );

  aaTx = {
    ...aaTx,
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
    data: "0x0000000000000000000000000000000000000000"
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
