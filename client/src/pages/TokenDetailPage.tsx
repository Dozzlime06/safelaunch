import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Shield,
  Users, 
  Clock, 
  TrendingUp,
  Copy,
  ExternalLink,
  Minus,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import safeLaunchLogo from "@assets/generated_images/safelaunch_shield_rocket_logo.png";
import defaultTokenImage from "@assets/generated_images/meme_crypto_token_icon.png";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/launchpad/WalletButton";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { parseEther } from "viem";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { createChart, ColorType, CandlestickSeries, HistogramSeries, Time } from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { 
  getToken, 
  getCurrentPrice, 
  parseMetadataURI, 
  getBuyEvents,
  BONDING_TARGET,
  SAFELAUNCH_FACTORY_ADDRESS,
  safeLaunchAbi,
  type TokenData,
  type TokenMetadata
} from "@/lib/safeLaunchContract";
import { useTokenDetailEvents } from "@/hooks/useContractEvents";

function formatTime(seconds: number): string {
  if (seconds <= 0) return "Expired";
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${mins}m ${secs}s`;
  }
  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'] as const;
type Timeframe = typeof TIMEFRAMES[number];

const STARTING_MC_USD = 5000;
const BONDING_TARGET_ETH = 8.5;
const MAX_MC_USD = 30000;
const DEFAULT_ETH_PRICE = 4000;

async function fetchEthPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const data = await response.json();
    return data.ethereum?.usd || DEFAULT_ETH_PRICE;
  } catch (error) {
    console.error('Failed to fetch ETH price:', error);
    return DEFAULT_ETH_PRICE;
  }
}

function calculateMCFromRaised(totalRaisedETH: number): number {
  const progress = totalRaisedETH / BONDING_TARGET_ETH;
  return STARTING_MC_USD + (progress * (MAX_MC_USD - STARTING_MC_USD));
}

interface BuyEvent {
  buyer: string;
  ethAmount: bigint;
  tokenAmount: bigint;
  totalRaised: bigint;
  blockNumber: bigint;
  transactionHash: string;
}

function generateCandleDataFromEvents(events: BuyEvent[], timeframe: Timeframe, ethPrice: number) {
  const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
    '1w': 604800,
  };

  // Maximum candles to show per timeframe (reasonable display)
  const MAX_CANDLES: Record<Timeframe, number> = {
    '1m': 60,    // 1 hour of 1-min candles
    '5m': 48,    // 4 hours of 5-min candles
    '15m': 32,   // 8 hours of 15-min candles
    '30m': 24,   // 12 hours of 30-min candles
    '1h': 24,    // 24 hours of 1-hour candles
    '4h': 42,    // 1 week of 4-hour candles
    '1d': 30,    // 1 month of daily candles
    '1w': 12,    // 3 months of weekly candles
  };

  const intervalSeconds = TIMEFRAME_SECONDS[timeframe];
  const maxCandles = MAX_CANDLES[timeframe];
  const now = Math.floor(Date.now() / 1000);
  const currentBucket = Math.floor(now / intervalSeconds) * intervalSeconds;

  // Calculate the last market cap from all events
  let lastMC = STARTING_MC_USD;
  if (events.length > 0) {
    const sortedEvents = [...events].sort((a, b) => Number(a.blockNumber - b.blockNumber));
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    const totalRaisedETH = parseFloat(formatEther(lastEvent.totalRaised));
    lastMC = calculateMCFromRaised(totalRaisedETH);
  }

  // Start from maxCandles back from current bucket (recent history only)
  const startBucket = currentBucket - ((maxCandles - 1) * intervalSeconds);

  // For no events, show flat candles
  if (events.length === 0) {
    const candles = [];
    const volume = [];
    for (let time = startBucket; time <= currentBucket; time += intervalSeconds) {
      candles.push({ time: time as Time, open: STARTING_MC_USD, high: STARTING_MC_USD, low: STARTING_MC_USD, close: STARTING_MC_USD });
      volume.push({ time: time as Time, value: 0, color: 'rgba(16, 185, 129, 0.5)' });
    }
    return { candles, volume, hasRealData: false, currentMC: STARTING_MC_USD };
  }

  // Sort events by block number
  const sortedEvents = [...events].sort((a, b) => Number(a.blockNumber - b.blockNumber));
  
  // Place events near the END of the chart (recent), with the last event at or before current bucket
  // Space events backwards from currentBucket
  const buckets = new Map<number, BuyEvent[]>();
  const numEvents = sortedEvents.length;
  
  for (let i = 0; i < numEvents; i++) {
    const event = sortedEvents[i];
    // Place events starting from (currentBucket - (numEvents-1-i) * interval)
    // This puts the LAST event at currentBucket, earlier events before it
    const bucketTime = currentBucket - ((numEvents - 1 - i) * intervalSeconds);
    // Only add if within our display range
    if (bucketTime >= startBucket && bucketTime <= currentBucket) {
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, []);
      }
      buckets.get(bucketTime)!.push(event);
    }
  }

  const data: { time: Time; open: number; high: number; low: number; close: number }[] = [];
  const volumeData: { time: Time; value: number; color: string }[] = [];
  
  let prevClose = STARTING_MC_USD;

  // Generate candles from start bucket to current bucket
  for (let time = startBucket; time <= currentBucket; time += intervalSeconds) {
    const bucketEvents = buckets.get(time) || [];
    
    if (bucketEvents.length > 0) {
      const mcValues = bucketEvents.map(e => {
        const totalRaisedETH = parseFloat(formatEther(e.totalRaised));
        return calculateMCFromRaised(totalRaisedETH);
      });
      
      const open = prevClose;
      const close = mcValues[mcValues.length - 1];
      const high = Math.max(open, ...mcValues);
      const low = Math.min(open, ...mcValues);
      
      const volume = bucketEvents.reduce((sum, e) => sum + parseFloat(formatEther(e.ethAmount)), 0) * ethPrice;
      
      data.push({ time: time as Time, open, high, low, close });
      volumeData.push({
        time: time as Time,
        value: volume,
        color: close >= open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
      });
      
      prevClose = close;
    } else {
      // Flat candle at current price level
      data.push({ time: time as Time, open: prevClose, high: prevClose, low: prevClose, close: prevClose });
      volumeData.push({
        time: time as Time,
        value: 0,
        color: 'rgba(16, 185, 129, 0.5)'
      });
    }
  }

  return { candles: data, volume: volumeData, hasRealData: true, currentMC: lastMC };
}

export default function TokenDetailPage() {
  const params = useParams();
  const tokenId = parseInt(params.id || '0');
  
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [buyAmount, setBuyAmount] = useState("0.1");
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [activeTab, setActiveTab] = useState<'transactions' | 'holders'>('transactions');
  const presetAmounts = [0.05, 0.1, 0.25, 0.5];
  const [countdown, setCountdown] = useState(0);
  const [candleCountdown, setCandleCountdown] = useState('');
  
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  
  const { writeContract, data: buyHash, isPending: isBuying, error: buyError } = useWriteContract();
  const { isLoading: isConfirmingBuy, isSuccess: buySuccess } = useWaitForTransactionReceipt({ hash: buyHash });
  const [buyErrorMessage, setBuyErrorMessage] = useState<string | null>(null);

  const { writeContract: writeCheckFailed, data: checkFailedHash, isPending: isCheckingFailed } = useWriteContract();
  const { isLoading: isConfirmingCheckFailed, isSuccess: checkFailedSuccess } = useWaitForTransactionReceipt({ hash: checkFailedHash });

  const { writeContract: writeClaimRefund, data: claimRefundHash, isPending: isClaimingRefund } = useWriteContract();
  const { isLoading: isConfirmingRefund, isSuccess: refundSuccess } = useWaitForTransactionReceipt({ hash: claimRefundHash });

  const handleCheckFailed = () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    writeCheckFailed({
      address: SAFELAUNCH_FACTORY_ADDRESS,
      abi: safeLaunchAbi,
      functionName: 'checkFailed',
      args: [BigInt(tokenId)],
    });
  };

  const handleClaimRefund = () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    writeClaimRefund({
      address: SAFELAUNCH_FACTORY_ADDRESS,
      abi: safeLaunchAbi,
      functionName: 'claimRefund',
      args: [BigInt(tokenId)],
    });
  };

  const handleBuy = () => {
    setBuyErrorMessage(null);
    
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    if (chainId !== 8453) {
      setBuyErrorMessage("Please switch to Base network");
      return;
    }

    const amount = parseFloat(buyAmount);
    if (isNaN(amount) || amount <= 0) {
      setBuyErrorMessage("Please enter a valid amount");
      return;
    }

    if (amount > 0.5) {
      setBuyErrorMessage("Maximum buy is 0.5 ETH per wallet");
      return;
    }

    try {
      writeContract({
        address: SAFELAUNCH_FACTORY_ADDRESS,
        abi: safeLaunchAbi,
        functionName: 'buy',
        args: [BigInt(tokenId)],
        value: parseEther(amount.toString()),
      });
    } catch (err: any) {
      setBuyErrorMessage(err.message || 'Failed to buy');
    }
  };

  useTokenDetailEvents(tokenId);

  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: ['safelaunch-token', tokenId],
    queryFn: () => getToken(tokenId),
    enabled: tokenId > 0,
    refetchInterval: 15000,
  });

  const { data: metadata } = useQuery({
    queryKey: ['safelaunch-metadata', tokenData?.metadataURI],
    queryFn: () => parseMetadataURI(tokenData?.metadataURI || ''),
    enabled: !!tokenData?.metadataURI,
  });

  const { data: price = 0 } = useQuery({
    queryKey: ['safelaunch-price', tokenId],
    queryFn: () => getCurrentPrice(tokenId),
    enabled: tokenId > 0,
    refetchInterval: 10000,
  });

  const { data: buyEvents = [] } = useQuery({
    queryKey: ['safelaunch-events', tokenId],
    queryFn: () => getBuyEvents(tokenId),
    enabled: tokenId > 0,
    refetchInterval: 30000,
  });

  const { data: ethPrice = DEFAULT_ETH_PRICE } = useQuery({
    queryKey: ['eth-price'],
    queryFn: fetchEthPrice,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const raised = tokenData ? parseFloat(formatEther(tokenData.totalRaised)) : 0;
  const progress = Math.min(100, (raised / BONDING_TARGET) * 100);
  const currentMC = calculateMCFromRaised(raised);
  const deadline = tokenData ? Number(tokenData.deadline) : 0;
  
  useEffect(() => {
    if (!deadline) return;
    
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      setCountdown(Math.max(0, deadline - now));
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [deadline]);
  
  const timeLeft = countdown;
  const isEnding = timeLeft < 7200 && timeLeft > 0;

  const transactions = buyEvents.map((event, i) => ({
    type: 'buy' as const,
    address: `${event.buyer.slice(0, 6)}...${event.buyer.slice(-4)}`,
    fullAddress: event.buyer,
    amount: parseFloat(formatEther(event.ethAmount)),
    tokens: parseFloat(formatEther(event.tokenAmount)),
    txHash: event.transactionHash,
    time: `Block ${event.blockNumber}`,
  })).reverse().slice(0, 20);

  const holderMap = new Map<string, { tokens: number; contribution: number }>();
  buyEvents.forEach(event => {
    const existing = holderMap.get(event.buyer) || { tokens: 0, contribution: 0 };
    existing.tokens += parseFloat(formatEther(event.tokenAmount));
    existing.contribution += parseFloat(formatEther(event.ethAmount));
    holderMap.set(event.buyer, existing);
  });

  const totalTokensSold = tokenData ? parseFloat(formatEther(tokenData.tokensSold)) : 0;
  const holders = Array.from(holderMap.entries())
    .map(([addr, data]) => ({
      address: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
      fullAddress: addr,
      tokens: data.tokens,
      percentage: totalTokensSold > 0 ? (data.tokens / totalTokensSold) * 100 : 0,
      value: data.contribution,
    }))
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10);

  useEffect(() => {
    if (!chartRef.current || !tokenData) return;

    const container = chartRef.current;
    container.innerHTML = '';

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d0d0d' },
        textColor: 'rgba(255, 255, 255, 0.5)',
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      width: container.clientWidth,
      height: 450,
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.2 },
        visible: true,
      },
      localization: {
        priceFormatter: (price: number) => {
          if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
          if (price >= 100000) return `$${(price / 1000).toFixed(0)}K`;
          return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 6,
        minBarSpacing: 2,
      },
      crosshair: {
        vertLine: { color: 'rgba(139, 92, 246, 0.4)', width: 1 },
        horzLine: { color: 'rgba(139, 92, 246, 0.4)', width: 1 },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
      priceFormat: {
        type: 'price',
        precision: 0,
        minMove: 1,
      },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
      visible: false,
    });

    chartInstanceRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const { candles, volume } = generateCandleDataFromEvents(buyEvents, timeframe, ethPrice);
    if (candles.length > 0) {
      candleSeries.setData(candles);
      volumeSeries.setData(volume);
    } else {
      const now = Math.floor(Date.now() / 1000) as Time;
      candleSeries.setData([{ time: now, open: STARTING_MC_USD, high: STARTING_MC_USD, low: STARTING_MC_USD, close: STARTING_MC_USD }]);
    }
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (container) {
        chart.applyOptions({ width: container.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartInstanceRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [tokenData, timeframe, buyEvents, ethPrice]);

  // Auto-update chart with flat candles every second
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !tokenData) return;

    const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
      '1m': 60, '5m': 300, '15m': 900, '30m': 1800,
      '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800,
    };

    const intervalSeconds = TIMEFRAME_SECONDS[timeframe];

    const updateChart = () => {
      const { candles, volume } = generateCandleDataFromEvents(buyEvents, timeframe, ethPrice);
      if (candles.length > 0 && candleSeriesRef.current && volumeSeriesRef.current) {
        candleSeriesRef.current.setData(candles);
        volumeSeriesRef.current.setData(volume);
      }
    };

    const timer = setInterval(updateChart, 1000);
    return () => clearInterval(timer);
  }, [tokenData, timeframe, buyEvents, ethPrice]);

  // Candle countdown timer
  useEffect(() => {
    const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
      '1m': 60, '5m': 300, '15m': 900, '30m': 1800,
      '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800,
    };

    const intervalSeconds = TIMEFRAME_SECONDS[timeframe];

    const updateCandleCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const bucketTime = Math.floor(now / intervalSeconds) * intervalSeconds;
      const nextBucketTime = bucketTime + intervalSeconds;
      const remaining = nextBucketTime - now;

      if (remaining <= 0) {
        setCandleCountdown('0:00');
        return;
      }

      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      if (hours > 0) {
        setCandleCountdown(`${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
      } else if (minutes > 0) {
        setCandleCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setCandleCountdown(`0:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateCandleCountdown();
    const timer = setInterval(updateCandleCountdown, 1000);
    return () => clearInterval(timer);
  }, [timeframe]);

  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-white/40">Loading token from Base...</p>
        </div>
      </div>
    );
  }

  if (tokenError || !tokenData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white/40 mb-4">Token not found</p>
          <Link href="/tokens" className="text-violet-400 hover:text-violet-300">
            Back to Tokens
          </Link>
        </div>
      </div>
    );
  }

  const token = {
    id: String(tokenId),
    name: metadata?.name || 'Loading...',
    symbol: metadata?.symbol || '...',
    image: metadata?.image || '',
    creator: `${tokenData.creator.slice(0, 6)}...${tokenData.creator.slice(-4)}`,
    fullCreator: tokenData.creator,
    progress: Math.round(progress * 10) / 10,
    raised: Math.round(raised * 1000) / 1000,
    target: BONDING_TARGET,
    timeLeft,
    buyers: holderMap.size,
    price,
    bonded: tokenData.bonded,
    failed: tokenData.failed,
    tokenAddress: tokenData.tokenAddress,
  };

  const buyAmountNum = parseFloat(buyAmount) || 0;
  const estimatedTokens = price > 0 ? Math.floor(buyAmountNum / price) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <header className="fixed top-0 left-0 right-0 border-b border-white/5 backdrop-blur-xl bg-black/80 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/tokens" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Back</span>
              </Link>
              <Link href="/" className="flex items-center gap-2">
                  <img src={safeLaunchLogo} alt="SafeLaunch" className="w-6 h-6" />
                  <span className="text-sm font-medium text-white">SafeLaunch</span>
              </Link>
            </div>
            
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="h-16" />

      <main className="relative max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-[#0d0d0d] border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-white/40">Market Cap</p>
                  <p className="text-3xl font-bold text-white font-mono" data-testid="text-market-cap">
                    ${currentMC.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-white/30 mt-1">ETH: ${ethPrice.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-white/40">Token Price</p>
                  <p className="text-lg font-semibold text-white font-mono">
                    {price > 0 ? `$${(price * ethPrice).toFixed(12)}` : '...'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/40">Status</p>
                  {token.bonded ? (
                    <p className="text-lg font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Bonded
                    </p>
                  ) : token.failed ? (
                    <p className="text-lg font-semibold text-red-400 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Failed
                    </p>
                  ) : (
                    <p className="text-lg font-semibold text-violet-400">Live</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-white">${token.symbol}</span>
                <span className="text-white/30">/</span>
                <span className="text-lg font-medium text-white/60">ETH</span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1 bg-gradient-to-r from-[#1a1a1a] to-[#141414] rounded-xl p-1 border border-white/5 flex-1">
                  {TIMEFRAMES.map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      data-testid={`button-timeframe-${tf}`}
                      className={`flex-1 py-2 text-[11px] font-mono font-semibold rounded-lg transition-all duration-200 ${
                        timeframe === tf 
                          ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25' 
                          : 'text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {tf.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 bg-[#1a1a1a] rounded-xl px-3 py-2 border border-yellow-500/30" data-testid="candle-countdown">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <span className="text-xs font-mono font-semibold text-yellow-500">{candleCountdown}</span>
                </div>
              </div>
              
              <div className="relative">
                <div ref={chartRef} className="w-full rounded-lg overflow-hidden" data-testid="token-chart" />
                {buyEvents.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0d]/90 rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="w-10 h-10 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40 font-medium">No trading data yet</p>
                      <p className="text-xs text-white/30 mt-1">Chart will update when trades occur</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 overflow-hidden">
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => setActiveTab('transactions')}
                  data-testid="tab-transactions"
                  className={`flex-1 py-4 px-6 text-sm font-semibold transition-all relative ${
                    activeTab === 'transactions'
                      ? 'text-white bg-gradient-to-r from-violet-500/10 to-transparent'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Transactions ({transactions.length})
                  </span>
                  {activeTab === 'transactions' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('holders')}
                  data-testid="tab-holders"
                  className={`flex-1 py-4 px-6 text-sm font-semibold transition-all relative ${
                    activeTab === 'holders'
                      ? 'text-white bg-gradient-to-l from-violet-500/10 to-transparent'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" />
                    Holders ({holders.length})
                  </span>
                  {activeTab === 'holders' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-500" />
                  )}
                </button>
              </div>

              <div className="p-5">
                {activeTab === 'transactions' ? (
                  transactions.length === 0 ? (
                    <div className="text-center py-8 text-white/40">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((tx, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20">
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <a 
                                href={`https://basescan.org/address/${tx.fullAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-white hover:text-violet-400 transition-colors"
                              >{tx.address}</a>
                              <p className="text-xs text-white/40">{tx.time}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-emerald-400">+{tx.amount.toFixed(4)} ETH</p>
                            <a 
                              href={`https://basescan.org/tx/${tx.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-white/40 hover:text-violet-400"
                            >
                              View tx
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  holders.length === 0 ? (
                    <div className="text-center py-8 text-white/40">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No holders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {holders.map((holder, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/10 flex items-center justify-center border border-violet-500/20">
                              <span className="text-xs font-bold text-violet-400">#{i + 1}</span>
                            </div>
                            <div>
                              <a 
                                href={`https://basescan.org/address/${holder.fullAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-white hover:text-violet-400 transition-colors"
                              >{holder.address}</a>
                              <p className="text-xs text-white/40">{holder.tokens.toLocaleString()} tokens</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-violet-400">{holder.percentage.toFixed(1)}%</p>
                            <p className="text-xs text-white/40">{holder.value.toFixed(4)} ETH</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#1a1a1a] border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={token.image || defaultTokenImage} 
                  alt={token.name} 
                  className="w-12 h-12 rounded-full" 
                  onError={(e) => { e.currentTarget.src = defaultTokenImage; }} 
                />
                <div>
                  <h2 className="font-bold text-white">{token.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <span>{token.creator}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(token.fullCreator)}
                      className="hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <TrendingUp className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{token.progress}%</p>
                  <p className="text-[10px] text-white/40">Bonded</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <Users className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{token.buyers}</p>
                  <p className="text-[10px] text-white/40">Buyers</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <Clock className={`w-4 h-4 mx-auto mb-1 ${isEnding ? 'text-red-400' : 'text-violet-400'}`} />
                  <p className={`text-sm font-bold font-mono ${isEnding ? 'text-red-400' : 'text-white'}`}>
                    {token.bonded ? '✓' : token.failed ? '✗' : formatTime(token.timeLeft)}
                  </p>
                  <p className="text-[10px] text-white/40">
                    {token.bonded ? 'Done' : token.failed ? 'Ended' : 'Left'}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">Bonding Progress</span>
                  <span className="text-sm font-medium text-white">{token.raised} / {token.target} ETH</span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${token.bonded ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-violet-500 to-violet-400'}`}
                    style={{ width: `${token.progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-white/40">
                  <span>0 ETH</span>
                  <span>{token.target} ETH</span>
                </div>
              </div>

              
              {!token.bonded && !token.failed && token.timeLeft > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Buy Amount (ETH)</label>
                    <div className="flex gap-2 mb-3">
                      {presetAmounts.map(amount => (
                        <button
                          key={amount}
                          onClick={() => setBuyAmount(amount.toString())}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            buyAmount === amount.toString() 
                              ? 'bg-violet-500 text-white' 
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                          data-testid={`button-preset-${amount}`}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          const newVal = Math.max(0.01, buyAmountNum - 0.05);
                          setBuyAmount(newVal.toFixed(2));
                        }}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Minus className="w-4 h-4 text-white" />
                      </button>
                      <input
                        type="text"
                        value={buyAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setBuyAmount(val);
                          }
                        }}
                        className="flex-1 py-3 px-4 rounded-xl bg-white/5 text-center text-xl font-bold text-white font-mono border border-white/10 focus:border-violet-500 focus:outline-none"
                        placeholder="0.1"
                        data-testid="input-buy-amount"
                      />
                      <button 
                        onClick={() => {
                          const newVal = Math.min(0.5, buyAmountNum + 0.05);
                          setBuyAmount(newVal.toFixed(2));
                        }}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">You will receive</span>
                    <span className="font-medium text-white">~{estimatedTokens.toLocaleString()} {token.symbol}</span>
                  </div>

                  {buyErrorMessage && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {buyErrorMessage}
                    </div>
                  )}

                  {buyError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {buyError.message?.includes('User rejected') ? 'Transaction cancelled' : 'Transaction failed'}
                    </div>
                  )}

                  {buySuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Purchase successful!
                    </div>
                  )}

                  {!isConnected ? (
                    <Button 
                      onClick={openConnectModal}
                      className="w-full bg-violet-500 hover:bg-violet-400 text-white font-semibold py-4 rounded-xl text-lg"
                      data-testid="button-connect-wallet-buy"
                    >
                      Connect Wallet to Buy
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleBuy}
                      disabled={isBuying || isConfirmingBuy}
                      className="w-full bg-violet-500 hover:bg-violet-400 text-white font-semibold py-4 rounded-xl text-lg disabled:opacity-50"
                      data-testid="button-buy-token"
                    >
                      {isBuying || isConfirmingBuy ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {isConfirmingBuy ? 'Confirming...' : 'Buying...'}
                        </span>
                      ) : (
                        `Buy ${token.symbol}`
                      )}
                    </Button>
                  )}
                </div>
              )}

              {token.bonded && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-400 font-semibold">Successfully Bonded!</p>
                  <p className="text-xs text-white/40 mt-1">Tokens are now tradable on Uniswap</p>
                </div>
              )}

              {!token.bonded && !token.failed && token.timeLeft <= 0 && (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                  <Clock className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-orange-400 font-semibold">Deadline Passed</p>
                  <p className="text-xs text-white/40 mt-1">Token needs to be marked as failed before refunds</p>
                  {refundSuccess && (
                    <div className="p-2 mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Success!
                    </div>
                  )}
                  <Button 
                    onClick={handleCheckFailed}
                    disabled={isCheckingFailed || isConfirmingCheckFailed}
                    className="w-full mt-4 bg-orange-500 hover:bg-orange-400 text-white"
                    data-testid="button-mark-failed"
                  >
                    {isCheckingFailed || isConfirmingCheckFailed ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isConfirmingCheckFailed ? 'Confirming...' : 'Processing...'}
                      </span>
                    ) : (
                      'Mark as Failed'
                    )}
                  </Button>
                </div>
              )}

              {token.failed && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                  <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 font-semibold">Launch Failed</p>
                  <p className="text-xs text-white/40 mt-1">Contributors can claim refunds</p>
                  {refundSuccess && (
                    <div className="p-2 mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Refund claimed!
                    </div>
                  )}
                  <Button 
                    onClick={handleClaimRefund}
                    disabled={isClaimingRefund || isConfirmingRefund}
                    className="w-full mt-4 bg-red-500 hover:bg-red-400 text-white"
                    data-testid="button-claim-refund"
                  >
                    {isClaimingRefund || isConfirmingRefund ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isConfirmingRefund ? 'Confirming...' : 'Claiming...'}
                      </span>
                    ) : (
                      'Claim Refund'
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/40">Token Contract</span>
                <a 
                  href={`https://basescan.org/address/${token.tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                >
                  <span className="font-mono">{token.tokenAddress.slice(0, 6)}...{token.tokenAddress.slice(-4)}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-white/40">Factory</span>
                <a 
                  href={`https://basescan.org/address/${SAFELAUNCH_FACTORY_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                >
                  <span className="font-mono">{SAFELAUNCH_FACTORY_ADDRESS.slice(0, 6)}...{SAFELAUNCH_FACTORY_ADDRESS.slice(-4)}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
