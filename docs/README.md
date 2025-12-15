# SafeLaunch - Fair Token Launch Platform

SafeLaunch is a decentralized token launch platform on Base network that ensures fair launches with built-in investor protection through automatic refunds.

---

## Table of Contents
1. [Overview](#overview)
2. [How the Platform Works](#how-the-platform-works)
3. [Key Features](#key-features)
4. [User Guide](#user-guide)
5. [Smart Contract](#smart-contract)
6. [Refund System](#refund-system-details)
7. [Roadmap](#roadmap)
8. [FAQ](#faq)

---

## Overview

SafeLaunch allows anyone to create and launch meme tokens with a fair, transparent bonding curve mechanism. If a token fails to reach its funding goal within the deadline, all investors are automatically entitled to full refunds.

---

## How the Platform Works

### The Problem with Traditional Token Launches

Traditional token launches have several issues:
- **Rug pulls**: Developers can drain liquidity and disappear
- **Whale manipulation**: Large wallets can buy massive amounts and dump on retail
- **Unfair distribution**: Insiders get tokens before public launch
- **No protection**: Investors lose everything if project fails

### The SafeLaunch Solution

SafeLaunch solves these problems with a transparent, automated system:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SAFELAUNCH FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. TOKEN CREATION                                              │
│     └── Creator pays 0.001 ETH fee                              │
│     └── Token deployed with 7-day countdown                     │
│     └── Starting market cap: $5,000                             │
│                                                                 │
│  2. BONDING PHASE (7 Days)                                      │
│     └── Users buy tokens with ETH (max 0.5 ETH each)            │
│     └── Price increases along bonding curve                     │
│     └── Progress tracked: 0% → 100% (8.5 ETH target)            │
│     └── Market cap grows: $5,000 → $30,000                      │
│                                                                 │
│  3a. SUCCESS PATH (Target Reached)                              │
│      └── Token marked as "Bonded"                               │
│      └── Liquidity added to DEX automatically                   │
│      └── Free trading enabled                                   │
│                                                                 │
│  3b. FAILURE PATH (Deadline Expires)                            │
│      └── Token marked as "Failed"                               │
│      └── All contributors claim full refunds                    │
│      └── 100% ETH returned to each wallet                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### The Bonding Curve

SafeLaunch uses a linear bonding curve to determine token prices:

- **Starting Price**: When 0 ETH raised, price is lowest
- **Ending Price**: When 8.5 ETH raised, price is at maximum
- **Fair Distribution**: Early buyers get lower prices, but later buyers benefit from proven demand
- **No Pre-sale**: Everyone buys from the same curve

### Why 0.5 ETH Max Per Wallet?

The 0.5 ETH limit serves multiple purposes:
1. **Anti-whale**: Prevents any single wallet from owning too much
2. **Fair distribution**: Ensures more people can participate
3. **Reduces manipulation**: Harder to pump and dump

### The Refund Guarantee

If a token fails to reach its 8.5 ETH target within 7 days:
- The smart contract automatically allows refunds
- Contributors get back 100% of their ETH
- No fees are deducted from refunds
- Simple one-click claim process

---

## Key Features

### Fair Launch Mechanics
- **Starting Market Cap**: $5,000
- **Target Market Cap**: $30,000
- **Bonding Target**: 8.5 ETH
- **Launch Deadline**: 7 days from creation
- **Max Buy Per Wallet**: 0.5 ETH (prevents whale manipulation)

### Investor Protection
- **Automatic Refund System**: If a token doesn't reach its bonding target within 7 days, all contributors can claim full refunds
- **No Rug Pulls**: Funds are locked in the smart contract until bonding completes
- **Transparent Progress**: Real-time tracking of raised funds and progress percentage

### Token Creation
- **Launch Fee**: 0.001 ETH
- **Initial Buy**: Creators can make an initial purchase during token creation
- **Custom Metadata**: Name, symbol, description, and image

## How It Works

### 1. Launch a Token
1. Connect your wallet (Base network)
2. Fill in token details (name, symbol, description, image)
3. Optionally set an initial buy amount
4. Pay the 0.001 ETH launch fee
5. Your token is live with a 7-day countdown

### 2. Buy Tokens
1. Browse available tokens on the Explore page
2. Select a token to view details and chart
3. Enter buy amount (0.05 - 0.5 ETH)
4. Confirm transaction in your wallet
5. Tokens are credited to your wallet immediately

### 3. Bonding Success
When a token reaches 8.5 ETH:
- Token is marked as "Bonded"
- Liquidity is added to DEX
- Token becomes freely tradable

### 4. Refund Process (If Launch Fails)
If a token doesn't reach its goal within 7 days:
1. Anyone can call `checkFailed()` to mark the token as failed
2. Contributors can claim refunds by calling `claimRefund()`
3. Full ETH contribution is returned to each wallet

## Smart Contract

**Contract Address**: `0xc72C354Bd1608D5e79b822DC4416Cd039BAd8524`

**Network**: Base Mainnet (Chain ID: 8453)

**View on BaseScan**: [SafeLaunchFactory Contract](https://basescan.org/address/0xc72C354Bd1608D5e79b822DC4416Cd039BAd8524)

## User Functions

### createToken
Creates a new token with optional initial purchase.

```solidity
function createToken(string memory metadataURI) external payable
```
- `metadataURI`: IPFS or data URI containing token metadata
- `msg.value`: Launch fee (0.001 ETH) + optional initial buy amount

### buy
Purchase tokens during the bonding phase.

```solidity
function buy(uint256 tokenId) external payable
```
- `tokenId`: ID of the token to purchase
- `msg.value`: ETH amount to spend (max 0.5 ETH per wallet)

### checkFailed
Mark a token as failed after deadline passes without reaching goal.

```solidity
function checkFailed(uint256 tokenId) external
```
- Can only be called after the 7-day deadline
- Only works if bonding target was not reached

### claimRefund
Claim refund for a failed token launch.

```solidity
function claimRefund(uint256 tokenId) external
```
- Returns full ETH contribution to caller
- Only available for failed tokens
- Each wallet can only claim once

## Refund System Details

The refund system ensures complete investor protection:

1. **Contribution Tracking**: Every purchase is recorded with the contributor's address and amount
2. **Deadline Enforcement**: Tokens have exactly 7 days to reach the bonding target
3. **Failure Detection**: After deadline, anyone can trigger the failure check
4. **Full Refunds**: Contributors receive 100% of their ETH back
5. **One-Time Claim**: Each address can only claim their refund once

### Refund Flow

```
Token Created → 7 Days Pass → Target Not Reached → checkFailed() → claimRefund()
     ↓                                                                    ↓
 Contributors                                                     Full ETH Returned
   Buy In                                                         to Each Wallet
```

## Security Features

- **Immutable Bonding Curve**: Price calculation is fixed in the smart contract
- **Deadline Protection**: Cannot be extended or modified after launch
- **Max Buy Limit**: 0.5 ETH per wallet prevents manipulation
- **Transparent Tracking**: All transactions visible on-chain

## Price Calculation

Tokens use a linear bonding curve:
- Starting price increases as more ETH is raised
- Market cap grows from $5,000 to $30,000 as bonding progresses
- Price formula ensures fair distribution for early and late buyers

## Roadmap

### Phase 1: Foundation (Completed)
- [x] Smart contract development and deployment on Base
- [x] Core platform UI with wallet connection
- [x] Token creation with metadata support
- [x] Linear bonding curve implementation
- [x] Buy functionality with 0.5 ETH max limit
- [x] Real-time price and market cap display
- [x] Interactive candlestick charts
- [x] Refund system for failed launches

### Phase 2: Enhanced Trading Experience (Q1 2025)
- [ ] Advanced charting with multiple indicators (RSI, MACD, Bollinger Bands)
- [ ] Trade history and portfolio tracking
- [ ] Price alerts and notifications
- [ ] Mobile-optimized trading interface
- [ ] Social sharing for token launches

### Phase 3: Community Features (Q2 2025)
- [ ] Token comments and discussions
- [ ] Creator verification badges
- [ ] Community voting on featured tokens
- [ ] Referral rewards program
- [ ] Leaderboards for top traders

### Phase 4: DEX Integration (Q3 2025)
- [ ] Automatic liquidity pool creation on bonding
- [ ] Seamless DEX trading integration
- [ ] LP token distribution to contributors
- [ ] Multi-DEX support (Uniswap, Aerodrome)

### Phase 5: Multi-Chain Expansion (Q4 2025)
- [ ] Deploy to Ethereum mainnet
- [ ] Arbitrum and Optimism support
- [ ] Cross-chain token bridging
- [ ] Unified portfolio across chains

### Phase 6: Advanced Features (2026)
- [ ] Token vesting schedules
- [ ] Governance voting for platform updates
- [ ] API access for developers
- [ ] White-label solutions for partners

---

## FAQ

**Q: What happens if I buy and the token fails?**
A: You get a full refund. Call `claimRefund()` after the token is marked as failed.

**Q: Can I sell tokens before bonding completes?**
A: No, tokens can only be sold on DEX after successful bonding.

**Q: Why is there a max buy limit?**
A: The 0.5 ETH limit prevents whales from dominating token supply.

**Q: How do I know if a token will succeed?**
A: Check the progress bar and time remaining. Tokens need 8.5 ETH within 7 days.

**Q: Is my investment safe?**
A: Your ETH is protected by the smart contract. Either the token bonds successfully, or you get a full refund.

## Links

- **App**: [SafeLaunch Platform](https://safelaunch.replit.app)
- **Contract**: [BaseScan](https://basescan.org/address/0xc72C354Bd1608D5e79b822DC4416Cd039BAd8524)
- **Network**: Base Mainnet

---

*SafeLaunch - Fair launches with investor protection*
