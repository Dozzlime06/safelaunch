import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const abi = [
  { name: 'paused', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { name: 'launchFee', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'tokenCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'owner', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'bondingTarget', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
];

const address = '0x547b22734D72bdEe458F8382ee93cC7a187Bc0fc';

async function check() {
  try {
    console.log('Checking contract at:', address);
    
    const paused = await client.readContract({ address, abi, functionName: 'paused' });
    console.log('Paused:', paused);
    
    const fee = await client.readContract({ address, abi, functionName: 'launchFee' });
    console.log('Launch Fee:', Number(fee) / 1e18, 'ETH');
    
    const count = await client.readContract({ address, abi, functionName: 'tokenCount' });
    console.log('Token Count:', Number(count));
    
    const owner = await client.readContract({ address, abi, functionName: 'owner' });
    console.log('Owner:', owner);

    const target = await client.readContract({ address, abi, functionName: 'bondingTarget' });
    console.log('Bonding Target:', Number(target) / 1e18, 'ETH');
    
    console.log('\nContract is working!');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

check();
