import { utils, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

require('dotenv').config();

// const paymaster = {
//   address: '0x3Abc26b0c6A5d6730f31DF9eFa8f62B3B82e34D0'
// }

export default async function (hre: HardhatRuntimeEnvironment) {
  // The wallet that will deploy the token and the paymaster
  // It is assumed that this wallet already has sufficient funds on zkSync
  // ⚠️ Never commit private keys to file tracking history, or your account could be compromised.

  // This wallet has to contain ETH
  const wallet = new Wallet(process.env.PRIVATE_KEY!);
  
  // // The wallet that will receive ERC20 tokens
  // const emptyWallet = Wallet.createRandom();
  // console.log(`Empty wallet's address: ${emptyWallet.address}`);
  // console.log(`Empty wallet's private key: ${emptyWallet.privateKey}`);

  const deployer = new Deployer(hre, wallet);

  // // Deploying the paymaster
  const paymasterArtifact = await deployer.loadArtifact("SimplePaymaster");
  const paymaster = await deployer.deploy(paymasterArtifact);
  console.log(`Paymaster address: ${paymaster.address}`);

  // Supplying paymaster with ETH.
  console.log(deployer);

  await (
    await deployer.zkWallet.sendTransaction({
      to: paymaster.address,
      value: ethers.utils.parseEther("0.0005"),
    })
  ).wait();

  console.log(`Done!`);
}
