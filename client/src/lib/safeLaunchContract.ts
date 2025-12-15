import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';

export const SAFELAUNCH_FACTORY_ADDRESS = '0xc72C354Bd1608D5e79b822DC4416Cd039BAd8524' as const;
export const BONDING_TARGET = 8.5; // ETH

export const safeLaunchAbi = [
  {
    name: 'tokenCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'tokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'creator', type: 'address' },
      { name: 'metadataURI', type: 'string' },
      { name: 'totalRaised', type: 'uint256' },
      { name: 'totalRefunded', type: 'uint256' },
      { name: 'tokensSold', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'failedTimestamp', type: 'uint256' },
      { name: 'bonded', type: 'bool' },
      { name: 'failed', type: 'bool' },
    ],
  },
  {
    name: 'getContribution',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'id', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getTokenBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'id', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getCurrentPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getRemainingSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getTokensForETH',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'ethAmount', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'launchFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'tradeFeePercent',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'bondingTarget',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'maxBuyPerWallet',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'createToken',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'symbol', type: 'string', internalType: 'string' },
      { name: 'metadataURI', type: 'string', internalType: 'string' },
      { name: 'durationHours', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
  },
  {
    name: 'buy',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'claimRefund',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'claimTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'checkFailed',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'TokenCreated',
    type: 'event',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'tokenAddress', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'metadataURI', type: 'string', indexed: false },
      { name: 'deadline', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Buy',
    type: 'event',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'ethAmount', type: 'uint256', indexed: false },
      { name: 'tokenAmount', type: 'uint256', indexed: false },
      { name: 'totalRaised', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Bonded',
    type: 'event',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'lpAddress', type: 'address', indexed: false },
      { name: 'lpAmount', type: 'uint256', indexed: false },
      { name: 'liquidityETH', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Failed',
    type: 'event',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'totalRaised', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Refund',
    type: 'event',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base-rpc.publicnode.com'),
});

export interface TokenData {
  id: number;
  tokenAddress: string;
  creator: string;
  metadataURI: string;
  totalRaised: bigint;
  totalRefunded: bigint;
  tokensSold: bigint;
  deadline: bigint;
  failedTimestamp: bigint;
  bonded: boolean;
  failed: boolean;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  image: string;
  description?: string;
}

export interface LiveToken {
  id: string;
  name: string;
  symbol: string;
  image: string;
  creator: string;
  progress: number;
  raised: number;
  target: number;
  timeLeft: number;
  maxTime: number;
  buyers: number;
  price: number;
  bonded: boolean;
  failed: boolean;
  tokenAddress: string;
}

export async function getTokenCount(): Promise<number> {
  const count = await publicClient.readContract({
    address: SAFELAUNCH_FACTORY_ADDRESS,
    abi: safeLaunchAbi,
    functionName: 'tokenCount',
  });
  return Number(count);
}

export async function getToken(tokenId: number): Promise<TokenData | null> {
  try {
    const result = await publicClient.readContract({
      address: SAFELAUNCH_FACTORY_ADDRESS,
      abi: safeLaunchAbi,
      functionName: 'tokens',
      args: [BigInt(tokenId)],
    }) as [string, string, string, bigint, bigint, bigint, bigint, bigint, boolean, boolean];

    console.log(`Token ${tokenId} data:`, {
      tokenAddress: result[0],
      creator: result[1],
      totalRaised: result[3].toString(),
      tokensSold: result[5].toString(),
      bonded: result[8],
      failed: result[9],
    });

    if (result[0] === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    return {
      id: tokenId,
      tokenAddress: result[0],
      creator: result[1],
      metadataURI: result[2],
      totalRaised: result[3],
      totalRefunded: result[4],
      tokensSold: result[5],
      deadline: result[6],
      failedTimestamp: result[7],
      bonded: result[8],
      failed: result[9],
    };
  } catch (error) {
    console.error(`Error fetching token ${tokenId}:`, error);
    return null;
  }
}

export async function getCurrentPrice(tokenId: number): Promise<number> {
  try {
    const price = await publicClient.readContract({
      address: SAFELAUNCH_FACTORY_ADDRESS,
      abi: safeLaunchAbi,
      functionName: 'getCurrentPrice',
      args: [BigInt(tokenId)],
    });
    return parseFloat(formatEther(price as bigint));
  } catch (error) {
    console.error(`Error fetching price for token ${tokenId}:`, error);
    return 0;
  }
}

export async function parseMetadataURI(uri: string): Promise<TokenMetadata> {
  const defaultMetadata: TokenMetadata = {
    name: 'Unknown Token',
    symbol: 'UNKNOWN',
    image: '',
  };

  if (!uri) return defaultMetadata;

  try {
    if (uri.startsWith('data:application/json;base64,')) {
      const base64Data = uri.replace('data:application/json;base64,', '');
      const jsonString = atob(base64Data);
      return JSON.parse(jsonString);
    }

    if (uri.startsWith('data:application/json,')) {
      const jsonString = decodeURIComponent(uri.replace('data:application/json,', ''));
      return JSON.parse(jsonString);
    }

    if (uri.startsWith('ipfs://')) {
      const ipfsHash = uri.replace('ipfs://', '');
      const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
      if (response.ok) {
        return await response.json();
      }
    }

    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const response = await fetch(uri);
      if (response.ok) {
        return await response.json();
      }
    }

    try {
      return JSON.parse(uri);
    } catch {
      return defaultMetadata;
    }
  } catch (error) {
    console.error('Error parsing metadata:', error);
    return defaultMetadata;
  }
}

