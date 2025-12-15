import { createWalletClient, createPublicClient, http, encodeFunctionData, encodeAbiParameters, concat } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';

const ERC1967_PROXY_BYTECODE = '0x60806040526040516103cf3803806103cf8339810160408190526100229161023b565b61002c8282610033565b5050610320565b61003c82610091565b6040516001600160a01b038316907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b905f90a280511561008557610080828261010c565b505050565b61008d61017f565b5050565b806001600160a01b03163b5f036100cb57604051634c9c8ce360e01b81526001600160a01b03821660048201526024015b60405180910390fd5b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80546001600160a01b0319166001600160a01b0392909216919091179055565b60605f5f846001600160a01b031684604051610128919061030a565b5f60405180830381855af49150503d805f8114610160576040519150601f19603f3d011682016040523d82523d5f602084013e610165565b606091505b5090925090506101768583836101a0565b95945050505050565b341561019e5760405163b398979f60e01b815260040160405180910390fd5b565b6060826101b5576101b0826101ff565b6101f8565b81511580156101cc57506001600160a01b0384163b155b156101f557604051639996b31560e01b81526001600160a01b03851660048201526024016100c2565b50805b9392505050565b80511561020e57805160208201fd5b60405163d6bda27560e01b815260040160405180910390fd5b634e487b7160e01b5f52604160045260245ffd5b5f5f6040838503121561024c575f5ffd5b82516001600160a01b0381168114610262575f5ffd5b60208401519092506001600160401b0381111561027d575f5ffd5b8301601f8101851361028d575f5ffd5b80516001600160401b038111156102a6576102a6610227565b604051601f8201601f19908116603f011681016001600160401b03811182821017156102d4576102d4610227565b6040528181528282016020018710156102eb575f5ffd5b8160208401602083015e5f602083830101528093505050509250929050565b5f82518060208501845e5f920191825250919050565b60a38061032c5f395ff3fe6080604052600a600c565b005b60186014601a565b6050565b565b5f604b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546001600160a01b031690565b905090565b365f5f375f5f365f845af43d5f5f3e8080156069573d5ff35b3d5ffdfea264697066735822122023d00a10d61ae41686f714f0e97344848b3227e238c22c1e24cd7f858228f98864736f6c634300081b0033';

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.error('DEPLOYER_PRIVATE_KEY not set');
    process.exit(1);
  }

  const account = privateKeyToAccount(`0x${process.env.DEPLOYER_PRIVATE_KEY.replace('0x', '')}`);
  console.log("Deploying with account:", account.address);

  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Balance:", (Number(balance) / 1e18).toFixed(6), "ETH");

  if (Number(balance) < 0.005e18) {
    throw new Error("Insufficient balance for deployment (need ~0.005 ETH)");
  }

  const POSITION_MANAGER = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
  const WETH = "0x4200000000000000000000000000000000000006";

  const factoryArtifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/SafeLaunchFactory.sol/SafeLaunchFactory.json", "utf8")
  );

  console.log("\n========================================");
  console.log("DEPLOYING SAFELAUNCHFACTORY WITH UUPS PROXY");
  console.log("========================================\n");

  console.log("1. Deploying implementation...");
  
  const implHash = await walletClient.deployContract({
    abi: factoryArtifact.abi,
    bytecode: factoryArtifact.bytecode,
  });
  
  console.log("Implementation TX:", implHash);
  const implReceipt = await publicClient.waitForTransactionReceipt({ hash: implHash });
  const implAddress = implReceipt.contractAddress;
  console.log("Implementation deployed:", implAddress);

  console.log("\n2. Deploying ERC1967 Proxy...");
  
  const initData = encodeFunctionData({
    abi: factoryArtifact.abi,
    functionName: 'initialize',
    args: [POSITION_MANAGER, WETH],
  });

  const proxyAbi = parseAbi([
    'constructor(address _logic, bytes memory _data)',
  ]);

  const proxyDeployData = encodeDeployData({
    abi: proxyAbi,
    bytecode: ERC1967_PROXY_BYTECODE,
    args: [implAddress, initData],
  });

  const proxyHash = await walletClient.sendTransaction({
    data: proxyDeployData,
  });

  console.log("Proxy TX:", proxyHash);
  const proxyReceipt = await publicClient.waitForTransactionReceipt({ hash: proxyHash });
  const proxyAddress = proxyReceipt.contractAddress;
  console.log("Proxy deployed:", proxyAddress);

  console.log("\n3. Verifying deployment...");
  
  const factoryContract = {
    address: proxyAddress,
    abi: factoryArtifact.abi,
  };

  const [posManager, weth, owner, feeWallet, launchFee, bondingTarget, maxBuy] = await Promise.all([
    publicClient.readContract({ ...factoryContract, functionName: 'positionManager' }),
    publicClient.readContract({ ...factoryContract, functionName: 'weth' }),
    publicClient.readContract({ ...factoryContract, functionName: 'owner' }),
    publicClient.readContract({ ...factoryContract, functionName: 'FEE_WALLET' }),
    publicClient.readContract({ ...factoryContract, functionName: 'launchFee' }),
    publicClient.readContract({ ...factoryContract, functionName: 'bondingTarget' }),
    publicClient.readContract({ ...factoryContract, functionName: 'maxBuyPerWallet' }),
  ]);

  console.log("Position Manager:", posManager);
  console.log("WETH:", weth);
  console.log("Owner:", owner);
  console.log("Fee Wallet:", feeWallet);
  console.log("Launch Fee:", (Number(launchFee) / 1e18), "ETH");
  console.log("Bonding Target:", (Number(bondingTarget) / 1e18), "ETH");
  console.log("Max Buy Per Wallet:", (Number(maxBuy) / 1e18), "ETH");

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
  console.log("\n*** SAVE THESE ADDRESSES ***");
  console.log(`IMPLEMENTATION: ${implAddress}`);
  console.log(`PROXY: ${proxyAddress}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error.message || error);
  process.exit(1);
});
