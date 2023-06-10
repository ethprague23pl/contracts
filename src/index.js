/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const dotenv = require('dotenv');
const { Provider, Wallet, ContractFactory, utils } = require('zksync-web3');
const ethers = require('ethers');

dotenv.config();

const AA_FACTORY_TESTNET_ADDRESS = '0xA2a98C0Fb41F971f4a04d82E013EE4BC51e5A245';

const { abi, bytecode } = require('./abis/eventAbi');
const {
  abi: aafactoryAbi,
  bytecode: aafactoryBytecode,
} = require('./abis/aafactoryAbi');

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Express + TypeScript Server');
});

app.post('/event', async (req, res) => {
  const provider = new Provider('https://testnet.era.zksync.dev');

  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
  const ContractInstance = new ContractFactory(abi, bytecode, wallet);
  const contractInstance = await ContractInstance.deploy(100, 0);
  console.log(contractInstance);

  console.log('Deployed contract address - ', contractInstance.address);

  res.send({ event_address: contractInstance.address });
});

app.post('/account', async (req, res) => {
  const provider = new Provider('https://testnet.era.zksync.dev');

  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
  const factory = new ethers.Contract(
    AA_FACTORY_TESTNET_ADDRESS,
    aafactoryAbi,
    wallet,
  );

  const salt = ethers.constants.HashZero;

  const randomWallet = Wallet.createRandom();

  const contractInstance = await factory.deployAccount(
    salt,
    randomWallet.address,
  );

  console.log(contractInstance);
  await contractInstance.wait();

  const AbiCoder = new ethers.utils.AbiCoder();
  const account_address = utils.create2Address(
    factory.address,
    await factory.aaBytecodeHash(),
    salt,
    AbiCoder.encode(['address'], [randomWallet.address]),
  );

  console.log('Deployed address ', account_address);

  res.send({ wallet_address: account_address });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
