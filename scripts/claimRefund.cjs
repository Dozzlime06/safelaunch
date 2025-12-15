const { createWalletClient, createPublicClient, http, parseAbi, formatEther } = require('viem');
const { base } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const FACTORY_ADDRESS = '0x547b22734D72bdEe458F8382ee93cC7a187Bc0fc';

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.error('DEPLOYER_PRIVATE_KEY not set');
    process.exit(1);
  }

  const account = privateKeyToAccount(`0x${process.env.DEPLOYER_PRIVATE_KEY.replace('0x', '')}`);
  console.log(`Using account: ${account.address}`);

  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  const tokenId = process.env.TOKEN_ID ? parseInt(process.env.TOKEN_ID) : 1;

  // Check token status
  const tokensAbi = parseAbi([
    'function tokens(uint256) view returns (address tokenAddress, address creator, string metadataURI, uint256 totalRaised, uint256 totalRefunded, uint256 tokensSold, uint256 deadline, uint256 failedTimestamp, bool bonded, bool failed)',
    'function contributions(uint256, address) view returns (uint256)',
  ]);

  const token = await publicClient.readContract({
    address: FACTORY_ADDRESS,
    abi: tokensAbi,
    functionName: 'tokens',
    args: [BigInt(tokenId)],
  });

  const deadline = Number(token[6]);
  const now = Math.floor(Date.now() / 1000);
  const isFailed = token[9];
  
  console.log(`\nToken ${tokenId} Status:`);
  console.log(`Deadline: ${new Date(deadline * 1000).toISOString()}`);
  console.log(`Total Raised: ${formatEther(token[3])} ETH`);
  console.log(`Failed: ${isFailed}`);
  
  if (now < deadline) {
    const hoursLeft = (deadline - now) / 3600;
    console.log(`\n❌ Cannot claim yet. Deadline in ${hoursLeft.toFixed(1)} hours.`);
    console.log(`Wait until: ${new Date(deadline * 1000).toLocaleString()}`);
    return;
  }

  const actionAbi = parseAbi([
    'function checkFailed(uint256 tokenId)',
    'function claimRefund(uint256 tokenId)',
  ]);

  // Step 1: Mark as failed if not already
  if (!isFailed) {
    console.log('\n1. Calling checkFailed...');
    const failTx = await walletClient.writeContract({
      address: FACTORY_ADDRESS,
      abi: actionAbi,
      functionName: 'checkFailed',
      args: [BigInt(tokenId)],
    });
    console.log(`TX: ${failTx}`);
    await publicClient.waitForTransactionReceipt({ hash: failTx });
    console.log('✅ Token marked as failed');
  } else {
    console.log('\n1. Token already marked as failed');
  }

  // Check contribution
  const contribution = await publicClient.readContract({
    address: FACTORY_ADDRESS,
    abi: tokensAbi,
    functionName: 'contributions',
    args: [BigInt(tokenId), account.address],
  });

  console.log(`\nYour contribution: ${formatEther(contribution)} ETH`);

  if (contribution === 0n) {
    console.log('No contribution to refund.');
    return;
  }

  // Step 2: Claim refund
  console.log('\n2. Calling claimRefund...');
  const refundTx = await walletClient.writeContract({
    address: FACTORY_ADDRESS,
    abi: actionAbi,
    functionName: 'claimRefund',
    args: [BigInt(tokenId)],
  });
  console.log(`TX: ${refundTx}`);
  await publicClient.waitForTransactionReceipt({ hash: refundTx });
  console.log(`✅ Refund claimed: ${formatEther(contribution)} ETH`);

  // Final balance
  const balance = await publicClient.getBalance({ address: FACTORY_ADDRESS });
  console.log(`\nContract balance after: ${formatEther(balance)} ETH`);
}

main().catch(console.error);
