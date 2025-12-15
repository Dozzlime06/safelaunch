import { useEffect, useState } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initializeFarcaster, getEthereumProvider, type FarcasterUser } from "@/lib/farcaster";

export function WalletButton() {
  const [isLoading, setIsLoading] = useState(true);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const fcContext = await initializeFarcaster();
        
        if (fcContext.isInMiniApp && fcContext.user) {
          setIsInMiniApp(true);
          setFarcasterUser(fcContext.user);
          
          const providerPromise = getEthereumProvider();
          if (providerPromise) {
            try {
              const provider = await providerPromise;
              const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
              if (accounts && accounts.length > 0) {
                const address = accounts[0];
                setWalletAddress(`${address.slice(0, 6)}...${address.slice(-4)}`);
                
                const balanceHex = await provider.request({
                  method: 'eth_getBalance',
                  params: [address, 'latest']
                }) as string;
                const balanceWei = parseInt(balanceHex, 16);
                const balanceEth = balanceWei / 1e18;
                setWalletBalance(balanceEth.toFixed(4));
              }
            } catch (e) {
              console.log('Wallet not connected yet in mini app');
            }
          }
        }
      } catch (error) {
        console.log('Not in mini app context');
      } finally {
        setIsLoading(false);
      }
    }
    
    init();
  }, []);

  const connectMiniAppWallet = async () => {
    const providerPromise = getEthereumProvider();
    if (providerPromise) {
      try {
        const provider = await providerPromise;
        const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
        if (accounts && accounts.length > 0) {
          const address = accounts[0];
          setWalletAddress(`${address.slice(0, 6)}...${address.slice(-4)}`);
          
          const balanceHex = await provider.request({
            method: 'eth_getBalance',
            params: [address, 'latest']
          }) as string;
          const balanceWei = parseInt(balanceHex, 16);
          const balanceEth = balanceWei / 1e18;
          setWalletBalance(balanceEth.toFixed(4));
        }
      } catch (e) {
        console.error('Failed to connect mini app wallet:', e);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
      </div>
    );
  }

  if (isInMiniApp) {
    if (walletAddress && farcasterUser) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10">
          {farcasterUser.pfpUrl && (
            <img 
              src={farcasterUser.pfpUrl} 
              alt={farcasterUser.displayName || ''}
              className="w-6 h-6 rounded-full"
            />
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{walletBalance} ETH</span>
            <span className="text-xs text-white/40 hidden sm:inline">{walletAddress}</span>
          </div>
        </div>
      );
    }
    
    if (farcasterUser) {
      return (
        <Button
          onClick={connectMiniAppWallet}
          className="bg-[#8A63D2] hover:bg-[#7c58c4] text-white font-medium px-4 py-2 rounded-full text-sm"
          data-testid="button-connect-wallet-miniapp"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      );
    }
    
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10">
        <span className="text-sm text-white/60">Farcaster</span>
      </div>
    );
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    className="bg-[#8A63D2] hover:bg-[#7c58c4] text-white font-medium px-4 py-2 rounded-full text-sm"
                    data-testid="button-connect-wallet"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Connect</span>
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    className="bg-red-500 hover:bg-red-400 text-white font-medium px-4 py-2 rounded-full text-sm"
                    data-testid="button-wrong-network"
                  >
                    Wrong Network
                  </Button>
                );
              }

              return (
                <button
                  onClick={openAccountModal}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:border-violet-500/30 transition-colors"
                  data-testid="button-wallet-menu"
                >
                  {account.ensAvatar && (
                    <img 
                      src={account.ensAvatar} 
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {account.displayBalance ?? ''}
                    </span>
                    <span className="text-xs text-white/40 hidden sm:inline">
                      {account.displayName}
                    </span>
                  </div>
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
