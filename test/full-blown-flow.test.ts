const { ethers } = require("hardhat");
import { expect } from "chai";
import { Wallet, Provider, Contract, utils } from "zksync-web3";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

const RICH_WALLET_PK = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe("FULL BLOWN FLOW", () => {
  let paymaster;
  let event;
  let owner;
  let deployer: Deployer;
  let aaFactory: Contract;

  before('Fund the wallet', async () => {
    deployer = new Deployer(hre, new Wallet(RICH_WALLET_PK));

    // const depositHandle = await deployer.zkWallet.deposit({
    //   to: deployer.zkWallet.address,
    //   token: utils.ETH_ADDRESS,
    //   amount: ethers.utils.parseEther('0.001'),
    // });

    // console.log(depositHandle);

    // await depositHandle.wait();
  });

  beforeEach(async () => {
    const provider = Provider.getDefaultProvider();

    const wallet = new Wallet(RICH_WALLET_PK, provider);
    const deployer = new Deployer(hre, wallet);

    owner = wallet;

    const factoryArtifact = await deployer.loadArtifact("AAFactory");
    const aaArtifact = await deployer.loadArtifact("AAccount");

    const bytecodeHash = utils.hashBytecode(aaArtifact.bytecode);

    aaFactory = await deployer.deploy(factoryArtifact, [bytecodeHash]);

    // const Paymaster = await deployer.loadArtifact("Paymaster");
    // paymaster = await deployer.deploy(Paymaster);

    // const Event = await deployer.loadArtifact("Event");
    // event = await deployer.deploy(Event, ["test-name", "test-key", 50]);
  })

  it('Deploy AAccount', async () => {
    console.log('im deploying aaccount');
    const owner = Wallet.createRandom();
    const salt = ethers.constants.HashZero;

    console.log({owner, salt});

    const tx = await aaFactory.connect(owner).deployAccount(
      salt,
      owner.address
    );
    console.log('tx', tx);
    await tx.wait();

    const abiCoder = new ethers.utils.AbiCoder();
    const multisigAddress = utils.create2Address(
      aaFactory.address,
      await aaFactory.aaBytecodeHash(),
      salt,
      abiCoder.encode(["address"], [owner.address])
    );

    console.log("Owner PK & Address:", owner.privateKey, owner.address)
    console.log(`Account deployed on address ${multisigAddress}`);
  })

});
