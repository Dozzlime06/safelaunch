const { createWalletClient, createPublicClient, http, parseAbi, formatEther } = require('viem');
const { base } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const FACTORY_ADDRESS = '0x547b22734D72bdEe458F8382ee93cC7a187Bc0fc';

const abi = parseAbi([
  'function tokens(uint256) view returns (address tokenAddress, address creator, string metadataURI, uint256 totalRaised, uint256 totalRefunded, uint256 tokensSold, uint256 deadline, uint256 failedTimestamp, bool bonded, bool failed)',
  'function emergencyWithdraw(uint256 tokenId)',
  'function owner() view returns (address)',
]);

async function main() {
  const tokenId = process.env.TOKEN_ID ? parseInt(process.env.TOKEN_ID) : 1;
  
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.error('DEPLOYER_PRIVATE_KEY not set');
    process.exit(1);
  }

  const account = privateKeyToAccount(`0x${process.env.DEPLOYER_PRIVATE_KEY.replace('0x', '')}`);
  console.log(`Using account: ${account.address}`);
  
  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://base-rpc.publicnode.com'),
  });
  
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http('https://base-rpc.publicnode.com'),
  });

  // Get token info
  const token = await publicClient.readContract({
    address: FACTORY_ADDRESS,
    abi,
    functionName: 'tokens',
    args: [BigInt(tokenId)],
  });
  
  console.log(`\nToken ${tokenId} Info:`);
  console.log(`  Token address: ${token[0]}`);
  console.log(`  Creator: ${token[1]}`);
  console.log(`  Total raised: ${formatEther(token[3])} ETH`);
  console.log(`  Total refunded: ${formatEther(token[4])} ETH`);
  console.log(`  Deadline: ${new Date(Number(token[6]) * 1000).toISOString()}`);
  console.log(`  Bonded: ${token[8]}`);
  console.log(`  Failed: ${token[9]}`);
  
  // Check contract balance
  const balance = await publicClient.getBalance({ address: FACTORY_ADDRESS });
  console.log(`\nContract balance: ${formatEther(balance)} ETH`);
  
  // Check owner
  const owner = await publicClient.readContract({
    address: FACTORY_ADDRESS,
    abi,
    functionName: 'owner',
  });
  console.log(`Contract owner: ${owner}`);
  console.log(`You are owner: ${owner.toLowerCase() === account.address.toLowerCase()}`);

  if (!token[9]) {
    console.log('\nToken is NOT in failed state. Emergency withdraw requires failed state.');
    console.log('Pool funds are still active for the bonding curve.');
    return;
  }

  // Attempt emergency withdraw
  console.log('\nAttempting emergency withdraw...');
  try {
    const hash = await walletClient.writeContract({
      address: FACTORY_ADDRESS,
      abi,
      functionName: 'emergencyWithdraw',
      args: [BigInt(tokenId)],
    });
    console.log(`TX sent: ${hash}`);
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`TX confirmed in block ${receipt.blockNumber}`);
    console.log('Emergency withdraw successful!');
  } catch (error) {
    console.error('Emergency withdraw failed:', error.message);
  }
}

main().catch(console.error);
