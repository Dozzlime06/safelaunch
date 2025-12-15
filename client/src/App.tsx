import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from './lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

import Terminal from "@/pages/Terminal";
import Launchpad from "@/pages/Launchpad";
import Tokens from "@/pages/Tokens";
import TokenDetailPage from "@/pages/TokenDetailPage";
import Docs from "@/pages/Docs";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Launchpad} />
      <Route path="/tokens" component={Tokens} />
      <Route path="/tokens/:id" component={TokenDetailPage} />
      <Route path="/docs" component={Docs} />
      <Route path="/admin" component={Admin} />
      <Route path="/terminal" component={Terminal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#8b5cf6',
          accentColorForeground: 'white',
          borderRadius: 'medium',
        })}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
