import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownRight, User, Crown, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function TradeHistory() {
  const { trades, selectedToken, solPrice } = useStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("trades");

  const filteredTrades = trades.filter(t => t.mint === selectedToken?.mint);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: `${label} copied`,
      duration: 1500,
      className: "bg-background border border-white/10 text-foreground"
    });
  };

  const formatTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const formatSol = (amount: number) => {
    if (amount >= 1) return amount.toFixed(2);
    if (amount >= 0.1) return amount.toFixed(3);
    return amount.toFixed(4);
  };

  const holders = filteredTrades.reduce((acc, trade) => {
    if (!acc[trade.trader]) {
      acc[trade.trader] = { 
        address: trade.trader, 
        netSol: 0, 
        buyCount: 0, 
        sellCount: 0,
        isDevWallet: trade.isDevWallet,
        lastTrade: trade.timestamp
      };
    }
    if (trade.txType === 'buy') {
      acc[trade.trader].netSol += trade.solAmount;
      acc[trade.trader].buyCount++;
    } else {
      acc[trade.trader].netSol -= trade.solAmount;
      acc[trade.trader].sellCount++;
    }
    acc[trade.trader].lastTrade = Math.max(acc[trade.trader].lastTrade, trade.timestamp);
    return acc;
  }, {} as Record<string, { address: string; netSol: number; buyCount: number; sellCount: number; isDevWallet: boolean; lastTrade: number }>);

  const holdersList = Object.values(holders)
    .filter(h => h.netSol > 0)
    .sort((a, b) => b.netSol - a.netSol);

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] font-mono">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="shrink-0 border-b border-white/5 px-3 py-1.5">
          <TabsList className="h-7 bg-transparent p-0 gap-4">
            <TabsTrigger 
              value="trades" 
              data-testid="tab-trades"
              className="h-7 px-0 bg-transparent text-[11px] font-bold tracking-wider data-[state=active]:text-emerald-400 data-[state=active]:shadow-none text-muted-foreground hover:text-white"
            >
              TRADES ({filteredTrades.length})
            </TabsTrigger>
            <TabsTrigger 
              value="holders" 
              data-testid="tab-holders"
              className="h-7 px-0 bg-transparent text-[11px] font-bold tracking-wider data-[state=active]:text-emerald-400 data-[state=active]:shadow-none text-muted-foreground hover:text-white"
            >
              HOLDERS ({holdersList.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="trades" className="flex-1 m-0 overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar">
            {filteredTrades.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                No trades yet - waiting for activity...
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                <AnimatePresence initial={false}>
                  {filteredTrades.slice(0, 50).map((trade) => (
                    <motion.div
                      key={trade.signature}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`px-3 py-2 flex items-center gap-3 hover:bg-white/[0.02] ${
                        trade.isDevWallet ? 'bg-yellow-500/5 border-l-2 border-yellow-500' : ''
                      }`}
                      data-testid={`trade-${trade.signature.slice(0, 8)}`}
                    >
                      <div className={`p-1.5 rounded ${
                        trade.txType === 'buy' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {trade.txType === 'buy' 
                          ? <ArrowUpRight className="w-3.5 h-3.5" />
                          : <ArrowDownRight className="w-3.5 h-3.5" />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${
                            trade.txType === 'buy' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {trade.txType === 'buy' ? 'BUY' : 'SELL'}
                          </span>
                          {trade.isDevWallet && (
                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                              <Crown className="w-2.5 h-2.5" />
                              DEV
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatTime(trade.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <button 
                            onClick={() => copyToClipboard(trade.trader, "Address")}
                            className="text-[10px] text-muted-foreground hover:text-white flex items-center gap-1"
                          >
                            <User className="w-2.5 h-2.5" />
                            {trade.trader.slice(0, 4)}...{trade.trader.slice(-4)}
                          </button>
                          <a
                            href={`https://solscan.io/tx/${trade.signature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-white"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xs font-bold tabular-nums ${
                          trade.txType === 'buy' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {trade.txType === 'buy' ? '+' : '-'}{formatSol(trade.solAmount)} SOL
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          ${(trade.solAmount * (solPrice || 150)).toFixed(2)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="holders" className="flex-1 m-0 overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar">
            {holdersList.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                No holders detected yet...
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {holdersList.map((holder, index) => (
                  <div
                    key={holder.address}
                    className={`px-3 py-2 flex items-center gap-3 hover:bg-white/[0.02] ${
                      holder.isDevWallet ? 'bg-yellow-500/5 border-l-2 border-yellow-500' : ''
                    }`}
                    data-testid={`holder-${holder.address.slice(0, 8)}`}
                  >
                    <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      #{index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(holder.address, "Address")}
                          className="text-xs font-medium text-white hover:text-emerald-400 flex items-center gap-1"
                        >
                          {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                          <Copy className="w-2.5 h-2.5 opacity-50" />
                        </button>
                        {holder.isDevWallet && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                            <Crown className="w-2.5 h-2.5" />
                            DEV
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {holder.buyCount} buys · {holder.sellCount} sells
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold tabular-nums text-emerald-400">
                        {formatSol(holder.netSol)} SOL
                      </div>
                      <div className="text-[10px] text-muted-foreground tabular-nums">
                        ${(holder.netSol * (solPrice || 150)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
