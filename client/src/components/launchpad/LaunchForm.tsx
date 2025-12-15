import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Upload, Clock, Rocket, AlertCircle, Check, Globe, Twitter, Send, MessageCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { parseEther } from "viem";
import { SAFELAUNCH_FACTORY_ADDRESS, safeLaunchAbi } from "@/lib/safeLaunchContract";

interface LaunchFormProps {
  onClose: () => void;
}

export function LaunchForm({ onClose }: LaunchFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    image: "",
    website: "",
    twitter: "",
    telegram: "",
    discord: "",
    farcaster: "",
    timeLimit: 48,
    initialBuy: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [launchError, setLaunchError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      console.error('Contract error details:', error);
      const errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('User rejected')) {
        setLaunchError('Transaction was cancelled');
      } else if (errorMessage.includes('insufficient funds')) {
        setLaunchError('Insufficient ETH balance');
      } else if (errorMessage.includes('chain')) {
        setLaunchError('Please switch to Base network');
      } else {
        setLaunchError(errorMessage.slice(0, 200));
      }
    }
  }, [error]);

  const handleLaunch = async () => {
    setLaunchError(null);
    
    if (!isConnected) {
      setLaunchError("Please connect your wallet first");
      return;
    }

    if (chainId !== 8453) {
      setLaunchError("Please switch to Base network (Chain ID: 8453)");
      return;
    }

    if (!formData.name.trim() || !formData.symbol.trim()) {
      setLaunchError("Name and symbol are required");
      return;
    }

    const metadata: Record<string, string> = {
      name: formData.name.trim(),
      symbol: formData.symbol.trim(),
      description: formData.description.trim() || "",
    };
    
    if (formData.image && formData.image.length < 50000) {
      metadata.image = formData.image;
    }
    if (formData.website) metadata.website = formData.website;
    if (formData.twitter) metadata.twitter = formData.twitter;
    if (formData.telegram) metadata.telegram = formData.telegram;
    if (formData.discord) metadata.discord = formData.discord;
    if (formData.farcaster) metadata.farcaster = formData.farcaster;

    const jsonString = JSON.stringify(metadata);
    const utf8Bytes = new TextEncoder().encode(jsonString);
    const base64 = btoa(String.fromCharCode(...utf8Bytes));
    const metadataURI = `data:application/json;base64,${base64}`;

    console.log('Launching token with params:', {
      name: formData.name.trim(),
      symbol: formData.symbol.trim(),
      metadataURI: metadataURI.substring(0, 100) + '...',
      durationHours: formData.timeLimit,
      contractAddress: SAFELAUNCH_FACTORY_ADDRESS,
      chainId: chainId,
    });

    const launchFee = 0.001;
    const initialBuyAmount = formData.initialBuy ? parseFloat(formData.initialBuy) : 0;
    const totalValue = launchFee + initialBuyAmount;

    try {
      writeContract({
        address: SAFELAUNCH_FACTORY_ADDRESS,
        abi: safeLaunchAbi,
        functionName: 'createToken',
        args: [formData.name.trim(), formData.symbol.trim(), metadataURI, BigInt(formData.timeLimit)],
        value: parseEther(totalValue.toString()),
      });
    } catch (err: any) {
      console.error('Contract call error:', err);
      setLaunchError(err.message || 'Failed to call contract');
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full max-w-md bg-[#0f0f0f] rounded-3xl border border-white/10 p-8 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Token Launched!</h2>
          <p className="text-white/60 text-sm mb-4">
            Your token has been successfully created on Base.
          </p>
          <p className="text-xs text-white/40 font-mono break-all mb-6">
            Tx: {hash}
          </p>
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white"
          >
            Close
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormData({ ...formData, image: base64 });
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setFormData({ ...formData, image: base64 });
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setFormData({ ...formData, image: "" });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const timeLimitOptions = [
    { value: 12, label: "12 Hours", desc: "Quick launch" },
    { value: 24, label: "24 Hours", desc: "1 day" },
    { value: 48, label: "48 Hours", desc: "Recommended" },
    { value: 72, label: "72 Hours", desc: "Maximum" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0f0f0f] rounded-3xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 pointer-events-none" />
        
        <div className="relative p-6 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Launch Token</h2>
              <p className="text-sm text-white/40">Step {step} of 3</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              data-testid="button-close-form"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
          
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-violet-500' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Token Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., SafeMoon AI"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  data-testid="input-token-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Token Symbol *
                </label>
                <Input
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g., SMAI"
                  maxLength={10}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 uppercase"
                  data-testid="input-token-symbol"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell people about your token..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  data-testid="input-description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Token Image *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                  data-testid="input-image-file"
                />
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Token preview"
                      className="w-full h-40 object-contain rounded-xl bg-white/5 border border-white/10"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors"
                      data-testid="button-clear-image"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-violet-500/30 transition-colors cursor-pointer"
                    data-testid="button-upload-image"
                  >
                    <Upload className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-sm text-white/40">Click to upload or drag and drop</p>
                    <p className="text-xs text-white/20 mt-1">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <p className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                  <span>Social Links</span>
                  <span className="text-xs text-white/30">(optional)</span>
                </p>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="Website URL"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-10"
                      data-testid="input-website"
                    />
                  </div>

                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="Twitter/X handle (e.g., @token)"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-10"
                      data-testid="input-twitter"
                    />
                  </div>

                  <div className="relative">
                    <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      value={formData.telegram}
                      onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                      placeholder="Telegram (e.g., t.me/token)"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-10"
                      data-testid="input-telegram"
                    />
                  </div>

                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      value={formData.discord}
                      onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                      placeholder="Discord (e.g., discord.gg/token)"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-10"
                      data-testid="input-discord"
                    />
                  </div>

                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 1000 1000" fill="currentColor">
                      <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z"/>
                      <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.444H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z"/>
                      <path d="M693.333 746.667C681.06 746.667 671.111 756.616 671.111 768.889V795.556H666.667C654.394 795.556 644.444 805.505 644.444 817.778V844.444H893.333V817.778C893.333 805.505 883.384 795.556 871.111 795.556H866.667V768.889C866.667 756.616 856.717 746.667 844.444 746.667V351.111H868.889L897.778 253.333H720V746.667H693.333Z"/>
                    </svg>
                    <Input
                      value={formData.farcaster}
                      onChange={(e) => setFormData({ ...formData, farcaster: e.target.value })}
                      placeholder="Farcaster (e.g., @degen)"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-10"
                      data-testid="input-farcaster"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <Clock className="w-5 h-5 text-violet-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-violet-400">Bonding Time Limit</p>
                  <p className="text-xs text-violet-400/60">
                    If token doesn't reach 8.5 ETH within this time, all buyers get refunded automatically
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {timeLimitOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, timeLimit: option.value })}
                    data-testid={`button-time-${option.value}`}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      formData.timeLimit === option.value
                        ? 'bg-violet-500/20 border-violet-500/50'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.timeLimit === option.value
                          ? 'border-violet-500 bg-violet-500'
                          : 'border-white/30'
                      }`}>
                        {formData.timeLimit === option.value && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <span className="font-medium text-white">{option.label}</span>
                    </div>
                    <span className="text-sm text-white/40">{option.desc}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <Rocket className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-400">Initial Buy (Optional)</p>
                    <p className="text-xs text-emerald-400/60">
                      Buy tokens at launch. Max 0.5 ETH per wallet.
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="0.5"
                    value={formData.initialBuy}
                    onChange={(e) => setFormData({ ...formData, initialBuy: e.target.value })}
                    placeholder="0.00"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-12"
                    data-testid="input-initial-buy"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">ETH</span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="font-semibold text-white mb-4">Review Your Token</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/40">Name</span>
                    <span className="text-white font-medium">{formData.name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Symbol</span>
                    <span className="text-white font-medium">${formData.symbol || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Time Limit</span>
                    <span className="text-white font-medium">{formData.timeLimit} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Bonding Target</span>
                    <span className="text-white font-medium">8.5 ETH (~$30K MC)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Total Supply</span>
                    <span className="text-white font-medium">1,000,000,000</span>
                  </div>
                </div>
              </div>

              {(formData.website || formData.twitter || formData.telegram || formData.discord || formData.farcaster) && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-semibold text-white mb-3 text-sm">Social Links</h3>
                  <div className="space-y-2 text-sm">
                    {formData.website && (
                      <div className="flex items-center gap-2 text-white/60">
                        <Globe className="w-3.5 h-3.5" />
                        <span className="truncate">{formData.website}</span>
                      </div>
                    )}
                    {formData.twitter && (
                      <div className="flex items-center gap-2 text-white/60">
                        <Twitter className="w-3.5 h-3.5" />
                        <span>{formData.twitter}</span>
                      </div>
                    )}
                    {formData.telegram && (
                      <div className="flex items-center gap-2 text-white/60">
                        <Send className="w-3.5 h-3.5" />
                        <span>{formData.telegram}</span>
                      </div>
                    )}
                    {formData.discord && (
                      <div className="flex items-center gap-2 text-white/60">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{formData.discord}</span>
                      </div>
                    )}
                    {formData.farcaster && (
                      <div className="flex items-center gap-2 text-white/60">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 1000 1000" fill="currentColor">
                          <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z"/>
                          <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.444H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z"/>
                          <path d="M693.333 746.667C681.06 746.667 671.111 756.616 671.111 768.889V795.556H666.667C654.394 795.556 644.444 805.505 644.444 817.778V844.444H893.333V817.778C893.333 805.505 883.384 795.556 871.111 795.556H866.667V768.889C866.667 756.616 856.717 746.667 844.444 746.667V351.111H868.889L897.778 253.333H720V746.667H693.333Z"/>
                        </svg>
                        <span>{formData.farcaster}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-400">Important Rules</p>
                    <ul className="text-xs text-orange-400/60 mt-1 space-y-1 list-disc pl-3">
                      <li>No selling during bonding phase</li>
                      <li>Dev initial buy is optional</li>
                      <li>Failed bonding = automatic refund for all</li>
                      <li>Success = liquidity locked forever on Uniswap</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <div className="flex justify-between mb-2">
                  <span className="text-white/60">Launch Fee</span>
                  <span className="text-emerald-400 font-medium">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Trade Fee</span>
                  <span className="text-violet-400 font-medium">1% per buy</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="relative p-6 border-t border-white/5 flex gap-3 flex-shrink-0">
          {step > 1 && (
            <Button
              onClick={() => setStep(step - 1)}
              variant="outline"
              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
              data-testid="button-back"
            >
              Back
            </Button>
          )}
          
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && (!formData.name || !formData.symbol || !formData.description)}
              className="flex-1 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white"
              data-testid="button-next"
            >
              Continue
            </Button>
          ) : (
            <div className="flex-1 flex flex-col gap-2">
              {chainId !== 8453 && (
                <p className="text-amber-400 text-xs text-center flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Please switch to Base network
                </p>
              )}
              {(error || launchError) && (
                <p className="text-red-400 text-xs text-center break-words">
                  {launchError || (error?.message?.includes('User rejected') || error?.message?.includes('rejected') 
                    ? 'Transaction cancelled by user' 
                    : error?.message?.includes('insufficient') 
                    ? 'Insufficient ETH for gas fees'
                    : 'Error: ' + (error?.shortMessage || error?.message || 'Transaction failed'))}
                </p>
              )}
              <Button
                onClick={handleLaunch}
                disabled={isPending || isConfirming || !isConnected || chainId !== 8453}
                className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 text-white disabled:opacity-50"
                data-testid="button-launch"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirm in Wallet...
                  </>
                ) : isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Launching...
                  </>
                ) : !isConnected ? (
                  <>Connect Wallet to Launch</>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Launch Token (FREE)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
