// SPDX-License-Identifier: Undefined

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

contract CollectionFactory {
    address _beacon;

    event CollectionCreated(address indexed);

    constructor (address beacon) {
        _beacon = beacon;
    }

    function createNewCollection(string memory name_, string memory symbol_) public {
        address newCollectionAddress = address(new BeaconProxy(_beacon, abi.encodeWithSignature("initialize(string,string)", name_, symbol_)));
        emit CollectionCreated(newCollectionAddress);
    }
}