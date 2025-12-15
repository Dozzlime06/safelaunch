const { run } = require("hardhat");

async function main() {
  const PROXY_ADDRESS = process.env.PROXY_ADDRESS;
  const IMPL_ADDRESS = process.env.IMPL_ADDRESS;

  if (!PROXY_ADDRESS || !IMPL_ADDRESS) {
    console.log("Usage: PROXY_ADDRESS=0x... IMPL_ADDRESS=0x... npx hardhat run scripts/verify.js --network base");
    process.exit(1);
  }

  console.log("Verifying SafeLaunchFactory implementation...");

  try {
    await run("verify:verify", {
      address: IMPL_ADDRESS,
      constructorArguments: []
    });
    console.log("Implementation verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Implementation already verified");
    } else {
      console.error("Verification failed:", error.message);
    }
  }

  console.log("\nProxy Address:", PROXY_ADDRESS);
  console.log("Implementation Address:", IMPL_ADDRESS);
  console.log("\nView on BaseScan: https://basescan.org/address/" + PROXY_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
