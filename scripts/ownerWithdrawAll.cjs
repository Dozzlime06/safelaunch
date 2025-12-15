const { createPublicClient, createWalletClient, http, parseAbi, formatEther } = require('viem');
const { base } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const CONTRACT = '0xc72C354Bd1608D5e79b822DC4416Cd039BAd8524';

async function main() {
  console.log('========================================');
  console.log('  OWNER WITHDRAW ALL - NEW CONTRACT');
  console.log('  Contract:', CONTRACT);
  console.log('========================================\n');

  const publicClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') });
  
  const balance = await publicClient.getBalance({ address: CONTRACT });
  console.log('Contract balance:', formatEther(balance), 'ETH');
  
  if (balance === 0n) {
    console.log('\n⚠️ No ETH to withdraw - contract is empty');
    console.log('Launch a token first to add ETH to the contract.');
    return;
  }
  
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.log('\n❌ DEPLOYER_PRIVATE_KEY not set');
    return;
  }
  
  const account = privateKeyToAccount(`0x${process.env.DEPLOYER_PRIVATE_KEY.replace('0x', '')}`);
  console.log('Owner wallet:', account.address);
  
  const walletClient = createWalletClient({ account, chain: base, transport: http('https://mainnet.base.org') });
  
  const abi = parseAbi(['function ownerWithdrawAll()']);
  
  console.log('\nCalling ownerWithdrawAll()...');
  const tx = await walletClient.writeContract({
    address: CONTRACT,
    abi,
    functionName: 'ownerWithdrawAll',
  });
  console.log('TX:', `https://basescan.org/tx/${tx}`);
  await publicClient.waitForTransactionReceipt({ hash: tx });
  
  const newBalance = await publicClient.getBalance({ address: CONTRACT });
  console.log('\n✅ Withdraw complete!');
  console.log('Withdrawn:', formatEther(balance), 'ETH');
  console.log('Contract balance now:', formatEther(newBalance), 'ETH');
}

main().catch(console.error);
