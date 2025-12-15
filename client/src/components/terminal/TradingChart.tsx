import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, HistogramData, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import { Activity, Loader2, ExternalLink } from "lucide-react";
import { getBuyEvents } from "@/lib/safeLaunchContract";

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h'] as const;
type Timeframe = typeof TIMEFRAMES[number];

const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
};

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SafeLaunchChartProps {
  tokenId: number;
  ethPrice?: number;
}

const alignToTimeframe = (timestamp: number, intervalSeconds: number): number => {
  return Math.floor(timestamp / intervalSeconds) * intervalSeconds;
};

export function TradingChart({ tokenId, ethPrice = 3500 }: SafeLaunchChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [currency, setCurrency] = useState<'usd' | 'eth'>('usd');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);
  const [candleCountdown, setCandleCountdown] = useState('');
  const [candles, setCandles] = useState<Map<number, CandleData>>(new Map());

  const initChart = useCallback(() => {
    if (!chartContainerRef.current) return;
    
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d0d0d' },
        textColor: '#787b86',
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.2)', style: 1 },
        horzLines: { color: 'rgba(42, 46, 57, 0.2)', style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(139, 92, 246, 0.4)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#8b5cf6',
        },
        horzLine: {
          color: 'rgba(139, 92, 246, 0.4)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#8b5cf6',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.05)',
        scaleMargins: { top: 0.1, bottom: 0.25 },
        textColor: '#787b86',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.05)',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        },
      },
      handleScale: { axisPressedMouseMove: true },
      handleScroll: { vertTouchDrag: true },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#8b5cf6',
      downColor: '#ef4444',
      borderUpColor: '#8b5cf6',
      borderDownColor: '#ef4444',
      wickUpColor: '#8b5cf6',
      wickDownColor: '#ef4444',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#8b5cf6',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
      visible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchBuyHistory = useCallback(async () => {
    if (tokenId === undefined || tokenId < 0 || !candleSeriesRef.current || !volumeSeriesRef.current) return;
    
    setIsLoading(true);
    
    try {
      const buyEvents = await getBuyEvents(tokenId);
      
      if (!buyEvents || buyEvents.length === 0) {
        setIsLoading(false);
        return;
      }
      
      const intervalSeconds = TIMEFRAME_SECONDS[timeframe];
      const tempCandles = new Map<number, CandleData>();
      
      for (const event of buyEvents) {
        const block = await fetch(`https://base-mainnet.g.alchemy.com/v2/demo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBlockByNumber',
            params: [`0x${event.blockNumber.toString(16)}`, false]
          })
        }).then(r => r.json()).catch(() => null);
        
        const timestamp = block?.result?.timestamp 
          ? parseInt(block.result.timestamp, 16)
          : Math.floor(Date.now() / 1000) - (buyEvents.length - buyEvents.indexOf(event)) * 60;
        
        const bucketTime = alignToTimeframe(timestamp, intervalSeconds);
        const ethAmount = Number(event.ethAmount) / 1e18;
        const tokenAmount = Number(event.tokenAmount) / 1e18;
        const pricePerToken = tokenAmount > 0 ? ethAmount / tokenAmount : 0;
        
        let displayPrice = currency === 'usd' ? pricePerToken * ethPrice : pricePerToken;
        
        if (displayPrice <= 0) continue;
        
        const existingCandle = tempCandles.get(bucketTime);
        
        if (existingCandle) {
          existingCandle.high = Math.max(existingCandle.high, displayPrice);
          existingCandle.low = Math.min(existingCandle.low, displayPrice);
          existingCandle.close = displayPrice;
          existingCandle.volume += ethAmount;
        } else {
          const prevCandles = Array.from(tempCandles.values()).filter(c => c.time < bucketTime);
          const lastCandle = prevCandles.length > 0 ? prevCandles[prevCandles.length - 1] : null;
          const openPrice = lastCandle?.close || displayPrice;
          
          tempCandles.set(bucketTime, {
            time: bucketTime,
            open: openPrice,
            high: Math.max(openPrice, displayPrice),
            low: Math.min(openPrice, displayPrice),
            close: displayPrice,
            volume: ethAmount,
          });
        }
      }
      
      setCandles(tempCandles);
      
      const sortedCandles = Array.from(tempCandles.values()).sort((a, b) => a.time - b.time);
      
      const candleData: CandlestickData[] = sortedCandles.map(c => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      
      const volumeData: HistogramData[] = sortedCandles.map(c => ({
        time: c.time as any,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(139, 92, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)',
      }));
      
      candleSeriesRef.current.setData(candleData);
      volumeSeriesRef.current.setData(volumeData);
      
      if (sortedCandles.length > 0) {
        const lastCandle = sortedCandles[sortedCandles.length - 1];
        const firstCandle = sortedCandles[0];
        setCurrentPrice(lastCandle.close);
        const change = lastCandle.close - firstCandle.open;
        const changePercent = firstCandle.open > 0 ? (change / firstCandle.open) * 100 : 0;
        setPriceChange(change);
        setPriceChangePercent(changePercent);
      }
      
      chartRef.current?.timeScale().fitContent();
      
    } catch (error) {
      console.error('[Chart] Error fetching buy events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tokenId, timeframe, currency, ethPrice]);

  useEffect(() => {
    initChart();
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initChart]);

  useEffect(() => {
    if (tokenId !== undefined && tokenId >= 0 && candleSeriesRef.current) {
      fetchBuyHistory();
    }
  }, [tokenId, timeframe, currency, fetchBuyHistory]);

  useEffect(() => {
    const intervalSeconds = TIMEFRAME_SECONDS[timeframe];
    
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const bucketTime = alignToTimeframe(now, intervalSeconds);
      const nextBucketTime = bucketTime + intervalSeconds;
      const remaining = nextBucketTime - now;
      
      if (remaining <= 0) {
        setCandleCountdown('00:00');
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
    
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(timer);
  }, [timeframe]);

  if (tokenId === undefined || tokenId < 0) {
    return (
      <div className="h-full flex flex-col bg-[#0d0d0d] items-center justify-center">
        <Activity className="w-12 h-12 text-[#2a2e39] mb-3" />
        <p className="text-[#787b86] text-sm">Select a token to view chart</p>
      </div>
    );
  }

  const formatPrice = (value: number): string => {
    if (value < 0.000001) return `${currency === 'usd' ? '$' : ''}${value.toFixed(12)}`;
    if (value < 0.001) return `${currency === 'usd' ? '$' : ''}${value.toFixed(9)}`;
    if (value < 1) return `${currency === 'usd' ? '$' : ''}${value.toFixed(6)}`;
    return `${currency === 'usd' ? '$' : ''}${value.toFixed(4)}`;
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0d0d] relative overflow-hidden">
      <div className="border-b border-white/10 bg-[#0d0d0d] shrink-0">
        <div className="h-9 flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-[#1a1a1a] rounded-md p-0.5">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  data-testid={`button-timeframe-${tf}`}
                  className={`px-2.5 py-1 text-[11px] rounded transition-all font-mono font-medium ${
                    timeframe === tf ? 'bg-violet-500/20 text-violet-400' : 'text-[#787b86] hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] rounded-md px-2 py-1" data-testid="candle-countdown">
              <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
              <span className="text-[11px] font-mono text-violet-400">{candleCountdown}</span>
            </div>

            <div className="flex items-center bg-[#1a1a1a] rounded-md">
              <button
                onClick={() => setCurrency('usd')}
                data-testid="button-currency-usd"
                className={`px-2 py-1 text-[11px] rounded-l-md font-mono transition-all ${
                  currency === 'usd' ? 'bg-violet-500/20 text-violet-400' : 'text-[#787b86] hover:text-white'
                }`}
              >
                USD
              </button>
              <span className="text-[#3a3a3a] text-[11px]">/</span>
              <button
                onClick={() => setCurrency('eth')}
                data-testid="button-currency-eth"
                className={`px-2 py-1 text-[11px] rounded-r-md font-mono transition-all ${
                  currency === 'eth' ? 'bg-violet-500/20 text-violet-400' : 'text-[#787b86] hover:text-white'
                }`}
              >
                ETH
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={`https://basescan.org/address/0xc72C354Bd1608D5e79b822DC4416Cd039BAd8524`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#787b86] hover:text-white transition-colors hover:bg-white/5 rounded font-mono"
              data-testid="link-basescan"
            >
              <ExternalLink className="w-3 h-3" />
              BaseScan
            </a>
          </div>
        </div>

        <div className="h-8 flex items-center justify-between px-3 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-white">
                Token #{tokenId}
              </span>
              <span className="text-[10px] text-[#787b86]">·</span>
              <span className="text-[10px] text-[#787b86]">SafeLaunch | Base</span>
              <div className="w-2 h-2 rounded-full bg-violet-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-violet-400 text-[13px] font-mono font-semibold">
                {formatPrice(currentPrice)}
              </span>
              <span className={`text-[11px] font-mono ${priceChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[#787b86]">
            <span>Volume</span>
            <span className="text-violet-400 font-mono">ETH</span>
          </div>
        </div>
      </div>

      <div ref={chartContainerRef} className="flex-1 w-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0d]/80 z-10">
            <div className="flex items-center gap-2 text-[#787b86]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-mono">Loading chart data...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
