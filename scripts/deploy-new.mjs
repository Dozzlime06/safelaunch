import { ethers } from "ethers";
import fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set");
  
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Deploying with:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (parseFloat(ethers.formatEther(balance)) < 0.002) {
    throw new Error("Insufficient balance for deployment");
  }

  const factoryArtifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/SafeLaunchFactory.sol/SafeLaunchFactory.json", "utf8")
  );

  const POSITION_MANAGER = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
  const WETH = "0x4200000000000000000000000000000000000006";

  // Deploy implementation
  console.log("\n1. Deploying SafeLaunchFactory...");
  const FactoryContract = new ethers.ContractFactory(
    factoryArtifact.abi,
    factoryArtifact.bytecode,
    wallet
  );
  
  const implementation = await FactoryContract.deploy();
  await implementation.waitForDeployment();
  const implAddress = await implementation.getAddress();
  console.log("Contract deployed:", implAddress);

  // Initialize the contract
  console.log("\n2. Initializing contract...");
  const factory = new ethers.Contract(implAddress, factoryArtifact.abi, wallet);
  const initTx = await factory.initialize(POSITION_MANAGER, WETH);
  console.log("Init tx:", initTx.hash);
  await initTx.wait();
  console.log("Initialized!");

  // Verify deployment
  console.log("\n3. Verifying deployment...");
  const factoryRead = new ethers.Contract(implAddress, factoryArtifact.abi, provider);
  console.log("Position Manager:", await factoryRead.positionManager());
  console.log("WETH:", await factoryRead.weth());
  console.log("Owner:", await factoryRead.owner());
  console.log("Fee Wallet:", await factoryRead.FEE_WALLET());
  console.log("Launch Fee:", ethers.formatEther(await factoryRead.launchFee()), "ETH");
  console.log("Bonding Target:", ethers.formatEther(await factoryRead.bondingTarget()), "ETH");
  console.log("Max Buy Per Wallet:", ethers.formatEther(await factoryRead.maxBuyPerWallet()), "ETH");

  console.log("\n========================================");
  console.log("DEPLOYMENT COMPLETE!");
  console.log("========================================");
  console.log("Contract Address:", implAddress);
  console.log("Chain: Base Mainnet (8453)");
  console.log("========================================");
  console.log("\nView on BaseScan:");
  console.log(`https://basescan.org/address/${implAddress}`);
  console.log("\n*** UPDATE client/src/lib/safeLaunchContract.ts ***");
  console.log(`SAFELAUNCH_FACTORY_ADDRESS = '${implAddress}'`);
}

main().catch((error) => {
  console.error("Failed:", error.message);
  process.exit(1);
});
