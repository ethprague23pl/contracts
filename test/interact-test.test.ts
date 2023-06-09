// const { ethers } = require("hardhat");
// import { expect } from "chai";
// import { Wallet, Provider, Contract, utils } from "zksync-web3";
// import * as hre from "hardhat";
// import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

// const RICH_WALLET_PK =
//   '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

// describe("LIVE", () => {
//   let paymaster;
//   let event;
//   let owner;
//   let deployer: Deployer;

//   beforeEach(async () => {
//     const provider = Provider.getDefaultProvider();
//     const wallet = new Wallet('', provider);

//     const deployer = new Deployer(hre, wallet);

//     owner = wallet;

//     const Event = await deployer.loadArtifact("Event");
//     event = await deployer.deploy(Event, ["test-name", "test-key", 50]);
//     console.log(event)
//   })

//   it("Buy event ticket", async () => {
//     const mintTx = await event.connect(owner).mint(1);
//     await mintTx.wait();

//     expect(await event.balanceOf(owner.address)).to.equal(1);
//     expect(await event.ownerOf(1)).to.equal(owner.address);
//   })
// });
