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
const EVENT_TESTNET_ADDRESS = '0x18d39edD4F8b82C2fa630783c70c688ec4D83839';
const MARKETPLACE_TESTNET_ADDRESS =
  '0xcA1007354c3bfF74bf596dc036859BdD4914e398';
const PROXY_EVENT_TESTNET_ADDRESS =
  '0x7720f64Dd997c6b540B8cf52704917fcBB359EE5';

const { abi, bytecode } = require('./abis/eventAbi');
const { abi: erc20Abi } = require('./abis/erc20');
const { abi: marketplaceAbi } = require('./abis/marketplace');

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
    const eventFactory = new ContractFactory(abi, bytecode, wallet);
    const deployTx = await eventFactory.deploy(
      params.ticketQuantity,
      params.ticketPrice,
      0, // max sell price
      PROXY_EVENT_TESTNET_ADDRESS, // proxy event
    );

    console.log('Deployed contract address - ', deployTx.address);

    res.send({ event_address: deployTx.address });
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

app.get('/ticket', async (req, res) => {
  const provider = new Provider('https://testnet.era.zksync.dev');
  const params = req.query;
  console.log(params);

  const privateKey = params.walletPrivateKey
    ? params.walletPrivateKey
    : '0x41bc6bc21b3dcfa2447b290fe587f078d784ba97aea39637ff6366879a450991';
  const eventContractAddress = params.eventContractAddress
    ? params.eventContractAddress
    : EVENT_TESTNET_ADDRESS;

  const userWallet = new Wallet(privateKey, provider);

  const event = new ethers.Contract(eventContractAddress, abi, userWallet);

  const tokens = await event.tokensOfOwner(userWallet.address);

  const parsed = tokens?.map((token) => Math.round(parseFloat(token) * 1));

  console.log(parsed);

  const response = parsed.map((token) => ({
    contractAddress: eventContractAddress,
    id: token,
  }));

  res.send(response);
});

app.get('/list-tickets', async (req, res) => {
  const provider = new Provider('https://testnet.era.zksync.dev');
  const params = req.query;
  console.log(params);

  const tokens = [];

  const privateKey = params.walletPrivateKey
    ? params.walletPrivateKey
    : '0x41bc6bc21b3dcfa2447b290fe587f078d784ba97aea39637ff6366879a450991';
  const eventContractAddress = params.eventContractAddress
    ? params.eventContractAddress
    : EVENT_TESTNET_ADDRESS;

  const userWallet = new Wallet(privateKey, provider);

  const event = new ethers.Contract(eventContractAddress, abi, userWallet);

  const allTokens = await event.totalSupply();

  console.log(parseFloat(allTokens));

  for (let i = 0; i < allTokens; i++) {
    const tokenId = i;

    const market = new ethers.Contract(
      MARKETPLACE_TESTNET_ADDRESS,
      marketplaceAbi,
      userWallet,
    );

    const paymasterParams = utils.getPaymasterParams(
      PAYMASTER_TESTNET_ADDRESS,
      {
        type: 'General',
        innerInput: new Uint8Array(),
      },
    );

    const gasPrice = await provider.getGasPrice();
    const gasLimit = await market.estimateGas.getListing(
      eventContractAddress,
      tokenId,
      {
        value: ethers.utils.parseEther('0'),
        customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          paymasterParams: paymasterParams,
        },
      },
    );

    const resp = await market.getListing(eventContractAddress, tokenId, {
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
    });

    console.log({
      tokenId,
      price: parseFloat(resp.price),
      selller: resp.seller,
      isListed:
        resp.seller === '0x0000000000000000000000000000000000000000'
          ? false
          : true,
    });

    tokens.push({
      tokenId,
      price: parseFloat(resp.price),
      selller: resp.seller,
      isListed:
        resp.seller === '0x0000000000000000000000000000000000000000'
          ? false
          : true,
    });
  }

  res.send(tokens);
});

