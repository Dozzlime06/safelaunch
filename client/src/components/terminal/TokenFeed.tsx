import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, AlertTriangle, Copy, User, Filter, Activity, TrendingUp, Crown, SlidersHorizontal, Search, X } from "lucide-react";
import { useStore } from "@/store/store";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

interface PumpToken {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  price: number;
  marketCapSol: number;
  change24h: number; 
  image?: string;
  description?: string;
  bondingCurveProgress: number; // 0-100%
  creator: string;
  volume: number;
  liquidity: number;
  marketCap: number;
  timestamp: number;
  lastBuyTimestamp?: number;
}

// Helper to generate realistic looking mock data for initial state
const generateMockTokens = (count: number): PumpToken[] => {
  const prefixes = ["Pepe", "Doge", "Shiba", "Elon", "Moon", "Safe", "Rocket", "Cat", "Bonk", "Wif", "Trump", "Biden", "Based", "Chad", "Giga", "Mog", "Pop", "Retardio"];
  const suffixes = ["Inu", "Coin", "Swap", "Bet", "AI", "GPT", "Fi", "Dao", "Verse", "Sol", "Moon", "Boy", "Girl", "Pep", "WifHat", "Tard"];
  
  return Array.from({ length: count }).map((_, i) => {
    const isWhale = Math.random() > 0.8;
    // Base MC for new mints is usually around 30-50 SOL.
    // But we need to simulate some older/pumped tokens too for the filter to work.
    let baseMc;
    if (Math.random() > 0.8) {
        // 20% chance of "Graduating" or "Pumped" token (50k - 500k USD range ~ 300 - 3000 SOL)
        baseMc = 300 + Math.random() * 3000;
    } else if (Math.random() > 0.6) {
        // 20% chance of "Rising" token (10k - 50k USD range ~ 60 - 300 SOL)
        baseMc = 60 + Math.random() * 240;
    } else {
        // 60% chance of "Fresh Mint" (4k - 8k USD range ~ 25 - 50 SOL)
        baseMc = 25 + Math.random() * 25;
    }
    
    const marketCapSol = isWhale ? baseMc * 1.5 : baseMc;
    const timestamp = Date.now() - (i * (Math.random() * 60000 + 10000)); // Staggered back in time
    
    const name = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    const symbol = name.split(' ').map(w => w.toUpperCase()).join('') + (Math.random() > 0.5 ? "" : Math.floor(Math.random() * 100));
    
    // Use diverse meme-style image sources
    const imageSource = Math.random();
    let image;
    
    if (imageSource > 0.66) {
        // Pixel Art (Retro/Game vibes)
        image = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${symbol}`;
    } else if (imageSource > 0.33) {
        // Cats (Classic internet meme)
        image = `https://robohash.org/${symbol}.png?set=set4`;
    } else {
        // Robots/Aliens (Tech/DeFi vibes)
        image = `https://robohash.org/${symbol}.png?set=set1`;
    }
    
    return {
      mint: `mock-${Math.random().toString(36).substring(7)}`,
      name: name,
      symbol: symbol,
      uri: "",
      price: 0.00000001 + Math.random() * 0.0000005,
      marketCapSol: marketCapSol,
      change24h: Math.random() * 100,
      image: image, 
      bondingCurveProgress: Math.min((marketCapSol / 85) * 100, 100),
      creator: `User${Math.floor(Math.random() * 1000)}`,
      volume: Math.random() * 1000,
      liquidity: marketCapSol,
      marketCap: marketCapSol,
      timestamp: timestamp
    };
  });
};

