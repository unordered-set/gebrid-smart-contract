// SPDX-License-Identifier: Undefined

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";


contract FreeToken is ERC20Upgradeable {
    function mint() external {
        _mint(msg.sender, 1 ether);
    }
}