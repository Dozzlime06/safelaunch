import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Rocket, 
  Shield, 
  Clock, 
  TrendingUp, 
  Zap, 
  Lock,
  ArrowRight,
  Plus,
  Users,
  DollarSign,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LaunchForm } from "@/components/launchpad/LaunchForm";
import { WalletButton } from "@/components/launchpad/WalletButton";
import { ManifestSigner } from "@/components/launchpad/ManifestSigner";
import safeLaunchLogo from "@assets/generated_images/safelaunch_shield_rocket_logo.png";
import { getTokenCount, getToken, getBuyEvents, BONDING_TARGET } from "@/lib/safeLaunchContract";
import { formatEther } from "viem";

async function fetchPlatformStats() {
  const tokenCount = await getTokenCount();
  if (tokenCount === 0) {
    return { totalLaunched: 0, totalVolume: 0, successRate: 0, totalBuyers: 0 };
  }

  let totalVolume = 0;
  let bondedCount = 0;
  const uniqueBuyers = new Set<string>();

  for (let i = 1; i <= tokenCount; i++) {
    const token = await getToken(i);
    if (token) {
      totalVolume += parseFloat(formatEther(token.totalRaised));
      if (token.bonded) bondedCount++;
      
      const buyEvents = await getBuyEvents(i);
      buyEvents.forEach(event => uniqueBuyers.add(event.buyer));
    }
  }

  const successRate = tokenCount > 0 ? Math.round((bondedCount / tokenCount) * 100) : 0;

  return {
    totalLaunched: tokenCount,
    totalVolume,
    successRate,
    totalBuyers: uniqueBuyers.size
  };
}

export default function Launchpad() {
  const [showLaunchForm, setShowLaunchForm] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['platformStats'],
    queryFn: fetchPlatformStats,
    staleTime: 30000,
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative overflow-y-auto overflow-x-hidden h-screen">
      
      <header className="relative border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-violet-500 blur-lg opacity-50" />
                <img src={safeLaunchLogo} alt="SafeLaunch" className="relative w-10 h-10 rounded-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  SafeLaunch
                </h1>
                <p className="text-[10px] text-violet-400/80 font-medium tracking-wider uppercase">
                  No Dumps. No Rugs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm">
                <Link href="/tokens" className="text-white/60 hover:text-white transition-colors">
                  Tokens
                </Link>
                <a href="#how-it-works" className="text-white/60 hover:text-white transition-colors">How it Works</a>
                <Link href="/docs" className="text-white/60 hover:text-white transition-colors">Docs</Link>
              </div>
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
                <Zap className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-violet-400 font-medium">Built on Base • Farcaster Native</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
                  The Safest Way to
                </span>
                <br />
                <span className="bg-gradient-to-r from-violet-400 to-violet-300 bg-clip-text text-transparent">
                  Launch Tokens
                </span>
              </h2>
              
              <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
                No selling during bonding curve. Auto-refund if launch fails. 
                Liquidity locked forever. Finally, a fair launch platform.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
                <Link href="/tokens" data-testid="button-explore-tokens">
                  <Button className="bg-violet-500 hover:bg-violet-400 text-white font-semibold px-8 py-3 rounded-full text-lg">
                    Explore Tokens
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button 
                  onClick={() => setShowLaunchForm(true)}
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-full text-lg border border-white/20"
                  data-testid="button-launch-token-hero"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Launch Token
                </Button>
                <Link href="/docs" data-testid="button-docs" className="md:hidden">
                  <Button className="bg-white/5 hover:bg-white/10 text-white/70 font-semibold px-8 py-3 rounded-full text-lg border border-white/10">
                    <FileText className="w-5 h-5 mr-2" />
                    Docs
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-4 mb-16">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">No Dumps</p>
                    <p className="text-xs text-white/40">Selling blocked until bond</p>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">Time Limited</p>
                    <p className="text-xs text-white/40">Max 3 days to bond</p>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">Auto Refund</p>
                    <p className="text-xs text-white/40">Get ETH back if fail</p>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">Auto Migrate</p>
                    <p className="text-xs text-white/40">Instant Uniswap V3 LP</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { label: "Total Launched", value: stats?.totalLaunched?.toLocaleString() || "0", icon: Rocket },
                { label: "Total Volume", value: `${(stats?.totalVolume || 0).toFixed(2)} ETH`, icon: DollarSign },
                { label: "Success Rate", value: `${stats?.successRate || 0}%`, icon: TrendingUp },
                { label: "Total Buyers", value: stats?.totalBuyers?.toLocaleString() || "0", icon: Users },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10"
                >
                  <stat.icon className="w-5 h-5 text-violet-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/40">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 px-4 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-white mb-4">How SafeLaunch Works</h3>
              <p className="text-white/40">Simple, transparent, and safe for everyone</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "1",
                  title: "Create Token",
                  desc: "Set name, symbol, image, and time limit (max 3 days)",
                  color: "emerald"
                },
                {
                  step: "2", 
                  title: "Users Buy",
                  desc: "Bonding curve - price increases with each buy. No selling allowed.",
                  color: "blue"
                },
                {
                  step: "3",
                  title: "Bond Complete",
                  desc: "Target reached? Auto-migrate to Uniswap V3 with locked LP.",
                  color: "purple"
                },
                {
                  step: "4",
                  title: "Or Refund",
                  desc: "Time expired without bonding? Everyone gets their ETH back.",
                  color: "orange"
                }
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  {i < 3 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-white/20 to-transparent" />
                  )}
                  <div className={`w-16 h-16 rounded-2xl bg-${item.color}-500/20 flex items-center justify-center mb-4`}>
                    <span className={`text-2xl font-bold text-${item.color}-400`}>{item.step}</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
                  <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-12 rounded-3xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
              
              <div className="relative">
                <Rocket className="w-12 h-12 text-violet-400 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-white mb-4">Ready to Launch?</h3>
                <p className="text-white/60 mb-8 max-w-lg mx-auto">
                  Create your token in seconds. Protected bonding curve. Automatic Uniswap migration.
                </p>
                <Button 
                  onClick={() => setShowLaunchForm(true)}
                  className="bg-white text-black hover:bg-white/90 font-semibold px-8 py-3 rounded-xl text-lg"
                  data-testid="button-launch-cta"
                >
                  Launch Your Token
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 px-4">
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

      <ManifestSigner />
    </div>
  );
}
