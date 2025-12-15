import { create } from 'zustand';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AppState {
  selectedTokenId: number | null;
  setSelectedTokenId: (tokenId: number | null) => void;
  buyAmount: string;
  setBuyAmount: (amount: string) => void;
  slippage: number;
  setSlippage: (slippage: number) => void;
  ethPrice: number;
  setEthPrice: (price: number) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  selectedTokenId: null,
  setSelectedTokenId: (tokenId) => set({ selectedTokenId: tokenId }),
  buyAmount: "",
  setBuyAmount: (amount) => set({ buyAmount: amount }),
  slippage: 1.0,
  setSlippage: (slippage) => set({ slippage }),
  ethPrice: 3500,
  setEthPrice: (price) => set({ ethPrice: price }),
  animationsEnabled: true,
  setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),
}));
