/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const dotenv = require('dotenv');
const { Provider, Wallet, ContractFactory, utils } = require('zksync-web3');
const ethers = require('ethers');
const bodyparser = require('body-parser');

dotenv.config();

const AA_FACTORY_TESTNET_ADDRESS = '0xA2a98C0Fb41F971f4a04d82E013EE4BC51e5A245';

const PAYMASTER_TESTNET_ADDRESS = '0x7e73AFDe3e996437b0E7D20B8394FcA1d76cF68a';
const ERC20_MOCK_TESTNET_ADDRESS = '0xcd6DBE1f8d04F35e84aAbAeB5d150F2bAEe5fFbE';
const EVENT_TESTNET_ADDRESS = '0x00324B1eb4D2fd83cc730cA82f54F9DC7dCd8611';

const { abi, bytecode } = require('./abis/eventAbi');
const { abi: aaWalletAbi } = require('./abis/aaWallet');
const { abi: aafactoryAbi } = require('./abis/aafactoryAbi');
const { abi: erc20Abi } = require('./abis/erc20');
const {
  abi: paymasterAbi,
  bytecode: paymasterBytecode,
} = require('./abis/paymasterAbi');

const app = express();
app.use(bodyparser.json());
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send("I'm alive.");
});

app.post('/event', async (req, res) => {
  const provider = new Provider('https://testnet.era.zksync.dev');

  const params = req.body;

  console.log(params);

  try {
    const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
    const ContractInstance = new ContractFactory(abi, bytecode, wallet);
    const contractInstance = await ContractInstance.deploy(
      params.ticketQuantity,
      // ethers.utils.parseUnits(params.ticketPrice, 'wei').toString(),
      params.ticketPrice,
    );

    console.log('Deployed contract address - ', contractInstance.address);

    res.send({ event_address: contractInstance.address });
  } catch (err) {
    res.send({ event_address: 'ERROR' });
  }
});

app.get('/account', async (req, res) => {
  // const factory = new ethers.Contract(
  //   AA_FACTORY_TESTNET_ADDRESS,
  //   aafactoryAbi,
  //   wallet,
  // );

  // const salt = ethers.constants.HashZero;

  // const deployAccountTx = await factory.deployAccount(
  //   salt,
  //   randomWallet.address,
  // );

  // await deployAccountTx.wait();

  // const AbiCoder = new ethers.utils.AbiCoder();
  // const account_address = utils.create2Address(
  //   factory.address,
  //   await factory.aaBytecodeHash(),
  //   salt,
  //   AbiCoder.encode(['address'], [randomWallet.address]),
  // );

  // console.log('Deployed address ', account_address);

  const provider = new Provider('https://testnet.era.zksync.dev');
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);

  const randomWallet = Wallet.createRandom().connect(provider);

  const erc20 = new ethers.Contract(
    ERC20_MOCK_TESTNET_ADDRESS,
    erc20Abi,
    wallet,
  );

  await (
    await erc20.mint(randomWallet.address, '500000000000000000000000')
  ).wait();

  const erc20Balance = await erc20.balanceOf(randomWallet.address);
  console.log(`ERC20 balance of the user: ${erc20Balance}`);

  res.send({
    wallet_address: randomWallet.address,
    wallet_private_key: randomWallet.privateKey,
  });
});

app.post('/ticket', async (req, res) => {
  const provider = new Provider('https://testnet.era.zksync.dev');
  const params = req.body;
  console.log(params);

  const privateKey = params.privateKey
    ? params.privateKey
    : '0x41bc6bc21b3dcfa2447b290fe587f078d784ba97aea39637ff6366879a450991';
  const ticketQuantity = params.ticketQuantity ? params.ticketQuantity : 0;
  const eventContractAddress = params.eventContractAddress
    ? params.eventContractAddress
    : EVENT_TESTNET_ADDRESS;

  const userWallet = new Wallet(privateKey, provider);

  const event = new ethers.Contract(eventContractAddress, abi, userWallet);

  const paymasterParams = utils.getPaymasterParams(PAYMASTER_TESTNET_ADDRESS, {
    type: 'General',
    innerInput: new Uint8Array(),
  });

  const gasLimit = await event.estimateGas.buy(ticketQuantity, {
    value: ethers.utils.parseEther('0'),
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams: paymasterParams,
    },
  });

  console.log(gasLimit);
  const gasPrice = await provider.getGasPrice();

  // Gas estimation:
  const fee = gasPrice.mul(gasLimit.toString());
  console.log(`Estimated ETH FEE (gasPrice * gasLimit): ${fee}`);

  console.log(paymasterParams);

  await (
    await event.connect(userWallet).buy(ticketQuantity, {
      // specify gas values
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: 0,
      gasLimit: gasLimit,
      // paymaster info
      value: ethers.utils.parseEther('0'),
      customData: {
        paymasterParams: paymasterParams,
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      },
    })
  ).wait();

  console.log(
    `Minted now by randomWallet address is: ${await event.numberMinted(
      userWallet.address,
    )}`,
  );

  res.send({ OK: 'Success' });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
