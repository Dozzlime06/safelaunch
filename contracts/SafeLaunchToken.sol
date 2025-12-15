// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SafeLaunchToken is ERC20 {
    address public immutable factory;
    string public metadataURI;

    constructor(
        string memory name,
        string memory symbol,
        string memory _metadataURI,
        address _factory
    ) ERC20(name, symbol) {
        factory = _factory;
        metadataURI = _metadataURI;
        _mint(_factory, 1_000_000_000 * 1e18);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
