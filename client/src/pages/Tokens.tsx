import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rocket, 
  Shield, 
  Flame,
  Timer,
  Zap,
  ArrowLeft,
  Plus,
  Loader2,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LaunchForm } from "@/components/launchpad/LaunchForm";
import { WalletButton } from "@/components/launchpad/WalletButton";
import safeLaunchLogo from "@assets/generated_images/safelaunch_shield_rocket_logo.png";
import defaultTokenImage from "@assets/generated_images/meme_crypto_token_icon.png";
import { useQuery } from "@tanstack/react-query";
import { getAllTokens, type LiveToken } from "@/lib/safeLaunchContract";
import { useTokenListEvents } from "@/hooks/useContractEvents";

function formatTime(seconds: number): string {
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  }
  const days = Math.floor(seconds / 86400);
  return `${days}d`;
}

function TokenRow({ token }: { token: LiveToken }) {
  const isHot = token.progress > 70;
  const isEnding = token.timeLeft < 7200 && token.timeLeft > 0;
  const isExpired = token.timeLeft === 0 && !token.bonded;

  return (
    <Link href={`/tokens/${token.id}`} data-testid={`link-token-${token.id}`}>
        <motion.div
          whileHover={{ scale: 1.01, backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
          whileTap={{ scale: 0.99 }}
          className="flex items-center gap-4 p-4 rounded-full bg-[#1a1a1a] border border-white/10 cursor-pointer hover:border-violet-500/30 transition-colors"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden bg-violet-500/20 flex-shrink-0">
            <img 
              src={token.image || defaultTokenImage} 
              alt={token.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = defaultTokenImage; }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-white truncate">{token.name}</h4>
              <span className="text-xs text-white/40">${token.symbol}</span>
              {token.bonded && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">BONDED</span>
                </span>
              )}
              {token.failed && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                  <XCircle className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">FAILED</span>
                </span>
              )}
              {isHot && !token.bonded && !token.failed && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                  <Flame className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">HOT</span>
                </span>
              )}
              {isEnding && !isHot && !token.bonded && !token.failed && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse">
                  <Timer className="w-3 h-3" />
                  <span className="text-[10px] font-semibold">ENDING</span>
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-[120px]">
                <div 
                  className={`h-full rounded-full ${token.bonded ? 'bg-emerald-500' : 'bg-violet-500'}`}
                  style={{ width: `${token.progress}%` }}
                />
              </div>
              <span className="text-xs text-violet-400 font-medium">{token.progress}%</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-xs text-white/50 flex-shrink-0">
            <div className="text-center">
              <p className="text-white font-medium">{token.buyers}</p>
              <p className="text-[10px]">buyers</p>
            </div>
            <div className={`text-center font-mono ${isEnding ? 'text-red-400' : ''}`}>
              <p className="text-white font-medium">
                {token.bonded ? '✓' : token.failed ? '✗' : formatTime(token.timeLeft)}
              </p>
              <p className="text-[10px]">{token.bonded ? 'complete' : token.failed ? 'ended' : 'left'}</p>
            </div>
            <div className="text-center">
              <p className="text-violet-400 font-medium">{token.raised} ETH</p>
              <p className="text-[10px]">raised</p>
            </div>
          </div>
        </motion.div>
    </Link>
  );
}

export default function Tokens() {
  const [filter, setFilter] = useState<'all' | 'hot' | 'new' | 'ending' | 'bonded'>('all');
  const [showLaunchForm, setShowLaunchForm] = useState(false);

  useTokenListEvents();

  const { data: tokens = [], isLoading, error } = useQuery({
    queryKey: ['safelaunch-tokens'],
    queryFn: getAllTokens,
    refetchInterval: 30000,
  });

  const filteredTokens = tokens.filter(token => {
    if (filter === 'hot') return token.progress > 70 && !token.bonded && !token.failed;
    if (filter === 'ending') return token.timeLeft < 7200 && token.timeLeft > 0 && !token.bonded && !token.failed;
    if (filter === 'new') return token.progress < 30 && !token.bonded && !token.failed;
    if (filter === 'bonded') return token.bonded;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative overflow-y-auto overflow-x-hidden h-screen">
      
      <header className="relative border-b border-white/5 backdrop-blur-xl bg-black/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="relative">
                    <div className="absolute inset-0 bg-violet-500 blur-lg opacity-50" />
                    <img src={safeLaunchLogo} alt="SafeLaunch" className="relative w-10 h-10 rounded-xl" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                      SafeLaunch
                    </h1>
                    <p className="text-[10px] text-violet-400/80 font-medium tracking-wider uppercase">
                      Live Tokens
                    </p>
                  </div>
              </Link>
            </div>

            <WalletButton />
          </div>
        </div>
      </header>

      <main className="relative py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Live Tokens</h2>
              <p className="text-white/40">Buy now before they bond to Uniswap</p>
            </div>
            
            <Button 
              onClick={() => setShowLaunchForm(true)}
              className="bg-violet-500 hover:bg-violet-400 text-white font-semibold px-5 py-2 rounded-xl"
              data-testid="button-launch-token"
            >
              <Plus className="w-4 h-4 mr-2" />
              Launch Token
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-6">
            {[
              { id: 'all', label: 'All', icon: null },
              { id: 'hot', label: 'Hot', icon: Flame },
              { id: 'ending', label: 'Ending', icon: Timer },
              { id: 'new', label: 'New', icon: Zap },
              { id: 'bonded', label: 'Bonded', icon: CheckCircle },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                data-testid={`button-filter-${f.id}`}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === f.id 
                    ? 'bg-violet-500 text-white' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {f.icon && <f.icon className="w-3.5 h-3.5" />}
                {f.label}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-4" />
              <p className="text-white/40">Loading tokens from Base...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white/40">Failed to load tokens</p>
              <p className="text-xs text-white/30 mt-2">Please check your connection to Base network</p>
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredTokens.map((token, i) => (
                  <motion.div
                    key={token.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <TokenRow token={token} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!isLoading && !error && filteredTokens.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40">
                {tokens.length === 0 
                  ? "No tokens launched yet. Be the first!" 
                  : "No tokens found with this filter"
                }
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 px-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={safeLaunchLogo} alt="SafeLaunch" className="w-5 h-5" />
            <span className="text-sm text-white/40">SafeLaunch © 2024</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="#" className="flex items-center gap-2 hover:text-white transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 1000 1000" fill="currentColor">
                <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z"/>
                <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.444H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z"/>
                <path d="M693.333 746.667C681.06 746.667 671.111 756.616 671.111 768.889V795.556H666.667C654.394 795.556 644.444 805.505 644.444 817.778V844.444H893.333V817.778C893.333 805.505 883.384 795.556 871.111 795.556H866.667V768.889C866.667 756.616 856.717 746.667 844.444 746.667V351.111H868.889L897.778 253.333H720V746.667H693.333Z"/>
              </svg>
              Farcaster
            </a>
            <a href="#" className="flex items-center gap-2 hover:text-white transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Docs
            </a>
          </div>
        </div>
      </footer>
      </div>

      <AnimatePresence>
        {showLaunchForm && (
          <LaunchForm onClose={() => setShowLaunchForm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
