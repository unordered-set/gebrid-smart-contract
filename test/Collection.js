const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
const { ethers } = require("hardhat");
  
describe("Collection Deployment", function () {
    async function deployment() {
        const CollectionProtocontract = await ethers.getContractFactory("Collection");
        const collectionprotocontract = await CollectionProtocontract.deploy();
        await collectionprotocontract.deployed();
        
        const Beacon = await ethers.getContractFactory("UpgradeableBeacon")
        const beacon = await Beacon.deploy(collectionprotocontract.address)
        await beacon.deployed()

        const Factory = await ethers.getContractFactory("CollectionFactory");
        const factory = await Factory.deploy(beacon.address);
        await factory.deployed();

        const createNewCollection = async (name, symbol) => {
            const tx = await factory.createNewCollection(name, symbol);
            const effects = await tx.wait();
            const creationEvent = effects.events.filter(e => e.event === 'CollectionCreated');
            expect(creationEvent).to.have.lengthOf(1);
            return CollectionProtocontract.attach(creationEvent[0].args[0]);
        }
  
      return { createNewCollection };
    }
  
    describe("Deployment", function () {
      it("New collection is created", async function () {
        const { createNewCollection } = await loadFixture(deployment);
        const collection1 = await createNewCollection("Collection1", "C1");
        const collection2 = await createNewCollection("Collection2", "C2");
        expect(await collection1.name()).to.be.equal("Collection1");
        expect(await collection2.name()).to.be.equal("Collection2");
      });
    });
})