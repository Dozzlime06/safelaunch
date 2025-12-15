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

  const factoryArtifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/SafeLaunchFactory.sol/SafeLaunchFactory.json", "utf8")
  );

  const POSITION_MANAGER = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
  const WETH = "0x4200000000000000000000000000000000000006";

  // Use already deployed implementation
  const implAddress = "0xa1a6f3FE7FE882831ae7CD5F0e27AF01F0dcB39A";
  console.log("\nUsing deployed implementation:", implAddress);

  // Initialize the implementation directly (non-upgradeable mode)
  console.log("\n1. Initializing contract...");
  const factory = new ethers.Contract(implAddress, factoryArtifact.abi, wallet);
  
  try {
    const tx = await factory.initialize(POSITION_MANAGER, WETH);
    console.log("Init tx:", tx.hash);
    await tx.wait();
    console.log("Initialized!");
  } catch (e) {
    if (e.message.includes("already initialized") || e.message.includes("Initializable")) {
      console.log("Already initialized, checking state...");
    } else {
      throw e;
    }
  }

  // Verify
  console.log("\n2. Verifying deployment...");
  const factoryRead = new ethers.Contract(implAddress, factoryArtifact.abi, provider);
  console.log("Position Manager:", await factoryRead.positionManager());
  console.log("WETH:", await factoryRead.weth());
  console.log("Owner:", await factoryRead.owner());
  console.log("Fee Wallet:", await factoryRead.FEE_WALLET());
  console.log("Launch Fee:", ethers.formatEther(await factoryRead.launchFee()), "ETH");
  console.log("Bonding Target:", ethers.formatEther(await factoryRead.bondingTarget()), "ETH");

  console.log("\n========================================");
  console.log("DEPLOYMENT COMPLETE!");
  console.log("========================================");
  console.log("Contract Address:", implAddress);
  console.log("Chain: Base Mainnet (8453)");
  console.log("========================================");
  console.log("\nView on BaseScan:");
  console.log(`https://basescan.org/address/${implAddress}`);
}

main().catch((error) => {
  console.error("Failed:", error.message);
  process.exit(1);
});
