import { createPublicClient, http, encodeFunctionData, parseEther } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const abi = [
  {
    name: 'createToken',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'metadataURI', type: 'string' },
      { name: 'durationHours', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
];

const address = '0x547b22734D72bdEe458F8382ee93cC7a187Bc0fc';

async function test() {
  try {
    const testMetadata = JSON.stringify({ name: 'Test', symbol: 'TEST', description: 'test', image: '' });
    const base64 = Buffer.from(testMetadata).toString('base64');
    const metadataURI = `data:application/json;base64,${base64}`;

    console.log('Testing createToken simulation...');
    console.log('Contract:', address);
    console.log('Name: Test, Symbol: TEST, Duration: 48h');
    console.log('Value: 0.001 ETH');
    
    const data = encodeFunctionData({
      abi,
      functionName: 'createToken',
      args: ['Test', 'TEST', metadataURI, 48n],
    });
    
    console.log('\nEncoded data (first 100 chars):', data.slice(0, 100));
    console.log('Function selector:', data.slice(0, 10));

    const result = await client.call({
      to: address,
      data,
      value: parseEther('0.001'),
      account: '0x0315eCb53F64b7A4bA56bb8A4DAB0D96F0856b60',
    });
    
    console.log('\nSimulation SUCCESS!');
    console.log('Result:', result);
  } catch (e) {
    console.error('\nSimulation FAILED:');
    console.error('Error:', e.message);
    if (e.cause) console.error('Cause:', e.cause);
  }
}

test();