app.post('/marketplace/sell', async (req, res) => {
  const provider = new Provider('https://testnet.era.zksync.dev');
  const params = req.body;

  const privateKey = params.privateKey;
  const eventContractAddress = params.eventContractAddress;
  const tokenId = params.tokenId;
  const ticketPrice = params.tokenPrice;

  console.log({ privateKey, eventContractAddress, tokenId, ticketPrice });

  const userWallet = new Wallet(privateKey, provider);
  const event = new ethers.Contract(eventContractAddress, abi, userWallet);
  const market = new ethers.Contract(
    MARKETPLACE_TESTNET_ADDRESS,
    marketplaceAbi,
    userWallet,
  );

  console.log(userWallet.address);

  const tokens = await event.tokensOfOwner(userWallet.address);
  console.log(`Wallet tokens: `, tokens);

  const paymasterParams = utils.getPaymasterParams(PAYMASTER_TESTNET_ADDRESS, {
    type: 'General',
    innerInput: new Uint8Array(),
  });

  const gasPrice = await provider.getGasPrice();
  const gasLimit = await event.estimateGas.approve(
    MARKETPLACE_TESTNET_ADDRESS,
    tokenId,
    {
      value: ethers.utils.parseEther('0'),
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams: paymasterParams,
      },
    },
  );

  await (
    await event.approve(MARKETPLACE_TESTNET_ADDRESS, tokenId, {
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

  console.log('approve after');

  await (
    await market.listItem(eventContractAddress, tokenId, 1, {
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

  console.log('listitem after');

  const resp = await market.getListing(eventContractAddress, tokenId, {
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
  });

  console.log('getlisting after');

  console.log('response', resp);

  res.send({
    price: resp.price,
    selller: resp.seller,
  });
});

app.get('/marketplace', async (req, res) => {
  const provider = new Provider('https://testnet.era.zksync.dev');
  const params = req.params;

  const privateKey = params.privateKey;
  const eventContractAddress = params.eventContractAddress;
  const tokenId = params.tokenId;

  console.log({ privateKey, eventContractAddress, tokenId });

  const userWallet = new Wallet(privateKey, provider);

  const market = new ethers.Contract(
    MARKETPLACE_TESTNET_ADDRESS,
    marketplaceAbi,
    userWallet,
  );

  const paymasterParams = utils.getPaymasterParams(PAYMASTER_TESTNET_ADDRESS, {
    type: 'General',
    innerInput: new Uint8Array(),
  });

  const gasPrice = await provider.getGasPrice();
  const gasLimit = await market.estimateGas.getListing(
    eventContractAddress,
    tokenId,
    {
      value: ethers.utils.parseEther('0'),
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams: paymasterParams,
      },
    },
  );

  const resp = await market.getListing(eventContractAddress, tokenId, {
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
  });

  console.log('getlisting after');

  console.log('response', resp);

  res.send({
    price: resp.price,
    selller: resp.seller,
  });
});

app.post('/marketplace/buy', async (req, res) => {
  const provider = new Provider('https://testnet.era.zksync.dev');
  const params = req.body;

  const privateKey = params.privateKey;
  const eventContractAddress = params.eventContractAddress;
  const tokenId = params.tokenId;

  console.log({ privateKey, eventContractAddress, tokenId });

  const userWallet = new Wallet(privateKey, provider);
  const event = new ethers.Contract(eventContractAddress, abi, userWallet);
  const market = new ethers.Contract(
    MARKETPLACE_TESTNET_ADDRESS,
    marketplaceAbi,
    userWallet,
  );

  console.log(userWallet.address);

  const tokens = await event.tokensOfOwner(userWallet.address);
  console.log(`Wallet tokens: `, tokens);

  const paymasterParams = utils.getPaymasterParams(PAYMASTER_TESTNET_ADDRESS, {
    type: 'General',
    innerInput: new Uint8Array(),
  });

  const gasPrice = await provider.getGasPrice();
  const gasLimit = await market.estimateGas.buyItem(
    eventContractAddress,
    tokenId,
    {
      value: ethers.utils.parseEther('0.00000000000000001'),
      customData: {
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        paymasterParams: paymasterParams,
      },
    },
  );

  await (
    await market.buyItem(eventContractAddress, tokenId, {
      // specify gas values
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: 0,
      gasLimit: gasLimit,
      // paymaster info
      value: ethers.utils.parseEther('0.00000000000000001'),
      customData: {
        paymasterParams: paymasterParams,
        gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      },
    })
  ).wait();

  const tokensAfter = await event.tokensOfOwner(userWallet.address);
  console.log(`Wallet tokens after: `, tokensAfter);

  res.send('OK');
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
    await event.buy(ticketQuantity, {
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

  res.send({ OK: 'Success' });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
