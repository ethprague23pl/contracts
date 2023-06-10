const { ethers } = require("hardhat");
import { expect } from "chai";
import { Wallet, Provider, Contract, utils } from "zksync-web3";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
require("dotenv").config();

const RICH_WALLET_PK = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe("Events", () => {
  let event;
  let owner;

  beforeEach(async () => {
    const provider = Provider.getDefaultProvider();

    const wallet = new Wallet(RICH_WALLET_PK, provider);
    const deployer = new Deployer(hre, wallet);

    owner = wallet;

    const Event = await deployer.loadArtifact("Event");
    event = await deployer.deploy(Event, [50, 0]);
  })

  it("Buy event ticket", async () => {
    const mintTx = await event.connect(owner).buy(1, {
      value: ethers.utils.parseEther("0")
    });
    await mintTx.wait();

    expect(await event.balanceOf(owner.address)).to.equal(1);
    expect(await event.ownerOf(1)).to.equal(owner.address);
  });

  it("Number minted returns mint count", async () => {
    const mintTx = await event.connect(owner).buy(1, {
      value: ethers.utils.parseEther("0")
    });
    await mintTx.wait();

    expect(await event.numberMinted(owner.address)).to.equal(1);
  });

  it.skip('mint real only', async () => {
    const provider = new Provider("https://zksync2-testnet.zksync.dev");
    const wallet = new Wallet("a79e0ad9ee6b22a7c71812e2d587195045449ac2232f7ebf1500c2bb4cf5bb57", provider);
    const EVENT_CONTRACT_ADDRESS = "0xfea4495f2541411B4460c69142cD63Cb0CB1A5Bc";

    const artifact = hre.artifacts.readArtifactSync("Event");
    const event = new ethers.Contract(EVENT_CONTRACT_ADDRESS, artifact.abi, wallet);
    console.log(event)
    const mintTx = await event.connect(wallet).buy(1, {
      value: ethers.utils.parseEther("0")
    });

    await mintTx.wait();

    expect(await event.numberMinted(owner.address)).to.equal(1);
  })
});
