// import * as zksync from "zksync-web3";
// import * as ethers from "ethers";

// // async function main() {
// //     const greeting = "a new greeting";
// //     const tx = await greeter.populateTransaction.setGreeting(greeting);
// //     const gasPrice = await sender.provider.getGasPrice();
// //     const gasLimit = await greeter.estimateGas.setGreeting(greeting);
// //     const fee = gasPrice.mul(gasLimit);
// //     const unconnectedWallet = new Wallet("0x3ef14f99802b6800f69728e679b67b27df000f8c82118caf836ad011cc898c7c");
// //     const unconnectedWallet2 = new Wallet("0x79aa62481b2612cf67a3d76c2fa5acbb7ec2c255d567732a466d0e086f959c80");

// //     const paymasterParams = utils.getPaymasterParams(testnetPaymaster, {
// //       type: "ApprovalBased",
// //       token,
// //       minimalAllowance: fee,
// //       innerInput: new Uint8Array(),
// //     });
// //     const sentTx = await sender.sendTransaction({
// //       ...tx,
// //       maxFeePerGas: gasPrice,
// //       maxPriorityFeePerGas: BigNumber.from(0),
// //       gasLimit,
// //       customData: {
// //         gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
// //         paymasterParams,
// //       },
// //     })
// // }

// // main().catch((error) => {
// //     console.error(error);
// //     process.exitCode = 1;
// //   });
