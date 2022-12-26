// SPDX-License-Identifier: Undefined

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

contract CollectionFactory {
    address _beacon;

    event CollectionCreated(address indexed);

    constructor (address beacon) {
        _beacon = beacon;
    }

    function createNewCollection(string calldata name_, string calldata symbol_, address owner) public {
        address newCollectionAddress = address(
            new BeaconProxy(_beacon,
                            abi.encodeWithSignature("initialize(string,string,address,address)",
                                                    name_, symbol_, owner, msg.sender))
        );
        emit CollectionCreated(newCollectionAddress);
    }
}