import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY not set");
  
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("Using wallet:", wallet.address);

  const abi = [
    "function setFees(uint256 _launchFee, uint256 _tradeFeePercent) external",
    "function launchFee() view returns (uint256)",
    "function tradeFeePercent() view returns (uint256)",
  ];

  const address = '0x547b22734D72bdEe458F8382ee93cC7a187Bc0fc';
  const factory = new ethers.Contract(address, abi, wallet);

  console.log("\nCurrent settings:");
  console.log("Launch Fee:", ethers.formatEther(await factory.launchFee()), "ETH");
  console.log("Trade Fee:", (await factory.tradeFeePercent()).toString(), "basis points (1% = 100)");

  console.log("\nSetting launch fee to 0...");
  const tx = await factory.setFees(0, 100); // 0 launch fee, keep 1% trade fee
  console.log("Tx:", tx.hash);
  await tx.wait();

  console.log("\nNew settings:");
  console.log("Launch Fee:", ethers.formatEther(await factory.launchFee()), "ETH");
  console.log("Trade Fee:", (await factory.tradeFeePercent()).toString(), "basis points");

  console.log("\nDone! Launch fee is now FREE!");
}

main().catch((error) => {
  console.error("Failed:", error.message);
  process.exit(1);
});
