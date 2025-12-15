const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  const POSITION_MANAGER = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
  const WETH = "0x4200000000000000000000000000000000000006";

  // Deploy Implementation
  console.log("\n1. Deploying SafeLaunchFactory implementation...");
  const Factory = await hre.ethers.getContractFactory("SafeLaunchFactory");
  const implementation = await Factory.deploy();
  await implementation.waitForDeployment();
  const implAddress = await implementation.getAddress();
  console.log("Implementation:", implAddress);

  // Deploy ERC1967 Proxy
  console.log("\n2. Deploying ERC1967 Proxy...");
  const initData = Factory.interface.encodeFunctionData("initialize", [POSITION_MANAGER, WETH]);
  
  const proxyBytecode = `0x608060405234801561001057600080fd5b5060405161017f38038061017f833981016040819052610029916100db565b818161003582826100d5565b505080817fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b600080a25050506101a6565b6001600160a01b0381163b6100c05760405162461bcd60e51b815260206004820152602560248201527f455243313936373a206e657720696d706c656d656e746174696f6e206973206e6044820152643790ba3a999760d91b606482015260840160405180910390fd5b60008051602061015f8339815191525550565b6100d2565b905050565b600080604083850312156100ee57600080fd5b82516001600160a01b038116811461010557600080fd5b6020939093015192949293505050565b610ab28061017d6000396000f3fe`;
  
  // Using OpenZeppelin's ERC1967Proxy pattern manually
  const ERC1967Proxy = await hre.ethers.getContractFactory("@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy");
  const proxy = await ERC1967Proxy.deploy(implAddress, initData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log("Proxy:", proxyAddress);

  // Verify
  console.log("\n3. Verifying deployment...");
  const factory = Factory.attach(proxyAddress);
  console.log("Position Manager:", await factory.positionManager());
  console.log("WETH:", await factory.weth());
  console.log("Owner:", await factory.owner());
  console.log("Fee Wallet:", await factory.FEE_WALLET());

  console.log("\n========================================");
  console.log("DEPLOYMENT COMPLETE!");
  console.log("Proxy:", proxyAddress);
  console.log("Implementation:", implAddress);
  console.log("========================================");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
