// SPDX-License-Identifier: Undefined

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableMapUpgradeable.sol";


contract Collection is ERC721URIStorageUpgradeable, AccessControlUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    event ItemListed(uint256 tokenId);
    event ItemDelisted(uint256 tokenId);

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    CountersUpgradeable.Counter _counter;
    using EnumerableMapUpgradeable for EnumerableMapUpgradeable.AddressToUintMap;
    mapping(uint256 => EnumerableMapUpgradeable.AddressToUintMap) _prices;

    /* |owner| is an address of an artist. They are pure owners with unlimited power.
       |manager| is an address of our backend, it just helps to keep the contract tidy. */
    function initialize(string calldata name_, string calldata symbol_, address owner, address manager) public initializer {
        __ERC721_init(name_, symbol_);
        __AccessControl_init();
        __ERC721URIStorage_init();

        _grantRole(DEFAULT_ADMIN_ROLE, owner);
        _grantRole(MANAGER_ROLE, manager);
    }

    /* |tokens| - is a list of addresses which are accepted as payments. Native tokens should be wrapped.
       |prices| - array of the same length as |tokens|, where i-th price is the price in i-th token.
    */
    function addObjects(uint8 amount, string memory uri, address[] memory tokens, uint256[] memory prices) external onlyRole(MANAGER_ROLE) {
        for (uint8 i = 0; i < amount; ++i) {
            _mint(address(this), _counter.current());
            _setTokenURI(_counter.current(), uri);
            _setPrice(_counter.current(), tokens, prices);
            if (tokens.length > 0) emit ItemListed(_counter.current());
            _counter.increment();
        }
    }

    function setPrice(uint256[] memory tokensIds, address[] memory tokens, uint256[] memory prices) external onlyRole(MANAGER_ROLE) {
        uint256 len = tokensIds.length;
        for (uint256 i = 0; i < len; ) {
            _setPrice(tokensIds[i], tokens, prices);
            unchecked {
                ++i;
            }
        }
    }

    function delist(uint256[] memory tokenIds) external onlyRole(MANAGER_ROLE) {
        uint256 len = tokenIds.length;
        for (uint256 i = 0; i < len; ) {
            delete(_prices[tokenIds[i]]);
            emit ItemDelisted(tokenIds[i]);
            unchecked {
                ++i;
            }
        }
    }

    function withdraw(address[] memory tokenAddresses) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 len = tokenAddresses.length;
        for (uint256 i = 0; i < len; ) {
            IERC20Upgradeable token = IERC20Upgradeable(tokenAddresses[i]);
            require(token.transfer(msg.sender, token.balanceOf(address(this))));

            unchecked {
                ++i;
            }
        }
    }

    function _setPrice(uint256 tokenId, address[] memory tokens, uint256[] memory prices) internal {
        uint256 len = tokens.length;
        require(len == prices.length);
        delete(_prices[tokenId]);
        for (uint256 i = 0; i < len; ) {
            _prices[tokenId].set(tokens[i], prices[i]);
            unchecked {
                ++i;
            }
        }
        emit ItemListed(tokenId);
    }

    /* |token| is a ERC-20 address of token contract */
    function buy(uint256 tokenId, address token) external {
        require(_prices[tokenId].get(token) > 0);
        require(IERC20Upgradeable(token).transferFrom(msg.sender, address(this), _prices[tokenId].get(token)));
        delete(_prices[tokenId]);
        _safeTransfer(address(this), msg.sender, tokenId, "");
        emit ItemDelisted(tokenId);
    }

    function getPrice(uint256 tokenId) external view returns (address[] memory tokens, uint256[] memory prices) {
        uint256 pricesLen = _prices[tokenId].length();
        tokens = new address[](pricesLen);
        prices = new uint256[](pricesLen);
        for (uint256 i = 0; i < pricesLen; ) {
            (address cToken, uint256 cPrice) = _prices[tokenId].at(i);
            tokens[i] = cToken;
            prices[i] = cPrice;
            unchecked { ++i; }
        }
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return ERC721Upgradeable.supportsInterface(interfaceId) || AccessControlUpgradeable.supportsInterface(interfaceId);
    }
}