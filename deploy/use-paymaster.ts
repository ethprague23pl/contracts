import { ContractFactory, Provider, utils, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

require("dotenv").config();

// Put the address of the deployed paymaster and the Greeter Contract in the .env file
const PAYMASTER_ADDRESS = "0x17aA0e598FF16CEc73Ce79f5b88B1D5A48643347";
const EVENT_CONTRACT_ADDRESS = "0x6A6c2b0EaBBe0701D90b915482E150D032d76A1B";

// Wallet private key
// ⚠️ Never commit private keys to file tracking history, or your account could be compromised.
const EMPTY_WALLET_PRIVATE_KEY = Wallet.createRandom().privateKey

function getEvent(hre: HardhatRuntimeEnvironment, wallet: Wallet) {
  const artifact = hre.artifacts.readArtifactSync("Event");
  return new ethers.Contract(EVENT_CONTRACT_ADDRESS, artifact.abi, wallet);
}

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://zksync2-testnet.zksync.dev");
  const emptyWallet = new Wallet(EMPTY_WALLET_PRIVATE_KEY!, provider);

  // Obviously this step is not required, but it is here purely to demonstrate that indeed the wallet has no ether.
  const ethBalance = await emptyWallet.getBalance();
  if (!ethBalance.eq(0)) {
    throw new Error("The wallet is not empty");
  }

  const event = getEvent(hre, emptyWallet);

  const gasPrice = await provider.getGasPrice();

  // Loading the Paymaster Contract
  const deployer = new Deployer(hre, emptyWallet);
  const paymasterArtifact = await deployer.loadArtifact("Paymaster");

  const PaymasterFactory = new ContractFactory(
    paymasterArtifact.abi,
    paymasterArtifact.bytecode,
    deployer.zkWallet
  );
  const PaymasterContract = PaymasterFactory.attach(PAYMASTER_ADDRESS);

  // Estimate gas fee for the transaction
  const gasLimit = await event.estimateGas.buy(
    1,
    {
      // customData: {
      //   gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      //   paymasterParams: utils.getPaymasterParams(PAYMASTER_ADDRESS, {
      //     type: "ApprovalBased",
      //     token: TOKEN_ADDRESS,
      //     // Set a large allowance just for estimation
      //     minimalAllowance: ethers.BigNumber.from(`100000000000000000000`),
      //     // Empty bytes as testnet paymaster does not use innerInput
      //     innerInput: new Uint8Array(),
      //   }),
      // },
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams: utils.getPaymasterParams(PAYMASTER_ADDRESS, {
          type: "ApprovalBased",
          token: EVENT_CONTRACT_ADDRESS,
          minimalAllowance: ethers.BigNumber.from(`100000000000000000000`),
          // Empty bytes as testnet paymaster does not use innerInput
          innerInput: new Uint8Array(),
        }),
      },
    }
  );

  console.log(gasLimit)

  // Gas estimation:
  const fee = gasPrice.mul(gasLimit.toString());
  console.log(`Estimated ETH FEE (gasPrice * gasLimit): ${fee}`);

  // Encoding the "ApprovalBased" paymaster flow's input
  const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
    type: "ApprovalBased",
    token: EVENT_CONTRACT_ADDRESS,
    minimalAllowance: ethers.BigNumber.from(`100000000000000000000`),
    innerInput: new Uint8Array(),
  });

  await (
    await event
      .connect(emptyWallet)
      .mint(1, {
        // specify gas values
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: 0,
        gasLimit: gasLimit,
        // paymaster info
        customData: {
          paymasterParams: paymasterParams,
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        },
      })
  ).wait();

  const res = await provider.getBalance(emptyWallet.address);

  console.log(`ETH Balance of the user after tx: ${res}`);
  console.log(`Message in contract now is: ${await event.ownerOf(emptyWallet.address)}`);
}
