import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Wallet, ArrowDownUp, Info, Activity } from "lucide-react";
import { useStore } from "@/store/store";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function TradePanel() {
  const { selectedToken, buyAmount, setBuyAmount, slippage, setSlippage } = useStore();
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [isTrading, setIsTrading] = useState(false);

  const handleTrade = async () => {
    setIsTrading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsTrading(false);
    setBuyAmount("");
  };

  return (
    <div className="h-full flex flex-col bg-card/50 backdrop-blur-md border-l border-white/5 font-sans">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex justify-between items-center">
        <div className="flex gap-4">
          <button 
            onClick={() => setTab('buy')}
            className={`text-sm font-bold transition-colors ${tab === 'buy' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            BUY
          </button>
          <button 
            onClick={() => setTab('sell')}
            className={`text-sm font-bold transition-colors ${tab === 'sell' ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
          >
            SELL
          </button>
        </div>
        <Settings className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Slippage */}
        <div className="space-y-2">
           <div className="flex justify-between text-xs text-muted-foreground">
             <span>Slippage Tolerance</span>
             <span className="text-foreground">{slippage}%</span>
           </div>
           <div className="flex gap-2">
             {[0.5, 1, 3].map((val) => (
               <button
                 key={val}
                 onClick={() => setSlippage(val)}
                 className={`flex-1 py-1 text-xs rounded border transition-colors ${
                   slippage === val 
                     ? 'bg-primary/20 border-primary text-primary' 
                     : 'bg-white/5 border-transparent hover:border-white/10'
                 }`}
               >
                 {val}%
               </button>
             ))}
             <button className="flex-1 py-1 text-xs rounded bg-white/5 border border-transparent hover:border-white/10">Custom</button>
           </div>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <div className="relative group">
            <label className="text-xs text-muted-foreground ml-1">Amount (SOL)</label>
            <div className="relative mt-1">
              <input
                type="number"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xl font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                <span className="text-xs text-muted-foreground">SOL</span>
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500" />
              </div>
            </div>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <div className="p-2 rounded-full bg-card border border-white/10 text-muted-foreground">
              <ArrowDownUp className="w-4 h-4" />
            </div>
          </div>

          <div className="relative opacity-60 hover:opacity-100 transition-opacity">
            <label className="text-xs text-muted-foreground ml-1">Receive ({selectedToken?.symbol})</label>
            <div className="relative mt-1">
              <input
                type="text"
                readOnly
                value={buyAmount ? (parseFloat(buyAmount) * 12345.67).toFixed(2) : "0.00"}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xl font-mono text-muted-foreground focus:outline-none cursor-default"
              />
               <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                <span className="text-xs text-muted-foreground">{selectedToken?.symbol}</span>
                <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-[10px] font-bold text-primary">
                  {selectedToken?.symbol?.[0]}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Amounts */}
        <div className="grid grid-cols-4 gap-2">
          {['1 SOL', '5 SOL', '10 SOL', 'MAX'].map((label) => (
             <button 
               key={label}
               className="py-2 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
             >
               {label}
             </button>
          ))}
        </div>

        {/* Info */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
          <div className="flex justify-between text-xs">
             <span className="text-muted-foreground">Price Impact</span>
             <span className="text-primary font-mono">{'<'} 0.01%</span>
          </div>
          <div className="flex justify-between text-xs">
             <span className="text-muted-foreground">Network Fee</span>
             <span className="text-foreground font-mono">0.00005 SOL</span>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleTrade}
          disabled={!buyAmount}
          className={`
            w-full py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg uppercase relative overflow-hidden
            ${tab === 'buy' 
              ? 'bg-primary text-black shadow-[0_0_20px_rgba(0,255,128,0.3)] hover:shadow-[0_0_30px_rgba(0,255,128,0.5)]' 
              : 'bg-destructive text-white shadow-[0_0_20px_rgba(255,0,80,0.3)] hover:shadow-[0_0_30px_rgba(255,0,80,0.5)]'
            }
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all
          `}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isTrading ? 'CONFIRMING...' : (tab === 'buy' ? 'PLACE BUY ORDER' : 'PLACE SELL ORDER')}
            {isTrading && <Activity className="w-5 h-5 animate-spin" />}
          </span>
          {/* Scanline effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent translate-y-[-100%] animate-[scan_2s_ease-in-out_infinite]" />
        </motion.button>

        {/* Wallet Info */}
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Wallet className="w-3 h-3" />
            <span>8x...3j92</span>
          </div>
          <span className="text-primary">Connected</span>
        </div>
      </div>
    </div>
  );
}