export async function getAllTokens(): Promise<LiveToken[]> {
  const count = await getTokenCount();
  if (count === 0) return [];

  const tokens: LiveToken[] = [];
  const now = Math.floor(Date.now() / 1000);

  for (let i = 1; i <= count; i++) {
    const tokenData = await getToken(i);
    if (!tokenData) continue;

    const metadata = await parseMetadataURI(tokenData.metadataURI);
    const price = await getCurrentPrice(i);
    
    const raised = parseFloat(formatEther(tokenData.totalRaised));
    const progress = Math.min(100, (raised / BONDING_TARGET) * 100);
    const deadline = Number(tokenData.deadline);
    const timeLeft = Math.max(0, deadline - now);

    tokens.push({
      id: String(i),
      name: metadata.name,
      symbol: metadata.symbol,
      image: metadata.image,
      creator: `${tokenData.creator.slice(0, 6)}...${tokenData.creator.slice(-4)}`,
      progress: Math.round(progress * 10) / 10,
      raised: Math.round(raised * 1000) / 1000,
      target: BONDING_TARGET,
      timeLeft,
      maxTime: 86400,
      buyers: 0,
      price,
      bonded: tokenData.bonded,
      failed: tokenData.failed,
      tokenAddress: tokenData.tokenAddress,
    });
  }

  return tokens;
}

const CONTRACT_DEPLOY_BLOCK = 39400000n;
const MAX_BLOCK_RANGE = 2000n;

