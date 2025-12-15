import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';
import { http } from 'wagmi';

export const config = getDefaultConfig({
  appName: 'SafeLaunch',
  projectId: 'safelaunch-farcaster-app',
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http('https://base-rpc.publicnode.com'),
    [baseSepolia.id]: http('https://base-sepolia-rpc.publicnode.com'),
  },
  ssr: false,
});
