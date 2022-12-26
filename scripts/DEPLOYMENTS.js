const DATA = {
    beacon: {
        mumbai: "0x59a466e8b66362B328aa8af9a5C2E9f6B3ba297C",
    },
    collectionFactory: {
        mumbai: "0x0509F8377114e43673b1C3B7fa1BEE1ad0eBAEF0",
    },
    protoCollection: {
        mumbai: "0x2A0eA9e141F3E5e9C06A8fDD16874cC34c90714F",
    },
};
  
module.exports = (alias) => {
return DATA[alias][hre.network.name] || DATA[alias]["default"]
}
