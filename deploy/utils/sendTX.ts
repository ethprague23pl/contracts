import {
  Wallet,
  Contract,
  Provider,
  utils,
  EIP712Signer,
  types,
} from "zksync-web3";
import { ethers } from "ethers";

export async function sendTx(
  provider: Provider,
  account: Contract,
  user: Wallet,
  tx: any
) {
  tx = {
    ...tx,
    from: account.address,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(account.address),
    type: 113,
    gasPrice: await provider.getGasPrice(),
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,
  };

  if (tx.gasLimit == undefined) {
    // tx.gasLimit = await provider.estimateGas(tx);
    tx.gasLimit = ethers.BigNumber.from(1000000)
  }

  const signedTxHash = EIP712Signer.getSignedDigest(tx);
  const signature = ethers.utils.arrayify(
    ethers.utils.joinSignature(user._signingKey().signDigest(signedTxHash))
  );

  tx.customData = {
    ...tx.customData,
    customSignature: signature,
  };

  return await provider.sendTransaction(utils.serialize(tx));
}
