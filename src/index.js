/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const dotenv = require('dotenv');
const { Provider, Wallet, ContractFactory, utils } = require('zksync-web3');
const ethers = require('ethers');
const bodyparser = require('body-parser');

dotenv.config();

const AA_FACTORY_TESTNET_ADDRESS = '0xA2a98C0Fb41F971f4a04d82E013EE4BC51e5A245';

const PAYMASTER_TESTNET_ADDRESS = '0x461771F8B3eC435decc890c9185eB26ee4Aa2F05';
const ERC20_MOCK_TESTNET_ADDRESS = '0xcd6DBE1f8d04F35e84aAbAeB5d150F2bAEe5fFbE';
const EVENT_TESTNET_ADDRESS = '0x00324B1eb4D2fd83cc730cA82f54F9DC7dCd8611';

const { abi, bytecode } = require('./abis/eventAbi');
const { abi: aafactoryAbi } = require('./abis/aafactoryAbi');
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

  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
  const ContractInstance = new ContractFactory(abi, bytecode, wallet);
  const contractInstance = await ContractInstance.deploy(
    params.ticketQuantity,
    // ethers.utils.parseUnits(params.ticketPrice, 'wei').toString(),
    params.ticketPrice,
  );

  console.log('Deployed contract address - ', contractInstance.address);

  res.send({ event_address: contractInstance.address });
});

app.get('/account', async (req, res) => {
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

  await contractInstance.wait();

  const AbiCoder = new ethers.utils.AbiCoder();
  const account_address = utils.create2Address(
    factory.address,
    await factory.aaBytecodeHash(),
    salt,
    AbiCoder.encode(['address'], [randomWallet.address]),
  );

  console.log('Deployed address ', account_address);

  res.send({
    wallet_address: account_address,
    private_key: randomWallet.privateKey,
  });
});

app.post('/ticket', async (req, res) => {
  const provider = new Provider('https://testnet.era.zksync.dev');
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
  const params = req.body;

  const privateKey = params.privateKey
    ? params.privateKey
    : '0x41bc6bc21b3dcfa2447b290fe587f078d784ba97aea39637ff6366879a450991';
  const ticketQuantity = params.ticketQuantity ? params.ticketQuantity : 0;
  const eventContractAddress = params.eventContractAddress
    ? params.eventContractAddress
    : '0x'; // TODO: XD

  const PaymasterFactory = new ContractFactory(
    paymasterAbi,
    paymasterBytecode,
    wallet,
  );
  const PaymasterContract = PaymasterFactory.attach(PAYMASTER_TESTNET_ADDRESS);

  // new wallet, so user wallet
  const newWallet = new Wallet(privateKey, provider);
  const event = new ethers.Contract(EVENT_TESTNET_ADDRESS, abi, newWallet);

  console.log(event);

  const gasLimit = await event.estimateGas.buy(ticketQuantity, {
    value: ethers.utils.parseEther('0'),
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams: utils.getPaymasterParams(PAYMASTER_TESTNET_ADDRESS, {
        type: 'ApprovalBased',
        token: ERC20_MOCK_TESTNET_ADDRESS,
        // Set a large allowance just for estimation
        minimalAllowance: ethers.BigNumber.from(`100000000000000000000`),
        // Empty bytes as testnet paymaster does not use innerInput
        innerInput: new Uint8Array(),
      }),
    },
  });

  console.log(gasLimit);
  const gasPrice = await provider.getGasPrice();

  // Gas estimation:
  const fee = gasPrice.mul(gasLimit.toString());
  console.log(`Estimated ETH FEE (gasPrice * gasLimit): ${fee}`);

  // Calling the dAPI to get the ETH price:
  const ETHUSD = await PaymasterContract.readDapi(
    '0x28ce555ee7a3daCdC305951974FcbA59F5BdF09b',
  );
  const USDCUSD = await PaymasterContract.readDapi(
    '0x946E3232Cc18E812895A8e83CaE3d0caA241C2AB',
  );

  console.log(`ETH/USD dAPI Value: ${ETHUSD}`);
  console.log(`USDC/USD dAPI Value: ${USDCUSD}`);

  // Calculating the USD fee:
  const usdFee = fee.mul(ETHUSD).div(USDCUSD);
  console.log(`Estimated USD FEE: ${usdFee}`);

  // Encoding the "ApprovalBased" paymaster flow's input
  const paymasterParams = utils.getPaymasterParams(PAYMASTER_TESTNET_ADDRESS, {
    type: 'ApprovalBased',
    token: ERC20_MOCK_TESTNET_ADDRESS,
    // set minimalAllowance to the estimated fee in erc20
    minimalAllowance: ethers.BigNumber.from(usdFee),
    // empty bytes as testnet paymaster does not use innerInput
    innerInput: new Uint8Array(),
  });

  console.log(paymasterParams);

  await (
    await event.connect(newWallet).buy(ticketQuantity, {
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
      newWallet.address,
    )}`,
  );

  res.send('DUPA');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
