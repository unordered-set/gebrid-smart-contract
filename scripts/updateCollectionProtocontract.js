const { ethers } = require("hardhat");
const getDeployment = require("./DEPLOYMENTS");


async function main() {
  const Beacon = await ethers.getContractFactory("UpgradeableBeacon")
  const CollectionProtocontract = await ethers.getContractFactory("Collection")

  let beaconAddress = getDeployment("beacon");
  const beacon = Beacon.attach(beaconAddress)

  const collectionprotocontract = await CollectionProtocontract.deploy();
  await collectionprotocontract.deployed();
  console.log(`Deployed CollectionProtocontract to ${collectionprotocontract.address}`)

  const upgradeTx = await beacon.upgradeTo(collectionprotocontract.address)
  await upgradeTx.wait()
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  