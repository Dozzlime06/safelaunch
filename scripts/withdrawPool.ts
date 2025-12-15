import { ethers } from "hardhat";

const FACTORY_ADDRESS = "0x547b22734D72bdEe458F8382ee93cC7a187Bc0fc";

async function main() {
  const tokenId = process.env.TOKEN_ID ? parseInt(process.env.TOKEN_ID) : 1;
  
  console.log(`Withdrawing pool for token ${tokenId}...`);
  
  const [signer] = await ethers.getSigners();
  console.log(`Using signer: ${signer.address}`);
  
  const factory = await ethers.getContractAt("SafeLaunchFactory", FACTORY_ADDRESS, signer);
  
  // Get token info
  const token = await factory.tokens(tokenId);
  console.log(`Token address: ${token.tokenAddress}`);
  console.log(`Total raised: ${ethers.formatEther(token.totalRaised)} ETH`);
  console.log(`Bonded: ${token.bonded}`);
  console.log(`Failed: ${token.failed}`);
  
  // Check contract balance
  const balance = await ethers.provider.getBalance(FACTORY_ADDRESS);
  console.log(`Contract balance: ${ethers.formatEther(balance)} ETH`);
  
  // If not failed yet and deadline passed, mark as failed first
  const now = Math.floor(Date.now() / 1000);
  if (!token.bonded && !token.failed && Number(token.deadline) < now) {
    console.log("Deadline passed, attempting to trigger failure check...");
    // The contract should have a way to mark as failed - check for checkAndMarkFailed or similar
  }
  
  // For emergency withdraw (owner only, after grace period)
  if (token.failed) {
    try {
      console.log("Attempting emergency withdraw...");
      const tx = await factory.emergencyWithdraw(tokenId);
      console.log(`TX sent: ${tx.hash}`);
      await tx.wait();
      console.log("Emergency withdraw successful!");
    } catch (error: any) {
      console.error("Emergency withdraw failed:", error.message);
    }
  } else {
    console.log("Token not in failed state. Cannot emergency withdraw.");
    console.log("Options:");
    console.log("1. Wait for deadline to pass and token to fail");
    console.log("2. If bonded, LP is locked");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
