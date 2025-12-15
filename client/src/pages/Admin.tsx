import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Wallet,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/launchpad/WalletButton";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useBalance } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import safeLaunchLogo from "@assets/generated_images/safelaunch_shield_rocket_logo.png";

const NEW_CONTRACT = "0xc72C354Bd1608D5e79b822DC4416Cd039BAd8524" as const;
const OLD_CONTRACT = "0x547b22734D72bdEe458F8382ee93cC7a187Bc0fc" as const;
const OWNER_ADDRESS = "0x0315eCb53F64b7A4bA56bb8A4DAB0D96F0856b60";

const newContractAbi = [
  {
    name: 'ownerWithdrawAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
] as const;

const oldContractAbi = [
  {
    name: 'claimRefund',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'tokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'creator', type: 'address' },
      { name: 'metadataURI', type: 'string' },
      { name: 'totalRaised', type: 'uint256' },
      { name: 'totalRefunded', type: 'uint256' },
      { name: 'tokensSold', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'failedTimestamp', type: 'uint256' },
      { name: 'bonded', type: 'bool' },
      { name: 'failed', type: 'bool' },
    ],
  },
  {
    name: 'getContribution',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'id', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'checkFailed',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },
] as const;

export default function Admin() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const [error, setError] = useState<string | null>(null);

  const { data: newContractBalance } = useBalance({
    address: NEW_CONTRACT,
  });

  const { data: oldContractBalance } = useBalance({
    address: OLD_CONTRACT,
  });

  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();
  const isBaseNetwork = chainId === 8453;

  const { writeContract: writeWithdrawAll, data: withdrawHash, isPending: isWithdrawing } = useWriteContract();
  const { isLoading: isConfirmingWithdraw, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });

  const { writeContract: writeCheckFailed, data: checkFailedHash, isPending: isCheckingFailed } = useWriteContract();
  const { isLoading: isConfirmingCheckFailed, isSuccess: checkFailedSuccess } = useWaitForTransactionReceipt({ hash: checkFailedHash });

  const { writeContract: writeClaimRefund, data: claimRefundHash, isPending: isClaimingRefund } = useWriteContract();
  const { isLoading: isConfirmingRefund, isSuccess: refundSuccess } = useWaitForTransactionReceipt({ hash: claimRefundHash });

  const handleWithdrawAll = () => {
    setError(null);
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    if (!isBaseNetwork) {
      setError("Switch to Base network");
      return;
    }

    writeWithdrawAll({
      address: NEW_CONTRACT,
      abi: newContractAbi,
      functionName: 'ownerWithdrawAll',
    });
  };

  const handleCheckFailedOld = () => {
    setError(null);
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    if (!isBaseNetwork) {
      setError("Switch to Base network");
      return;
    }

    writeCheckFailed({
      address: OLD_CONTRACT,
      abi: oldContractAbi,
      functionName: 'checkFailed',
      args: [BigInt(1)],
    });
  };

  const handleClaimRefundOld = () => {
    setError(null);
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    if (!isBaseNetwork) {
      setError("Switch to Base network");
      return;
    }

    writeClaimRefund({
      address: OLD_CONTRACT,
      abi: oldContractAbi,
      functionName: 'claimRefund',
      args: [BigInt(1)],
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5 pointer-events-none" />
      
      <header className="fixed top-0 left-0 right-0 border-b border-red-500/20 backdrop-blur-xl bg-black/80 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={safeLaunchLogo} alt="SafeLaunch" className="w-6 h-6" />
              <span className="text-sm font-medium text-white">Admin Panel</span>
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Private</span>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="h-16" />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-red-400" />
            <h1 className="text-2xl font-bold">Owner Admin Panel</h1>
          </div>
          <p className="text-white/60">
            Restricted access - owner functions only
          </p>
        </motion.div>

        {!isConnected && (
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
            <p className="text-yellow-400">Connect wallet to access admin functions</p>
          </div>
        )}

        {isConnected && !isBaseNetwork && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
            <p className="text-red-400">Please switch to Base network</p>
          </div>
        )}

        {isConnected && !isOwner && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">Access Denied</p>
              <p className="text-white/50 text-sm">Connected wallet is not the owner</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-[#0d0d0d] border border-emerald-500/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-emerald-400">New Contract - Withdraw All</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-black/30 rounded-lg">
              <p className="text-white/50 text-sm mb-1">Contract Address</p>
              <a 
                href={`https://basescan.org/address/${NEW_CONTRACT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-mono text-sm"
              >
                {NEW_CONTRACT}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="p-4 bg-black/30 rounded-lg">
              <p className="text-white/50 text-sm mb-1">Contract Balance</p>
              <p className="text-2xl font-bold text-white font-mono">
                {newContractBalance ? formatEther(newContractBalance.value) : '0'} ETH
              </p>
            </div>

            <Button
              onClick={handleWithdrawAll}
              disabled={isWithdrawing || isConfirmingWithdraw || !isBaseNetwork || !isConnected}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-3"
            >
              {isWithdrawing || isConfirmingWithdraw ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isWithdrawing ? 'Confirm in wallet...' : 'Withdrawing...'}
                </>
              ) : withdrawSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Withdrawn Successfully!
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5 mr-2" />
                  Withdraw All ETH
                </>
              )}
            </Button>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-[#0d0d0d] border border-orange-500/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="w-6 h-6 text-orange-400" />
            <h2 className="text-xl font-bold text-orange-400">Old Contract - Claim Refund</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-black/30 rounded-lg">
              <p className="text-white/50 text-sm mb-1">Old Contract Address</p>
              <a 
                href={`https://basescan.org/address/${OLD_CONTRACT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-orange-400 hover:text-orange-300 font-mono text-sm"
              >
                {OLD_CONTRACT}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="p-4 bg-black/30 rounded-lg">
              <p className="text-white/50 text-sm mb-1">Contract Balance</p>
              <p className="text-2xl font-bold text-white font-mono">
                {oldContractBalance ? formatEther(oldContractBalance.value) : '0'} ETH
              </p>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm">
                Token 1 has stuck funds. Deadline: Dec 17, 2025. 
                First call "Check Failed" then "Claim Refund".
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCheckFailedOld}
                disabled={isCheckingFailed || isConfirmingCheckFailed || !isBaseNetwork || !isConnected}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
              >
                {isCheckingFailed || isConfirmingCheckFailed ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : checkFailedSuccess ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-2" />
                )}
                Check Failed
              </Button>

              <Button
                onClick={handleClaimRefundOld}
                disabled={isClaimingRefund || isConfirmingRefund || !isBaseNetwork || !isConnected}
                className="bg-orange-500 hover:bg-orange-400 text-white"
              >
                {isClaimingRefund || isConfirmingRefund ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : refundSuccess ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Claim Refund
              </Button>
            </div>
          </div>
        </motion.section>

        <div className="text-center pb-8">
          <p className="text-white/30 text-xs">This page is not linked from anywhere. Access by direct URL only.</p>
        </div>
      </main>
    </div>
  );
}