async function getTokenCreationBlock(tokenId: number): Promise<bigint | null> {
  try {
    const currentBlock = await publicClient.getBlockNumber();
    let fromBlock = CONTRACT_DEPLOY_BLOCK;
    
    while (fromBlock < currentBlock) {
      const toBlock = fromBlock + MAX_BLOCK_RANGE > currentBlock ? currentBlock : fromBlock + MAX_BLOCK_RANGE;
      
      const logs = await publicClient.getLogs({
        address: SAFELAUNCH_FACTORY_ADDRESS,
        event: {
          type: 'event',
          name: 'TokenCreated',
          inputs: [
            { type: 'uint256', name: 'tokenId', indexed: true },
            { type: 'address', name: 'tokenAddress', indexed: true },
            { type: 'address', name: 'creator', indexed: true },
            { type: 'string', name: 'metadataURI', indexed: false },
            { type: 'uint256', name: 'deadline', indexed: false },
          ],
        },
        args: {
          tokenId: BigInt(tokenId),
        },
        fromBlock,
        toBlock,
      });
      
      if (logs.length > 0) {
        return logs[0].blockNumber;
      }
      fromBlock = toBlock + 1n;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching token creation block:`, error);
    return null;
  }
}

export async function getBuyEvents(tokenId: number): Promise<Array<{
  buyer: string;
  ethAmount: bigint;
  tokenAmount: bigint;
  totalRaised: bigint;
  blockNumber: bigint;
  transactionHash: string;
}>> {
  try {
    const creationBlock = await getTokenCreationBlock(tokenId);
    if (!creationBlock) {
      console.log(`Token ${tokenId} creation block not found, using recent blocks`);
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > MAX_BLOCK_RANGE ? currentBlock - MAX_BLOCK_RANGE : CONTRACT_DEPLOY_BLOCK;
      
      const logs = await publicClient.getLogs({
        address: SAFELAUNCH_FACTORY_ADDRESS,
        event: {
          type: 'event',
          name: 'Buy',
          inputs: [
            { type: 'uint256', name: 'tokenId', indexed: true },
            { type: 'address', name: 'buyer', indexed: true },
            { type: 'uint256', name: 'ethAmount', indexed: false },
            { type: 'uint256', name: 'tokenAmount', indexed: false },
            { type: 'uint256', name: 'totalRaised', indexed: false },
          ],
        },
        args: {
          tokenId: BigInt(tokenId),
        },
        fromBlock,
        toBlock: currentBlock,
      });

      return logs.map(log => ({
        buyer: log.args.buyer as string,
        ethAmount: log.args.ethAmount as bigint,
        tokenAmount: log.args.tokenAmount as bigint,
        totalRaised: log.args.totalRaised as bigint,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      }));
    }

    const currentBlock = await publicClient.getBlockNumber();
    const allLogs: Array<any> = [];
    let fromBlock = creationBlock;
    
    while (fromBlock <= currentBlock) {
      const toBlock = fromBlock + MAX_BLOCK_RANGE > currentBlock ? currentBlock : fromBlock + MAX_BLOCK_RANGE;
      
      const logs = await publicClient.getLogs({
        address: SAFELAUNCH_FACTORY_ADDRESS,
        event: {
          type: 'event',
          name: 'Buy',
          inputs: [
            { type: 'uint256', name: 'tokenId', indexed: true },
            { type: 'address', name: 'buyer', indexed: true },
            { type: 'uint256', name: 'ethAmount', indexed: false },
            { type: 'uint256', name: 'tokenAmount', indexed: false },
            { type: 'uint256', name: 'totalRaised', indexed: false },
          ],
        },
        args: {
          tokenId: BigInt(tokenId),
        },
        fromBlock,
        toBlock,
      });
      
      allLogs.push(...logs);
      fromBlock = toBlock + 1n;
    }

    return allLogs.map(log => ({
      buyer: log.args.buyer as string,
      ethAmount: log.args.ethAmount as bigint,
      tokenAmount: log.args.tokenAmount as bigint,
      totalRaised: log.args.totalRaised as bigint,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
    }));
  } catch (error) {
    console.error(`Error fetching Buy events for token ${tokenId}:`, error);
    return [];
  }
}

export async function getContribution(tokenId: number, userAddress: string): Promise<bigint> {
  try {
    const contribution = await publicClient.readContract({
      address: SAFELAUNCH_FACTORY_ADDRESS,
      abi: safeLaunchAbi,
      functionName: 'getContribution',
      args: [BigInt(tokenId), userAddress as `0x${string}`],
    });
    return contribution as bigint;
  } catch (error) {
    console.error(`Error fetching contribution:`, error);
    return BigInt(0);
  }
}

export async function getTokenBalance(tokenId: number, userAddress: string): Promise<bigint> {
  try {
    const balance = await publicClient.readContract({
      address: SAFELAUNCH_FACTORY_ADDRESS,
      abi: safeLaunchAbi,
      functionName: 'getTokenBalance',
      args: [BigInt(tokenId), userAddress as `0x${string}`],
    });
    return balance as bigint;
  } catch (error) {
    console.error(`Error fetching token balance:`, error);
    return BigInt(0);
  }
}

export interface BuyEventData {
  tokenId: bigint;
  buyer: string;
  ethAmount: bigint;
  tokenAmount: bigint;
  totalRaised: bigint;
  blockNumber: bigint;
  transactionHash: string;
}

export interface TokenCreatedEventData {
  tokenId: bigint;
  tokenAddress: string;
  creator: string;
  metadataURI: string;
  deadline: bigint;
  blockNumber: bigint;
  transactionHash: string;
}

export interface BondedEventData {
  tokenId: bigint;
  lpAddress: string;
  lpAmount: bigint;
  liquidityETH: bigint;
  blockNumber: bigint;
  transactionHash: string;
}

export function watchBuyEvents(
  tokenId: number | null,
  onEvent: (event: BuyEventData) => void
): () => void {
  let lastBlock = 0n;
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;
    try {
      const currentBlock = await publicClient.getBlockNumber();
      if (lastBlock === 0n) {
        lastBlock = currentBlock - 100n;
      }
      
      const logs = await publicClient.getLogs({
        address: SAFELAUNCH_FACTORY_ADDRESS,
        event: {
          type: 'event',
          name: 'Buy',
          inputs: [
            { type: 'uint256', name: 'tokenId', indexed: true },
            { type: 'address', name: 'buyer', indexed: true },
            { type: 'uint256', name: 'ethAmount', indexed: false },
            { type: 'uint256', name: 'tokenAmount', indexed: false },
            { type: 'uint256', name: 'totalRaised', indexed: false },
          ],
        },
        args: tokenId !== null ? { tokenId: BigInt(tokenId) } : undefined,
        fromBlock: lastBlock + 1n,
        toBlock: currentBlock,
      });

      for (const log of logs) {
        onEvent({
          tokenId: log.args.tokenId as bigint,
          buyer: log.args.buyer as string,
          ethAmount: log.args.ethAmount as bigint,
          tokenAmount: log.args.tokenAmount as bigint,
          totalRaised: log.args.totalRaised as bigint,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        });
      }
      lastBlock = currentBlock;
    } catch (error) {
      // Silently handle polling errors
    }
    if (isActive) {
      setTimeout(poll, 5000);
    }
  };

  poll();

  return () => { isActive = false; };
}

export function watchTokenCreated(
  onEvent: (event: TokenCreatedEventData) => void
): () => void {
  let lastBlock = 0n;
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;
    try {
      const currentBlock = await publicClient.getBlockNumber();
      if (lastBlock === 0n) {
        lastBlock = currentBlock - 100n;
      }
      
      const logs = await publicClient.getLogs({
        address: SAFELAUNCH_FACTORY_ADDRESS,
        event: {
          type: 'event',
          name: 'TokenCreated',
          inputs: [
            { type: 'uint256', name: 'tokenId', indexed: true },
            { type: 'address', name: 'tokenAddress', indexed: true },
            { type: 'address', name: 'creator', indexed: true },
            { type: 'string', name: 'metadataURI', indexed: false },
            { type: 'uint256', name: 'deadline', indexed: false },
          ],
        },
        fromBlock: lastBlock + 1n,
        toBlock: currentBlock,
      });

      for (const log of logs) {
        onEvent({
          tokenId: log.args.tokenId as bigint,
          tokenAddress: log.args.tokenAddress as string,
          creator: log.args.creator as string,
          metadataURI: log.args.metadataURI as string,
          deadline: log.args.deadline as bigint,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        });
      }
      lastBlock = currentBlock;
    } catch (error) {
      // Silently handle polling errors
    }
    if (isActive) {
      setTimeout(poll, 5000);
    }
  };

  poll();

  return () => { isActive = false; };
}

export function watchBonded(
  tokenId: number | null,
  onEvent: (event: BondedEventData) => void
): () => void {
  let lastBlock = 0n;
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;
    try {
      const currentBlock = await publicClient.getBlockNumber();
      if (lastBlock === 0n) {
        lastBlock = currentBlock - 100n;
      }
      
      const logs = await publicClient.getLogs({
        address: SAFELAUNCH_FACTORY_ADDRESS,
        event: {
          type: 'event',
          name: 'Bonded',
          inputs: [
            { type: 'uint256', name: 'tokenId', indexed: true },
            { type: 'address', name: 'lpAddress', indexed: false },
            { type: 'uint256', name: 'lpAmount', indexed: false },
            { type: 'uint256', name: 'liquidityETH', indexed: false },
          ],
        },
        args: tokenId !== null ? { tokenId: BigInt(tokenId) } : undefined,
        fromBlock: lastBlock + 1n,
        toBlock: currentBlock,
      });

      for (const log of logs) {
        onEvent({
          tokenId: log.args.tokenId as bigint,
          lpAddress: log.args.lpAddress as string,
          lpAmount: log.args.lpAmount as bigint,
          liquidityETH: log.args.liquidityETH as bigint,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        });
      }
      lastBlock = currentBlock;
    } catch (error) {
      // Silently handle polling errors
    }
    if (isActive) {
      setTimeout(poll, 5000);
    }
  };

  poll();

  return () => { isActive = false; };
}
