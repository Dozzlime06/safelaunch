const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (parseFloat(ethers.formatEther(balance)) < 0.005) {
    throw new Error("Insufficient balance for deployment (need ~0.005 ETH)");
  }

  const POSITION_MANAGER = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
  const WETH = "0x4200000000000000000000000000000000000006";

  console.log("\n========================================");
  console.log("DEPLOYING SAFELAUNCHFACTORY WITH UUPS PROXY");
  console.log("========================================\n");

  console.log("1. Deploying implementation + proxy...");
  
  const SafeLaunchFactory = await ethers.getContractFactory("SafeLaunchFactory");
  
  const proxy = await upgrades.deployProxy(
    SafeLaunchFactory,
    [POSITION_MANAGER, WETH],
    { 
      kind: "uups",
      initializer: "initialize"
    }
  );

  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  
  console.log("Proxy deployed:", proxyAddress);

  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("Implementation:", implAddress);

  console.log("\n2. Verifying deployment...");
  console.log("Position Manager:", await proxy.positionManager());
  console.log("WETH:", await proxy.weth());
  console.log("Owner:", await proxy.owner());
  console.log("Fee Wallet:", await proxy.FEE_WALLET());
  console.log("Launch Fee:", ethers.formatEther(await proxy.launchFee()), "ETH");
  console.log("Bonding Target:", ethers.formatEther(await proxy.bondingTarget()), "ETH");
  console.log("Max Buy Per Wallet:", ethers.formatEther(await proxy.maxBuyPerWallet()), "ETH");

  console.log("\n========================================");
  console.log("DEPLOYMENT COMPLETE!");
  console.log("========================================");
  console.log("Proxy Address:", proxyAddress);
  console.log("Implementation:", implAddress);
  console.log("Chain: Base Mainnet (8453)");
  console.log("========================================");
  console.log("\nView on BaseScan:");
  console.log(`https://basescan.org/address/${proxyAddress}`);
  console.log("\n*** UPDATE client/src/lib/safeLaunchContract.ts ***");
  console.log(`SAFELAUNCH_FACTORY_ADDRESS = '${proxyAddress}'`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
