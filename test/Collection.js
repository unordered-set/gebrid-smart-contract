const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
const { ethers } = require("hardhat");
  
describe("Collection Deployment", function () {
    async function deployment() {
        const [admin] = await ethers.getSigners();
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
            const tx = await factory.createNewCollection(name, symbol, admin.address);
            const effects = await tx.wait();
            const creationEvent = effects.events.filter(e => e.event === 'CollectionCreated');
            expect(creationEvent).to.have.lengthOf(1);
            return CollectionProtocontract.attach(creationEvent[0].args[0]);
        }
  
      return { admin, createNewCollection };
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

describe("Collection livecycle", () => {
  const deployment = async () => {
    const [admin, owner, manager, buyer] = await ethers.getSigners();

    const Collection = await ethers.getContractFactory("Collection");
    const collection = await Collection.deploy();
    await collection.deployed();
    const tx = await collection.initialize("XCOL", "COL-X", owner.address, manager.address);
    await tx.wait()

    const FreeToken = await ethers.getContractFactory("FreeToken")
    const freetoken = await FreeToken.deploy()
    await freetoken.deployed()

    const mintTx = await freetoken.connect(buyer).mint()
    await mintTx.wait()

    const addNewObject = async (amount, price) => {
      const contract = collection.connect(manager);
      let tx;
      if (price === undefined) {
        tx = await contract.addObjects(amount, `http://example.com/${amount}@${price}`, [], [])
      } else {
        tx = await contract.addObjects(amount, `http://example.com/${amount}@${price}`, [freetoken.address], [ethers.BigNumber.from(price)])
      }
      const effects = await tx.wait()
      return effects.events.filter(e => 
        e.event === 'Transfer' &&
        e.args[0] === '0x0000000000000000000000000000000000000000' &&
        e.args[1] === contract.address
      ).map(e => e.args[2]);
    }

    const changePrice = async (tokenId, price) => {
      const contract = collection.connect(manager);
      const tx = await contract.setPrice([tokenId], [freetoken.address], [ethers.BigNumber.from(price)]);
      await tx.wait()
    }

    const delist = async (tokenId) => {
      const contract = collection.connect(manager);
      const tx = await contract.delist([tokenId]);
      await tx.wait()
    }

    const buy = async (tokenId, price) => {
      const contract = collection.connect(buyer)
      const approveTx = await freetoken.connect(buyer).approve(contract.address, price)
      await approveTx.wait()
      const balanceBeforeTx = await freetoken.balanceOf(buyer.address)
      const tx = await contract.buy(tokenId, freetoken.address)
      await tx.wait()
      const balanceAfterTx = await freetoken.balanceOf(buyer.address)
      expect(balanceBeforeTx.sub(balanceAfterTx)).to.be.equal(ethers.BigNumber.from(price))
      expect(await collection.ownerOf(tokenId)).to.be.equal(buyer.address)
    }

    return { admin, owner, manager, buyer, addNewObject, collection, buy, freetoken, changePrice, delist }
  }

  it("Does not allow to not-manager to add a new object", async () => {
    const { collection, admin } = await loadFixture(deployment);
    const contract = collection.connect(admin);
    await expect(contract.addObjects(1, `http://example.com/${1}@${0}`, [], [])).to.be.revertedWith(/AccessControl: account .* is missing role 0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08/)
  })

  it("Allows to add a new object without price and not allow to buy", async () => {
    const { addNewObject, collection, buyer, freetoken } = await loadFixture(deployment);
    const objects = await addNewObject(1);
    expect(objects).to.have.length(1);
    expect(await collection.tokenURI(objects[0])).to.be.equal("http://example.com/1@undefined")
    await expect(collection.connect(buyer).buy(objects[0], freetoken.address)).to.be.rejected;
  })

  it("Allows to add a new object with price and allow to buy", async () => {
    const { addNewObject, collection, buy, buyer } = await loadFixture(deployment);
    const objects = await addNewObject(2, "500000000000000000");
    expect(objects).to.have.length(2);
    expect(await collection.tokenURI(objects[0])).to.be.equal("http://example.com/2@500000000000000000")
    await buy(objects[0], "500000000000000000")
    expect(await collection.ownerOf(objects[1])).to.be.not.equal(buyer.address)
  })

  it("Allows to add a new object with price and then change it and then buy", async () => {
    const { addNewObject, buy, changePrice } = await loadFixture(deployment);
    const objects = await addNewObject(2, "100000000000000000")
    await changePrice(objects[0], "200000000000000000")
    await buy(objects[0], "200000000000000000")
    await buy(objects[1], "100000000000000000")
  })

  it("Allows to add a new object with price and then delist and then not allow to buy", async () => {
    const { addNewObject, collection, buy, buyer, delist, freetoken } = await loadFixture(deployment);
    const objects = await addNewObject(2, "100000000000000000")
    await delist(objects[0])
    await buy(objects[1], "100000000000000000")
    await expect(collection.connect(buyer).buy(objects[0], freetoken.address)).to.be.rejected;
  })
})