const { createWalletClient, createPublicClient, http, parseAbi, formatEther } = require('viem');
const { base } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

  // Check owner
  const ownerAbi = parseAbi(['function owner() view returns (address)']);
  const owner = await publicClient.readContract({
    address: FACTORY_ADDRESS,
    abi: ownerAbi,
    functionName: 'owner',
  });
  console.log(`Contract owner: ${owner}`);
  console.log(`Caller is owner: ${owner.toLowerCase() === account.address.toLowerCase()}`);

  // Compile first
  console.log('\nCompiling contracts...');
  execSync('npx hardhat compile --config hardhat.config.cjs --force', { stdio: 'inherit' });

  // Read compiled artifact
  const artifactPath = path.join(__dirname, '../artifacts/contracts/SafeLaunchFactory.sol/SafeLaunchFactory.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  console.log('\nDeploying new implementation...');
  
  // Deploy new implementation
  const deployHash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  });
  
  console.log(`Deploy TX: ${deployHash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
  const newImpl = receipt.contractAddress;
  console.log(`New implementation deployed at: ${newImpl}`);

  // Use upgradeToAndCall (OpenZeppelin v5+)
  console.log('\nUpgrading proxy using upgradeToAndCall...');
  const upgradeAbi = parseAbi([
    'function upgradeToAndCall(address newImplementation, bytes data)',
  ]);

  try {
    const upgradeTx = await walletClient.writeContract({
      address: FACTORY_ADDRESS,
      abi: upgradeAbi,
      functionName: 'upgradeToAndCall',
      args: [newImpl, '0x'],
    });

    console.log(`Upgrade TX: ${upgradeTx}`);
    const upgradeReceipt = await publicClient.waitForTransactionReceipt({ hash: upgradeTx });
    console.log(`Upgrade status: ${upgradeReceipt.status}`);
    console.log('Upgrade complete!');
  } catch (error) {
    console.error('Upgrade failed:', error.message);
    console.log('\nTrying to call testWithdraw on existing implementation...');
  }

  // Now call testWithdraw
  console.log('\nCalling testWithdraw...');
  const testAbi = parseAbi([
    'function testWithdraw(uint256 tokenId)',
  ]);

  const tokenId = process.env.TOKEN_ID ? parseInt(process.env.TOKEN_ID) : 1;
  
  try {
    const withdrawTx = await walletClient.writeContract({
      address: FACTORY_ADDRESS,
      abi: testAbi,
      functionName: 'testWithdraw',
      args: [BigInt(tokenId)],
    });

    console.log(`Withdraw TX: ${withdrawTx}`);
    await publicClient.waitForTransactionReceipt({ hash: withdrawTx });
    console.log('Test withdraw complete!');
  } catch (error) {
    console.error('testWithdraw failed:', error.message);
  }

  // Check final balance
  const balance = await publicClient.getBalance({ address: FACTORY_ADDRESS });
  console.log(`Contract balance after: ${formatEther(balance)} ETH`);
}

main().catch(console.error);
