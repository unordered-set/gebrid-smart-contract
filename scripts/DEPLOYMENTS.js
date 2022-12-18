const DATA = {
    beacon: {
        mumbai:  "0x75D7Ed36ca0BE8A77A9A7a781C4642aa1632adcc",
    },
    collectionFactory: {
        mumbai: "0xD98462A21F4334CbF794E221d9D82c061dBFEC1E",
    },
    protoCollection: {
        mumbai: "0x455FEf5297F796fFE1Fa6E431e8C7F70686F90ad",
    },
};
  
module.exports = (alias) => {
return DATA[alias][hre.network.name] || DATA[alias]["default"]
}
