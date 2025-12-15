import { useState } from "react";
import { motion } from "framer-motion";
import { 
  X, 
  Clock, 
  Users, 
  TrendingUp, 
  ExternalLink,
  Copy,
  Check,
  Minus,
  Plus,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LiveToken {
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
}

interface TokenDetailProps {
  token: LiveToken;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function TokenDetail({ token, onClose }: TokenDetailProps) {
  const [buyAmount, setBuyAmount] = useState("0.1");
  const [copied, setCopied] = useState(false);

  const estimatedTokens = parseFloat(buyAmount) / token.price;
  const progressPercent = token.progress;

  const handleCopy = () => {
    navigator.clipboard.writeText(token.creator);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickAmounts = [0.05, 0.1, 0.25, 0.5, 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0f0f0f] rounded-3xl border border-white/10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-purple-500/5 pointer-events-none" />
        
        <div className="relative p-6 border-b border-white/5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10">
                  <img 
                    src={token.image} 
                    alt={token.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center border-2 border-[#0f0f0f]">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{token.name}</h2>
                <p className="text-white/40">${token.symbol}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              data-testid="button-close-detail"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span className="text-xs text-white/40">Creator:</span>
            <code className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded">
              {token.creator}
            </code>
            <button 
              onClick={handleCopy}
              className="text-white/40 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="relative p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <TrendingUp className="w-4 h-4 text-violet-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{token.progress}%</p>
              <p className="text-[10px] text-white/40">Bonded</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{token.buyers}</p>
              <p className="text-[10px] text-white/40">Buyers</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center">
              <Clock className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{formatTime(token.timeLeft).split(' ')[0]}</p>
              <p className="text-[10px] text-white/40">Left</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/40">Bonding Progress</span>
              <span className="text-sm text-white">{token.raised} / {token.target} ETH</span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-500 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </motion.div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-white/30">0 ETH</span>
              <span className="text-xs text-white/30">{token.target} ETH</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/60">Current Price</span>
              <span className="text-lg font-bold text-violet-400 font-mono">
                ${token.price.toFixed(8)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-violet-400/60">
              <Shield className="w-3 h-3" />
              <span>No selling until bonding completes</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-white/60">
              Buy Amount (ETH)
            </label>
            
            <div className="flex gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBuyAmount(amount.toString())}
                  data-testid={`button-amount-${amount}`}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    buyAmount === amount.toString()
                      ? 'bg-violet-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setBuyAmount((prev) => Math.max(0.01, parseFloat(prev) - 0.05).toFixed(2))}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                data-testid="button-decrease"
              >
                <Minus className="w-4 h-4 text-white/60" />
              </button>
              <Input
                type="number"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="flex-1 text-center bg-white/5 border-white/10 text-white text-lg font-mono"
                data-testid="input-buy-amount"
              />
              <button
                onClick={() => setBuyAmount((prev) => (parseFloat(prev) + 0.05).toFixed(2))}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                data-testid="button-increase"
              >
                <Plus className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">You will receive</span>
                <span className="text-white font-mono">
                  ~{estimatedTokens.toLocaleString(undefined, { maximumFractionDigits: 0 })} {token.symbol}
                </span>
              </div>
            </div>
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white font-semibold py-6 rounded-xl text-lg"
            data-testid="button-buy"
          >
            Buy {token.symbol}
          </Button>

          <p className="text-center text-xs text-white/30">
            By buying, you agree that selling is disabled until bonding completes or refund is processed.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
