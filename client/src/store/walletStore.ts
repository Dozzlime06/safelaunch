import { create } from 'zustand';
import { initializeFarcaster, getEthereumProvider, type FarcasterUser } from '@/lib/farcaster';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number;
  isFarcasterConnected: boolean;
  farcasterUser: FarcasterUser | null;
  isInMiniApp: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  connectFarcaster: () => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  setFarcasterUser: (user: FarcasterUser | null) => void;
  disconnectFarcaster: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnected: false,
  address: null,
  balance: 0,
  isFarcasterConnected: false,
  farcasterUser: null,
  isInMiniApp: false,
  isLoading: true,
  
  initialize: async () => {
    try {
      const fcContext = await initializeFarcaster();
      
      if (fcContext.isInMiniApp && fcContext.user) {
        set({
          isFarcasterConnected: true,
          farcasterUser: fcContext.user,
          isInMiniApp: true,
        });
        
        const provider = getEthereumProvider();
        if (provider) {
          try {
            const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
            if (accounts && accounts.length > 0) {
              const address = accounts[0];
              const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
              
              const balanceHex = await provider.request({
                method: 'eth_getBalance',
                params: [address, 'latest']
              }) as string;
              const balanceWei = parseInt(balanceHex, 16);
              const balanceEth = balanceWei / 1e18;
              
              set({
                isConnected: true,
                address: shortAddress,
                balance: parseFloat(balanceEth.toFixed(4)),
              });
            }
          } catch (e) {
            console.log('Wallet not connected yet');
          }
        }
      }
    } catch (error) {
      console.log('Not in mini app context');
    } finally {
      set({ isLoading: false });
    }
  },
  
  connectFarcaster: async () => {
    const { initialize, isInMiniApp } = get();
    
    if (isInMiniApp) {
      await initialize();
    } else {
      const mockUser: FarcasterUser = {
        fid: Math.floor(Math.random() * 100000),
        username: 'degen.eth',
        displayName: 'Degen User',
        pfpUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=degen'
      };
      set({
        isFarcasterConnected: true,
        farcasterUser: mockUser,
      });
    }
  },
  
  connectWallet: async () => {
    const provider = getEthereumProvider();
    
    if (provider) {
      try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
        if (accounts && accounts.length > 0) {
          const address = accounts[0];
          const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
          
          const balanceHex = await provider.request({
            method: 'eth_getBalance',
            params: [address, 'latest']
          }) as string;
          const balanceWei = parseInt(balanceHex, 16);
          const balanceEth = balanceWei / 1e18;
          
          set({
            isConnected: true,
            address: shortAddress,
            balance: parseFloat(balanceEth.toFixed(4)),
          });
        }
      } catch (e) {
        console.error('Failed to connect wallet:', e);
        const mockAddress = `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`;
        const mockBalance = Math.random() * 5 + 0.5;
        set({ 
          isConnected: true, 
          address: mockAddress,
          balance: parseFloat(mockBalance.toFixed(4))
        });
      }
    } else {
      const mockAddress = `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`;
      const mockBalance = Math.random() * 5 + 0.5;
      set({ 
        isConnected: true, 
        address: mockAddress,
        balance: parseFloat(mockBalance.toFixed(4))
      });
    }
  },
  
  disconnectWallet: () => {
    set({ 
      isConnected: false, 
      address: null,
      balance: 0
    });
  },
  
  setFarcasterUser: (user) => {
    set({
      isFarcasterConnected: !!user,
      farcasterUser: user,
    });
  },
  
  disconnectFarcaster: () => {
    set({ 
      isFarcasterConnected: false, 
      farcasterUser: null
    });
  },
}));