export function TokenFeed() {
  const { setSelectedToken, selectedToken, tokens, setTokens, solPrice, setSolPrice, minMcap, setMinMcap, animationsEnabled, setAnimationsEnabled } = useStore();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedToken, setSearchedToken] = useState<PumpToken | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  // Force re-render for time ago updates
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Search for token by contract address using pump.fun API
  useEffect(() => {
    if (!searchQuery) {
      setSearchedToken(null);
      setIsSearching(false);
      return;
    }

    // Check if search query looks like a Solana address (32-44 chars, base58)
    const isCA = searchQuery.length >= 32 && searchQuery.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(searchQuery);
    
    if (isCA) {
      // Check if token already exists in feed
      const existingToken = tokens.find(t => t.mint.toLowerCase() === searchQuery.toLowerCase());
      if (existingToken) {
        setSearchedToken(null);
        return;
      }

      setIsSearching(true);
      let cancelled = false;
      
      // Use pump.fun frontend API to get token info directly
      const fetchTokenInfo = async () => {
        try {
          const response = await fetch(`/api/tokens/${searchQuery}`);
          
          if (!response.ok) {
            throw new Error('Token not found');
          }
          
          const data = await response.json();
          
          if (cancelled) return;
          
          if (data && data.mint) {
            const marketCapSol = data.usd_market_cap ? data.usd_market_cap / (solPrice || 150) : 30;
            const bondingProgress = Math.min((marketCapSol / 85) * 100, 100);
            
            const token: PumpToken = {
              mint: data.mint,
              name: data.name || "Token",
              symbol: data.symbol || searchQuery.slice(0, 6),
              uri: data.metadata_uri || "",
              price: 0,
              marketCapSol: marketCapSol,
              change24h: 0,
              image: data.image_uri || "https://pump.fun/logo.png",
              bondingCurveProgress: bondingProgress,
              creator: data.creator || "Unknown",
              volume: 0,
              liquidity: marketCapSol,
              marketCap: marketCapSol,
              timestamp: data.created_timestamp || Date.now()
            };
            setSearchedToken(token);
          } else {
            setSearchedToken(null);
          }
        } catch (e) {
          console.error("Failed to fetch token info", e);
          if (!cancelled) {
            setSearchedToken(null);
          }
        } finally {
          if (!cancelled) {
            setIsSearching(false);
          }
        }
      };
      
      fetchTokenInfo();
      
      return () => {
        cancelled = true;
      };
    } else {
      setSearchedToken(null);
      setIsSearching(false);
    }
  }, [searchQuery, tokens, solPrice]);

  // Simulate buys for shake effect
  useEffect(() => {
    if (!animationsEnabled) return;

    const interval = setInterval(() => {
      setTokens(prev => {
        const randomIndex = Math.floor(Math.random() * Math.min(prev.length, 10)); // Only shake top 10
        if (!prev[randomIndex]) return prev;

        const newTokens = [...prev];
        const token = newTokens[randomIndex];
        
        // Simulate a "buy" visual effect without changing actual data
        // Keep exact data from API as requested by user
        const updatedToken: PumpToken = {
            ...token,
            bondingCurveProgress: Math.min(token.bondingCurveProgress + 0.01, 100)
        };
        if (updatedToken.lastBuyTimestamp !== undefined) {
            updatedToken.lastBuyTimestamp = Date.now();
        }
        newTokens[randomIndex] = updatedToken;
        
        // Re-sort if needed (simplified: just update for now)
        return newTokens;
      });
    }, 2000); // Random buy every 2s

    return () => clearInterval(interval);
  }, [animationsEnabled, setTokens]);

  const topBondedToken = tokens.reduce((prev, current) => 
    (prev.bondingCurveProgress > current.bondingCurveProgress) ? prev : current
  , tokens[0]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: `${label} copied to clipboard`,
      duration: 2000,
      className: "bg-background border border-white/10 text-foreground"
    });
  };

  
  useEffect(() => {
    // Fetch SOL Price only if not already set
    if (solPrice === 0) {
        const fetchSolPrice = async () => {
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await res.json();
            setSolPrice(data.solana.usd);
        } catch (e) {
            console.error("Failed to fetch SOL price", e);
            setSolPrice(150); // Fallback
        }
        };
        fetchSolPrice();
    }

    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audioRef.current.volume = 0.2;

    let ws: WebSocket | null = null;
    let keepAliveInterval: NodeJS.Timeout;

    const connect = () => {
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/pump`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('Connected to WebSocket proxy');
          setIsConnected(true);
          setError(null);
          
          ws?.send(JSON.stringify({
            method: "subscribeNewToken"
          }));
        };

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.txType === 'create') {
              // Use exact marketCapSol from PumpPortal API (no calculation needed)
              const marketCapSol = data.marketCapSol || 28;
              const bondingProgress = Math.min((marketCapSol / 85) * 100, 100);
              const priceInSol = marketCapSol / 1_000_000_000;

              const newToken: PumpToken = {
                mint: data.mint,
                name: data.name || "Unknown",
                symbol: data.symbol || "???",
                uri: data.uri,
                price: priceInSol,
                marketCapSol: marketCapSol,
                change24h: 0,
                image: "https://pump.fun/logo.png",
                bondingCurveProgress: bondingProgress,
                creator: data.traderPublicKey || "Unknown",
                volume: 0,
                liquidity: marketCapSol,
                marketCap: marketCapSol,
                timestamp: Date.now()
              };
              
              setTokens((prev) => {
                if (prev.some(t => t.mint === newToken.mint)) return prev;
                return [newToken, ...prev].slice(0, 50);
              });

              // Subscribe to trades for this new token
              ws?.send(JSON.stringify({
                method: "subscribeTokenTrade",
                keys: [data.mint]
              }));

              if (data.uri) {
                 fetch(data.uri)
                    .then(res => res.json())
                    .then(metadata => {
                        if (metadata.image) {
                            setTokens(prev => prev.map(t => 
                                t.mint === newToken.mint 
                                    ? { ...t, image: metadata.image } 
                                    : t
                            ));
                        }
                    })
                    .catch(() => {});
              }

              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
              }
            }
            
            // Handle trade updates (buy/sell) - update market cap in real-time
            if (data.txType === 'buy' || data.txType === 'sell') {
              const marketCapSol = data.marketCapSol;
              if (marketCapSol && data.mint) {
                const bondingProgress = Math.min((marketCapSol / 85) * 100, 100);
                const priceInSol = marketCapSol / 1_000_000_000;
                
                setTokens(prev => prev.map(t => 
                  t.mint === data.mint 
                    ? { 
                        ...t, 
                        marketCapSol: marketCapSol,
                        marketCap: marketCapSol,
                        price: priceInSol,
                        bondingCurveProgress: bondingProgress
                      } 
                    : t
                ));
              }
            }
          } catch (e) {
            console.error('Error parsing WS message', e);
          }
        };

        ws.onerror = (e) => {
          console.error('WebSocket error', e);
          setError("Connection Error");
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log('Disconnected');
          setIsConnected(false);
          setTimeout(connect, 3000);
        };

      } catch (e) {
        console.error("Failed to connect", e);
        setError("Failed to connect");
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (keepAliveInterval) clearInterval(keepAliveInterval);
    };
  }, []); // Empty dependency array ensures this runs once on mount, but store updates persist

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] border-r border-white/5 font-mono">
      {/* Header Section */}
      <div className="shrink-0 border-b border-white/5 bg-[#0A0A0A]/95 backdrop-blur-sm z-20">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-3 h-3">
              <div className={`absolute w-full h-full rounded-full ${isConnected ? 'bg-emerald-500/20 animate-ping' : 'bg-red-500/20'}`} />
              <div className={`relative w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[13px] font-bold tracking-wider text-white flex items-center gap-2">
                LIVE FEED <Activity className="w-3 h-3 text-emerald-500" />
              </h2>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {isConnected ? 'Connected to PumpPortal' : 'Connecting...'}
              </span>
            </div>
          </div>
          {error && (
             <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20">
               <AlertTriangle className="w-3 h-3 text-red-500" />
               <span className="text-[10px] font-medium text-red-500">Error</span>
             </div>
          )}

          {/* Feed Settings Popover */}
          <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white hover:bg-white/5 relative">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {minMcap > 0 && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 bg-[#111] border-white/10 text-white p-3 space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Filter className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-medium tracking-wide">MIN MARKET CAP (USD)</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                            <Input 
                                type="number" 
                                placeholder="0" 
                                value={minMcap === 0 ? '' : minMcap}
                                onChange={(e) => setMinMcap(Number(e.target.value))}
                                className="h-8 pl-6 bg-black/20 border-white/10 text-xs focus-visible:ring-emerald-500/50"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {[0, 1000, 5000].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setMinMcap(val)}
                                    className={`
                                        text-[10px] py-1 px-2 rounded-sm border transition-all font-medium font-mono
                                        ${minMcap === val 
                                            ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' 
                                            : 'bg-white/5 text-muted-foreground border-transparent hover:bg-white/10 hover:text-white'}
                                    `}
                                >
                                    {val === 0 ? 'ALL' : `>$${val/1000}k`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-yellow-500" />
                        <div className="flex flex-col">
                            <Label htmlFor="animations-feed" className="text-xs font-medium cursor-pointer">Live Animations</Label>
                            <span className="text-[9px] text-muted-foreground">Shake on new buys</span>
                        </div>
                    </div>
                    <Switch 
                        id="animations-feed" 
                        checked={animationsEnabled}
                        onCheckedChange={setAnimationsEnabled}
                        className="h-4 w-7"
                    />
                </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search token or CA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-token-search"
              autoComplete="off"
              autoFocus={false}
              className="w-full h-8 pl-8 pr-8 bg-black/30 border border-white/10 rounded-md text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                data-testid="button-clear-search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Feed List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0A0A]">
        {/* Loading indicator for CA search */}
        {isSearching && (
          <div className="p-4 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground">Searching token...</span>
          </div>
        )}

        {/* Searched token result */}
        {searchedToken && !isSearching && (
          <div className="p-2">
            <div className="text-[10px] text-emerald-500 font-medium mb-2 px-1">SEARCH RESULT</div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                group relative rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer
                bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50
              `}
              onClick={() => {
                setSelectedToken(searchedToken);
                setTokens(prev => {
                  if (prev.some(t => t.mint === searchedToken.mint)) return prev;
                  return [searchedToken, ...prev].slice(0, 50);
                });
                setSearchQuery("");
                setSearchedToken(null);
              }}
              data-testid="search-result-token"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500" />
              <div className="p-3">
                <div className="flex gap-3">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-lg bg-white/5 overflow-hidden border border-emerald-500/30">
                      <img 
                        src={searchedToken.image || "https://pump.fun/logo.png"} 
                        alt={searchedToken.symbol}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${searchedToken.symbol}`;
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-sm text-emerald-400">{searchedToken.symbol}</span>
                        <p className="text-[11px] text-muted-foreground truncate">{searchedToken.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          ${((searchedToken.marketCapSol * (solPrice || 150)) / 1000).toFixed(1)}k
                        </div>
                        <div className="text-[10px] text-emerald-500/80">{searchedToken.marketCapSol.toFixed(1)} SOL</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* No results message */}
        {searchQuery && !isSearching && !searchedToken && tokens.filter(t => {
          const query = searchQuery.toLowerCase();
          return t.name.toLowerCase().includes(query) || t.symbol.toLowerCase().includes(query) || t.mint.toLowerCase().includes(query);
        }).length === 0 && (
          <div className="p-8 flex flex-col items-center justify-center text-center opacity-50">
            <Search className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">No token found</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Try a different search or paste full CA</p>
          </div>
        )}

        {tokens.length === 0 && isConnected && !searchQuery && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 opacity-50">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                <Zap className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground font-mono">Waiting for new mints...</p>
          </div>
        )}
        
        <div className="p-2 space-y-2">
          <AnimatePresence initial={false}>
            {tokens
              .filter(token => {
                const mcUsd = token.marketCapSol * (solPrice || 150); 
                if (mcUsd < minMcap) return false;
                if (searchQuery) {
                  const query = searchQuery.toLowerCase();
                  return (
                    token.name.toLowerCase().includes(query) ||
                    token.symbol.toLowerCase().includes(query) ||
                    token.mint.toLowerCase().includes(query)
                  );
                }
                return true;
              })
              .map((token) => (
              <motion.div
                key={token.mint}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`
                  group relative rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer
                  ${selectedToken?.symbol === token.symbol 
                    ? 'bg-white/[0.03] border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                    : 'bg-[#111] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}
                `}
                onClick={() => setSelectedToken(token)}
              >
                {/* Active Indicator Strip */}
                {selectedToken?.symbol === token.symbol && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500" />
                )}

                <div className="p-3">
                  <div className="flex gap-3">
                    {/* Token Image */}
                    <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-lg bg-white/5 overflow-hidden border border-white/10 shadow-sm group-hover:border-white/20 transition-colors">
                            <img 
                                src={token.image?.includes('http') ? token.image : `https://pump.fun/logo.png`} 
                                alt={token.symbol}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback to DiceBear if image fails or is missing
                                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${token.symbol}`;
                                }}
                            />
                        </div>
                        {/* New Badge */}
                        {(Date.now() - token.timestamp) < 5000 && (
                            <div className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                        {/* Top Row */}
                        <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className={`font-bold text-sm tracking-tight transition-colors truncate
                                        ${selectedToken?.symbol === token.symbol ? 'text-emerald-400' : 'text-foreground group-hover:text-emerald-400'}
                                    `}>
                                        {token.symbol}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 whitespace-nowrap">
                                        • {Math.floor((Date.now() - token.timestamp) / 1000)}s ago
                                    </span>
                                </div>
                                <span className="text-[11px] text-muted-foreground truncate leading-tight opacity-70 group-hover:opacity-100 transition-opacity">
                                    {token.name}
                                </span>
                            </div>
                            
                            <div className="text-right shrink-0 flex flex-col items-end">
                                <div className="text-sm font-bold tabular-nums text-white tracking-tight">
                                    ${((token.marketCapSol * (solPrice || 150)) / 1000).toFixed(1)}k
                                </div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <span className="text-emerald-500/80">{token.marketCapSol.toFixed(1)} SOL</span>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Bottom Row - Actions & Bonding Curve */}
                  <div className="mt-3 flex items-center justify-between gap-3">
                     <div className="flex items-center gap-1.5">
                        <button 
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(token.mint, "CA");
                            }}
                            title="Copy CA"
                        >
                            <Copy className="w-3 h-3" />
                        </button>
                        <a 
                            href={`https://solscan.io/account/${token.creator}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-1.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-muted-foreground hover:text-white transition-colors border border-transparent hover:border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-[60px]">{token.creator.slice(0, 4)}</span>
                        </a>
                     </div>

                     <div className="flex-1 max-w-[120px] flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] font-medium text-muted-foreground/80">
                            <span>Curve</span>
                            <span className={token.bondingCurveProgress > 80 ? 'text-emerald-400' : ''}>
                                {token.bondingCurveProgress.toFixed(0)}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${token.bondingCurveProgress}%` }}
                                className={`h-full rounded-full ${
                                    token.bondingCurveProgress > 90 ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
                                    token.bondingCurveProgress > 50 ? 'bg-gradient-to-r from-emerald-500/80 to-emerald-500' :
                                    'bg-gradient-to-r from-emerald-500/50 to-emerald-500/80'
                                }`}
                            />
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
