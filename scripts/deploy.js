const { ethers } = require("hardhat");
const getDeployment = require("./DEPLOYMENTS");


async function main() {
  const Beacon = await ethers.getContractFactory("UpgradeableBeacon")
  const CollectionProtocontract = await ethers.getContractFactory("Collection");
  const Factory = await ethers.getContractFactory("CollectionFactory");

  let beaconAddress = getDeployment("beacon"),
      collectionprotocontract = getDeployment("protoCollection"),
      factory = getDeployment("collectionFactory");
  let beacon;

  if (!collectionprotocontract) {
    collectionprotocontract = await CollectionProtocontract.deploy();
    await collectionprotocontract.deployed();
    console.log(`Deployed CollectionProtocontract to ${collectionprotocontract.address}`)
  }
  if (!beaconAddress) {
    beacon = await Beacon.deploy(collectionprotocontract.address)
    await beacon.deployed()
    console.log(`Deployed Beacon to ${beacon.address}`)
  } else {
    beacon = Beacon.attach(beaconAddress);
    console.log(`Attached to Beacon @ ${beaconAddress}`)
  }
  if (!factory) {
    factory = await Factory.deploy(beacon.address);
    await factory.deployed();
    console.log(`Deployed Factory to ${factory.address}`)
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
