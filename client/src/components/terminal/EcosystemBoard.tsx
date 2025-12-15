import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

const stats = [
  { label: "Ecosystem Volume", value: "$420.69M", change: "+12.5%", icon: Activity },
  { label: "Active Traders", value: "24,592", change: "+5.2%", icon: Users },
  { label: "Top Gainer (24h)", value: "BONK (+15%)", change: "Hot", icon: TrendingUp },
  { label: "Total Liquidity", value: "$85.2M", change: "+1.2%", icon: DollarSign },
];

export function EcosystemBoard() {
  return (
    <div className="h-full bg-card/50 backdrop-blur-md border-t border-white/5 p-4 flex items-center">
      <div className="flex gap-6 overflow-x-auto w-full custom-scrollbar pb-2">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex-1 min-w-[200px] p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <stat.icon className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-lg font-bold font-mono text-foreground">{stat.value}</span>
              <span className="text-xs text-primary mb-1">{stat.change}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
