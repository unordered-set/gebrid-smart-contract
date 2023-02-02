const DATA = {
    beacon: {
        mumbai: "0x59a466e8b66362B328aa8af9a5C2E9f6B3ba297C",
    },
    collectionFactory: {
        mumbai: "0x5DB3e93B8F79D72A1da17d581E41E9887674011b",
    },
    protoCollection: {
        mumbai: "0x2A0eA9e141F3E5e9C06A8fDD16874cC34c90714F",
    },
};
  
module.exports = (alias) => {
return DATA[alias][hre.network.name] || DATA[alias]["default"]
}
