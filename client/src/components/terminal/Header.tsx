import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Menu, X, Globe, Trophy, HelpCircle, Settings, ChevronDown, Filter, Zap, Terminal } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useStore } from "@/store/store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function Header() {
  const [isConnected, setIsConnected] = useState(false);
  const { minMcap, setMinMcap, animationsEnabled, setAnimationsEnabled } = useStore();

  return (
    <header className="h-12 border-b border-white/10 bg-[#050505] flex items-center px-4 justify-between relative z-50 select-none backdrop-blur-md">
      {/* Left: Brand & Nav */}
      <div className="flex items-center gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-7 h-7 rounded bg-white text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300">
             <Terminal className="w-4 h-4" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-bold text-white tracking-widest text-xs leading-none group-hover:text-emerald-400 transition-colors uppercase font-mono">PUMP.TERM</span>
            <span className="text-[8px] text-muted-foreground font-mono tracking-[0.2em] leading-none mt-0.5">ADVANCED v1.0</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          <NavButton icon={<Globe className="w-3.5 h-3.5" />} label="PAIRS" active />
          <NavButton icon={<Trophy className="w-3.5 h-3.5" />} label="LEADERBOARD" />
        </nav>
      </div>

      {/* Center: Global Stats Ticker (Desktop only) */}
      <div className="hidden lg:flex items-center gap-6 text-[10px] font-mono text-muted-foreground/60 bg-white/[0.03] px-6 py-1.5 rounded-sm border border-white/5">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          SOL: <span className="text-white font-bold">$145.20</span>
        </span>
        <span className="w-[1px] h-3 bg-white/10" />
        <span className="flex items-center gap-2">
          TPS: <span className="text-white font-bold">4,203</span>
        </span>
        <span className="w-[1px] h-3 bg-white/10" />
        <span className="flex items-center gap-2">
          GAS: <span className="text-emerald-400 font-bold">LOW</span>
        </span>
      </div>

      {/* Right: Wallet & Actions */}
      <div className="flex items-center gap-3">
        {/* Settings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/5 relative rounded-none">
              <Settings className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#080808] border-white/10 text-white p-1 rounded-sm shadow-2xl">
            <DropdownMenuItem className="text-xs hover:bg-white/5 cursor-pointer rounded-sm font-mono">
              RPC Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs hover:bg-white/5 cursor-pointer rounded-sm font-mono">
              Priority Fees
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="text-xs hover:bg-white/5 cursor-pointer text-red-400 rounded-sm font-mono">
              Disconnect All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Connect Wallet Button */}
        <Button 
          onClick={() => setIsConnected(!isConnected)}
          className={`
            h-8 px-4 font-mono text-[11px] font-bold transition-all duration-300 border rounded-sm tracking-wide
            ${isConnected 
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20' 
              : 'bg-white text-black hover:bg-white/90 border-transparent hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'}
          `}
        >
          {isConnected ? (
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Eq7...4x9
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5" />
              CONNECT
            </span>
          )}
        </Button>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-muted-foreground">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] bg-[#0A0A0A] border-l border-white/10 p-0">
             <div className="p-6 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-white flex items-center justify-center">
                        <Terminal className="text-black w-6 h-6" />
                    </div>
                    <div>
                        <div className="font-bold text-white font-mono">PUMP.TERM</div>
                        <div className="text-xs text-muted-foreground font-mono">Advanced Terminal</div>
                    </div>
                </div>
                
                <div className="flex flex-col gap-1">
                    <MobileNavLink icon={<Globe />} label="New Pairs" active />
                    <MobileNavLink icon={<Trophy />} label="Leaderboard" />
                    <MobileNavLink icon={<HelpCircle />} label="How it works" />
                </div>

                <div className="mt-auto border-t border-white/5 pt-6">
                    <div className="text-xs font-mono text-muted-foreground/50 text-center">
                        v1.0.4-beta • 14ms
                    </div>
                </div>
             </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function NavButton({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`
      flex items-center gap-2 px-3 py-1.5 rounded-sm text-[10px] font-bold tracking-wider transition-all duration-200 uppercase font-mono
      ${active 
        ? 'text-white border-b-2 border-emerald-500 bg-white/[0.02]' 
        : 'text-muted-foreground hover:text-white hover:bg-white/5 border-b-2 border-transparent'}
    `}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MobileNavLink({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
      <button className={`
        flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-all duration-200 w-full font-mono
        ${active 
          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
          : 'text-muted-foreground hover:text-white hover:bg-white/5'}
      `}>
        <span className="opacity-70">{icon}</span>
        <span>{label}</span>
      </button>
    );
  }
