import { motion } from "framer-motion";
import { Users, Clock, Flame } from "lucide-react";

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

interface TokenCardProps {
  token: LiveToken;
  onClick: () => void;
}

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

export function TokenCard({ token, onClick }: TokenCardProps) {
  const isHot = token.progress > 70;
  const isEnding = token.timeLeft < 7200;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      data-testid={`card-token-${token.id}`}
      className="flex items-center gap-4 p-4 rounded-full bg-[#1a1a1a] border border-white/10 cursor-pointer hover:border-violet-500/30 transition-colors"
    >
      <div className="w-12 h-12 rounded-full overflow-hidden bg-violet-500/20 flex-shrink-0">
        <img 
          src={token.image} 
          alt={token.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-white truncate">{token.name}</h4>
          <span className="text-xs text-white/40">${token.symbol}</span>
          {isHot && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
              <Flame className="w-3 h-3" />
              <span className="text-[10px] font-semibold">HOT</span>
            </span>
          )}
          {isEnding && !isHot && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-semibold">ENDING</span>
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 mt-1">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-[120px]">
            <div 
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${token.progress}%` }}
            />
          </div>
          <span className="text-xs text-violet-400 font-medium">{token.progress}%</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-white/50 flex-shrink-0">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>{token.buyers}</span>
        </div>
        <div className={`font-mono ${isEnding ? 'text-red-400' : ''}`}>
          {formatTime(token.timeLeft)}
        </div>
        <div className="font-mono text-violet-400">
          {token.raised} ETH
        </div>
      </div>
    </motion.div>
  );
}
