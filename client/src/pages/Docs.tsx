import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Shield, 
  Rocket, 
  Users, 
  Clock, 
  RefreshCw,
  CheckCircle,
  TrendingUp,
  Coins,
  FileText,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import safeLaunchLogo from "@assets/generated_images/safelaunch_shield_rocket_logo.png";
import { WalletButton } from "@/components/launchpad/WalletButton";

const CONTRACT_ADDRESS = "0xc72C354Bd1608D5e79b822DC4416Cd039BAd8524";

export default function Docs() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <header className="fixed top-0 left-0 right-0 border-b border-white/5 backdrop-blur-xl bg-black/80 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
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

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-violet-400" />
            <h1 className="text-3xl font-bold">Documentation</h1>
          </div>
          <p className="text-white/60 max-w-2xl mx-auto">
            Learn how SafeLaunch works, understand the bonding curve, and explore our roadmap.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-400" />
            Overview
          </h2>
          <p className="text-white/70 leading-relaxed">
            SafeLaunch is a decentralized token launch platform on Base network that ensures fair launches 
            with built-in investor protection through automatic refunds. Create and launch meme tokens with 
            a transparent bonding curve mechanism - if a token fails to reach its funding goal, all investors 
            are automatically entitled to full refunds.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="w-6 h-6 text-violet-400" />
            How the Platform Works
          </h2>

          <div className="grid gap-4">
            <div className="p-5 rounded-xl bg-[#0d0d0d] border border-white/10">
              <h3 className="font-semibold text-lg mb-3 text-emerald-400">The Problem with Traditional Launches</h3>
              <ul className="space-y-2 text-white/60">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span><strong className="text-white/80">Rug pulls:</strong> Developers can drain liquidity and disappear</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span><strong className="text-white/80">Whale manipulation:</strong> Large wallets dominate and dump on retail</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span><strong className="text-white/80">No protection:</strong> Investors lose everything if project fails</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-[#0d0d0d] border border-violet-500/20">
              <h3 className="font-semibold text-lg mb-3 text-violet-400">The SafeLaunch Solution</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm shrink-0">1</div>
                  <div>
                    <p className="font-medium text-white">Token Creation</p>
                    <p className="text-white/50 text-sm">Creator pays 0.001 ETH fee, token deploys with 7-day countdown, starting MC: $5,000</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm shrink-0">2</div>
                  <div>
                    <p className="font-medium text-white">Bonding Phase</p>
                    <p className="text-white/50 text-sm">Users buy tokens (max 0.5 ETH each), price increases along curve, target: 8.5 ETH</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">3a</div>
                  <div>
                    <p className="font-medium text-emerald-400">Success Path</p>
                    <p className="text-white/50 text-sm">Target reached → Token bonded → Liquidity added to DEX → Free trading enabled</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm shrink-0">3b</div>
                  <div>
                    <p className="font-medium text-orange-400">Failure Path</p>
                    <p className="text-white/50 text-sm">Deadline expires → Token marked failed → All contributors claim full refunds</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-violet-400" />
            Key Features
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-[#0d0d0d] border border-white/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                Fair Launch Mechanics
              </h3>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>Starting Market Cap: <span className="text-white">$5,000</span></li>
                <li>Target Market Cap: <span className="text-white">$30,000</span></li>
                <li>Bonding Target: <span className="text-white">8.5 ETH</span></li>
                <li>Launch Deadline: <span className="text-white">7 days</span></li>
                <li>Max Buy Per Wallet: <span className="text-white">0.5 ETH</span></li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-[#0d0d0d] border border-white/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Investor Protection
              </h3>
              <ul className="space-y-2 text-white/60 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Automatic refund system for failed launches</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Funds locked until bonding completes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>100% ETH returned on failure</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-violet-400" />
            Refund System
          </h2>

          <div className="p-5 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
            <h3 className="font-semibold text-lg mb-4 text-orange-400">How Refunds Work</h3>
            <div className="space-y-3 text-white/70">
              <p>If a token fails to reach its 8.5 ETH target within 7 days:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Anyone can call <code className="px-2 py-0.5 bg-white/10 rounded text-orange-300">checkFailed()</code> to mark the token as failed</li>
                <li>Contributors call <code className="px-2 py-0.5 bg-white/10 rounded text-orange-300">claimRefund()</code> to get their ETH back</li>
                <li>100% of contribution is returned - no fees deducted</li>
              </ol>
            </div>

            <div className="mt-4 p-3 bg-black/30 rounded-lg font-mono text-sm text-white/50">
              Token Created → 7 Days Pass → Target Not Reached → checkFailed() → claimRefund() → ETH Returned
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-violet-400" />
            Roadmap
          </h2>

          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-[#0d0d0d] border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-emerald-400">Phase 1: Foundation (Completed)</h3>
              </div>
              <ul className="grid sm:grid-cols-2 gap-2 text-white/60 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" /> Smart contract on Base</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" /> Core platform UI</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" /> Linear bonding curve</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" /> Buy functionality</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" /> Interactive charts</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" /> Refund system</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-[#0d0d0d] border border-violet-500/30">
              <h3 className="font-semibold text-violet-400 mb-3">Phase 2: Enhanced Trading (Q1 2025)</h3>
              <ul className="grid sm:grid-cols-2 gap-2 text-white/60 text-sm">
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-violet-400" /> Advanced charting indicators</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-violet-400" /> Portfolio tracking</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-violet-400" /> Price alerts</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-violet-400" /> Mobile optimization</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-[#0d0d0d] border border-white/10">
              <h3 className="font-semibold text-white/80 mb-3">Phase 3: Community (Q2 2025)</h3>
              <ul className="grid sm:grid-cols-2 gap-2 text-white/60 text-sm">
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-white/40" /> Token comments & discussions</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-white/40" /> Creator verification</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-white/40" /> Referral rewards</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-white/40" /> Leaderboards</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-[#0d0d0d] border border-white/10">
              <h3 className="font-semibold text-white/80 mb-3">Phase 4: DEX Integration (Q3 2025)</h3>
              <ul className="grid sm:grid-cols-2 gap-2 text-white/60 text-sm">
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-white/40" /> Auto liquidity pool creation</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-white/40" /> DEX trading integration</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-white/40" /> LP token distribution</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-white/40" /> Multi-DEX support</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-[#0d0d0d] border border-white/10">
              <h3 className="font-semibold text-white/80 mb-3">Phase 5: Multi-Chain (Q4 2025)</h3>
              <ul className="grid sm:grid-cols-2 gap-2 text-white/60 text-sm">
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-white/40" /> Ethereum mainnet</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-white/40" /> Arbitrum & Optimism</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-white/40" /> Cross-chain bridging</li>
                <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-white/40" /> Unified portfolio</li>
              </ul>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-400" />
            FAQ
          </h2>

          <div className="space-y-3">
            {[
              { q: "What happens if I buy and the token fails?", a: "You get a full refund. Call claimRefund() after the token is marked as failed." },
              { q: "Can I sell tokens before bonding completes?", a: "No, tokens can only be sold on DEX after successful bonding." },
              { q: "Why is there a max buy limit?", a: "The 0.5 ETH limit prevents whales from dominating token supply." },
              { q: "How do I know if a token will succeed?", a: "Check the progress bar and time remaining. Tokens need 8.5 ETH within 7 days." },
              { q: "Is my investment safe?", a: "Your ETH is protected by the smart contract. Either the token bonds successfully, or you get a full refund." },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#0d0d0d] border border-white/10">
                <p className="font-medium text-white mb-2">{item.q}</p>
                <p className="text-white/60 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl bg-[#0d0d0d] border border-white/10"
        >
          <h2 className="text-xl font-bold mb-4">Smart Contract</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
              <span className="text-white/60">Contract Address</span>
              <a 
                href={`https://basescan.org/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-violet-400 hover:text-violet-300 font-mono text-sm"
              >
                {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
              <span className="text-white/60">Network</span>
              <span className="text-white">Base Mainnet (Chain ID: 8453)</span>
            </div>
          </div>
        </motion.section>

        <div className="text-center pb-8">
          <p className="text-white/40 text-sm">SafeLaunch - Fair launches with investor protection</p>
        </div>
      </main>
    </div>
  );
}
