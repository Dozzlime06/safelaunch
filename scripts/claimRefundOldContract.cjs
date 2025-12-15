const { createWalletClient, createPublicClient, http, parseAbi, formatEther } = require('viem');
const { base } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const OLD_FACTORY_ADDRESS = '0x547b22734D72bdEe458F8382ee93cC7a187Bc0fc';

console.log('=========================================');
console.log('  OLD CONTRACT REFUND SCRIPT');
console.log('  Contract: ' + OLD_FACTORY_ADDRESS);
console.log('=========================================\n');

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

  const tokensAbi = parseAbi([
    'function tokens(uint256) view returns (address tokenAddress, address creator, string metadataURI, uint256 totalRaised, uint256 totalRefunded, uint256 tokensSold, uint256 deadline, uint256 failedTimestamp, bool bonded, bool failed)',
    'function contributions(uint256, address) view returns (uint256)',
  ]);

  const token = await publicClient.readContract({
    address: OLD_FACTORY_ADDRESS,
    abi: tokensAbi,
    functionName: 'tokens',
    args: [BigInt(tokenId)],
  });

  const deadline = Number(token[6]);
  const now = Math.floor(Date.now() / 1000);
  const isFailed = token[9];
  const totalRaised = token[3];
  const totalRefunded = token[4];
  
  console.log(`\n=== Token ${tokenId} Status ===`);
  console.log(`Total Raised: ${formatEther(totalRaised)} ETH`);
  console.log(`Total Refunded: ${formatEther(totalRefunded)} ETH`);
  console.log(`Deadline: ${new Date(deadline * 1000).toLocaleString()}`);
  console.log(`Failed: ${isFailed}`);
  
  if (now < deadline) {
    const secondsLeft = deadline - now;
    const days = Math.floor(secondsLeft / 86400);
    const hours = Math.floor((secondsLeft % 86400) / 3600);
    const mins = Math.floor((secondsLeft % 3600) / 60);
    const secs = secondsLeft % 60;
    
    console.log(`\n❌ Cannot claim yet!`);
    console.log(`Time remaining: ${days}d ${hours}h ${mins}m ${secs}s`);
    console.log(`Wait until: ${new Date(deadline * 1000).toLocaleString()}`);
    return;
  }

  console.log('\n✅ Deadline passed! Can proceed with refund.');

  const actionAbi = parseAbi([
    'function checkFailed(uint256 tokenId)',
    'function claimRefund(uint256 tokenId)',
  ]);

  if (!isFailed) {
    console.log('\n1. Marking token as FAILED...');
    try {
      const failTx = await walletClient.writeContract({
        address: OLD_FACTORY_ADDRESS,
        abi: actionAbi,
        functionName: 'checkFailed',
        args: [BigInt(tokenId)],
      });
      console.log(`TX: https://basescan.org/tx/${failTx}`);
      await publicClient.waitForTransactionReceipt({ hash: failTx });
      console.log('✅ Token marked as failed!');
    } catch (err) {
      console.error('Error marking failed:', err.message);
      return;
    }
  } else {
    console.log('\n1. Token already marked as failed ✓');
  }

  const contribution = await publicClient.readContract({
    address: OLD_FACTORY_ADDRESS,
    abi: tokensAbi,
    functionName: 'contributions',
    args: [BigInt(tokenId), account.address],
  });

  console.log(`\nYour contribution: ${formatEther(contribution)} ETH`);

  if (contribution === 0n) {
    console.log('\n⚠️ No contribution to refund for this wallet.');
    
    const contractBalance = await publicClient.getBalance({ address: OLD_FACTORY_ADDRESS });
    console.log(`Contract balance: ${formatEther(contractBalance)} ETH`);
    return;
  }

  console.log('\n2. Claiming refund...');
  try {
    const refundTx = await walletClient.writeContract({
      address: OLD_FACTORY_ADDRESS,
      abi: actionAbi,
      functionName: 'claimRefund',
      args: [BigInt(tokenId)],
    });
    console.log(`TX: https://basescan.org/tx/${refundTx}`);
    await publicClient.waitForTransactionReceipt({ hash: refundTx });
    console.log(`\n✅ REFUND CLAIMED: ${formatEther(contribution)} ETH`);
  } catch (err) {
    console.error('Error claiming refund:', err.message);
    return;
  }

  const finalBalance = await publicClient.getBalance({ address: OLD_FACTORY_ADDRESS });
  console.log(`\nContract balance after: ${formatEther(finalBalance)} ETH`);
  console.log('\n=========================================');
  console.log('  REFUND COMPLETE!');
  console.log('=========================================');
}

main().catch(console.error);
