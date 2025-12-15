import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenFeed } from "@/components/terminal/TokenFeed";
import { TradingChart } from "@/components/terminal/TradingChart";
import { TradePanel } from "@/components/terminal/TradePanel";
import { TradeHistory } from "@/components/terminal/TradeHistory";
import { Header } from "@/components/terminal/Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStore } from "@/store/store";
import { Activity, BarChart2, ArrowRightLeft } from "lucide-react";

export default function Terminal() {
  const isMobile = useIsMobile();
  const { selectedTokenId, ethPrice } = useStore();

  return (
    <div className="h-screen w-screen bg-[#020202] text-foreground overflow-hidden flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-500">
      {/* Header */}
      <Header />

      {isMobile ? (
        // Mobile Layout: Tabs with fixed bottom nav
        <Tabs defaultValue="chart" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden relative bg-[#050505]" style={{ paddingBottom: '56px' }}>
            <TabsContent value="feed" className="absolute inset-0 m-0 data-[state=active]:flex flex-col overflow-auto" style={{ bottom: '56px' }}>
              <TokenFeed />
            </TabsContent>
            
            <TabsContent value="chart" className="absolute inset-0 flex flex-col m-0 min-h-0 overflow-hidden" style={{ bottom: '56px' }}>
              <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
                <ResizablePanel defaultSize={70} minSize={40} className="flex flex-col min-h-0">
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <TradingChart tokenId={selectedTokenId ?? -1} ethPrice={ethPrice} />
                  </div>
                </ResizablePanel>
                <ResizableHandle className="h-3 bg-white/10 hover:bg-emerald-500/50 active:bg-emerald-500 transition-colors flex items-center justify-center shrink-0">
                  <div className="w-12 h-1.5 rounded-full bg-white/40" />
                </ResizableHandle>
                <ResizablePanel defaultSize={30} minSize={15} className="flex flex-col min-h-0">
                  <div className="flex-1 min-h-0 overflow-auto">
                    <TradeHistory />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </TabsContent>
            
            <TabsContent value="trade" className="absolute inset-0 m-0 data-[state=active]:flex flex-col overflow-auto" style={{ bottom: '56px' }}>
              <TradePanel />
            </TabsContent>
          </div>

          <TabsList className="fixed bottom-0 left-0 right-0 h-14 bg-[#080808] border-t border-white/10 rounded-none w-full grid grid-cols-3 p-0 z-[100] backdrop-blur-md">
            <TabsTrigger 
              value="feed" 
              className="rounded-none border-t-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-white/[0.02] h-full flex flex-col gap-1 items-center justify-center text-[10px] font-bold font-mono tracking-widest text-muted-foreground data-[state=active]:text-white transition-all"
            >
              <Activity className="w-4 h-4 mb-0.5" />
              FEED
            </TabsTrigger>
            <TabsTrigger 
              value="chart" 
              className="rounded-none border-t-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-white/[0.02] h-full flex flex-col gap-1 items-center justify-center text-[10px] font-bold font-mono tracking-widest text-muted-foreground data-[state=active]:text-white transition-all"
            >
              <BarChart2 className="w-4 h-4 mb-0.5" />
              CHART
            </TabsTrigger>
            <TabsTrigger 
              value="trade" 
              className="rounded-none border-t-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-white/[0.02] h-full flex flex-col gap-1 items-center justify-center text-[10px] font-bold font-mono tracking-widest text-muted-foreground data-[state=active]:text-white transition-all"
            >
              <ArrowRightLeft className="w-4 h-4 mb-0.5" />
              TRADE
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ) : (
        // Desktop Layout: Resizable Panels
        <ResizablePanelGroup direction="horizontal" className="flex-1 bg-[#050505]">
          
          {/* Left Panel: Token Feed */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="border-r border-white/10 bg-[#050505]">
            <TokenFeed />
          </ResizablePanel>
          
          <ResizableHandle className="bg-white/5 w-[1px] transition-colors hover:bg-emerald-500" />

          {/* Center Panel: Chart + Bottom Stats */}
          <ResizablePanel defaultSize={55} className="bg-[#050505]">
            <ResizablePanelGroup direction="vertical">
              {/* Chart Area */}
              <ResizablePanel defaultSize={80} minSize={50} className="border-b border-white/10 relative">
                <TradingChart tokenId={selectedTokenId ?? -1} ethPrice={ethPrice} />
              </ResizablePanel>
              
              <ResizableHandle className="bg-white/5 h-[1px] transition-colors hover:bg-emerald-500" />
              
              {/* Trade History & Holders */}
              <ResizablePanel defaultSize={20} minSize={10} className="bg-[#080808]/50">
                <TradeHistory />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle className="bg-white/5 w-[1px] transition-colors hover:bg-emerald-500" />

          {/* Right Panel: Trading Interface */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="border-l border-white/10 bg-[#080808]/30">
            <TradePanel />
          </ResizablePanel>

        </ResizablePanelGroup>
      )}
    </div>
  );
}
