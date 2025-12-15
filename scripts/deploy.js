const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  const POSITION_MANAGER = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
  const WETH = "0x4200000000000000000000000000000000000006";

  console.log("\nDeploying SafeLaunchFactory (UUPS Proxy)...");
  const SafeLaunchFactory = await ethers.getContractFactory("SafeLaunchFactory");
  
  const factory = await upgrades.deployProxy(
    SafeLaunchFactory,
    [POSITION_MANAGER, WETH],
    { 
      initializer: "initialize",
      kind: "uups"
    }
  );

  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  
  console.log("SafeLaunchFactory Proxy:", factoryAddress);

  const implAddress = await upgrades.erc1967.getImplementationAddress(factoryAddress);
  console.log("Implementation:", implAddress);

  console.log("\nVerifying settings...");
  console.log("Position Manager:", await factory.positionManager());
  console.log("WETH:", await factory.weth());
  console.log("Launch Fee:", ethers.formatEther(await factory.launchFee()), "ETH");
  console.log("Trade Fee:", (await factory.tradeFeePercent()).toString(), "bps");
  console.log("Bonding Target:", ethers.formatEther(await factory.bondingTarget()), "ETH");
  console.log("Fee Wallet:", await factory.FEE_WALLET());
  console.log("Owner:", await factory.owner());

  console.log("\n========================================");
  console.log("DEPLOYMENT COMPLETE!");
  console.log("Proxy:", factoryAddress);
  console.log("Implementation:", implAddress);
  console.log("========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
