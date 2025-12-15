# PUMP.TERM - Advanced Trading Terminal

## Deployed Contract (Base Mainnet)

**SafeLaunchFactory (NEW):** `0xc72C354Bd1608D5e79b822DC4416Cd039BAd8524`
- Chain: Base (8453)
- Owner: `0x0315eCb53F64b7A4bA56bb8A4DAB0D96F0856b60`
- Fee Wallet: `0xa2eB6bE3bDe7e99a8E68E6252E006cEd620ff02f`
- BaseScan: https://basescan.org/address/0xc72C354Bd1608D5e79b822DC4416Cd039BAd8524
- Features: Initial buy on launch, linear bonding curve ($5K-$30K MC), auto-refund on failure, **ownerWithdraw()**, **ownerWithdrawAll()**

**OLD Contract:** `0x547b22734D72bdEe458F8382ee93cC7a187Bc0fc`
- Token 1 has 0.006 ETH - claim refund after Dec 17, 2025 deadline
- Script: `scripts/claimRefundOldContract.cjs`

## Overview

PUMP.TERM is a modern, animated trading terminal web application designed for Pump.fun and BONK token ecosystems on Solana. The application provides a professional-grade trading interface with real-time token feeds, interactive charts, trade execution panels, and ecosystem analytics. Built with a dark, terminal-style aesthetic featuring glass/blur effects and smooth micro-interactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using functional components and hooks
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Zustand for global state (selected token, trading state, UI settings)
- **Data Fetching**: TanStack React Query for server state management
- **Animations**: Framer Motion for physics-based animations and micro-interactions
- **Charts**: TradingView Lightweight Charts library for candlestick/volume visualization

### UI Component System
- **Component Library**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom theme configuration
- **Typography**: Custom font stack (Rajdhani, Inter, JetBrains Mono)
- **Layout**: Resizable panel system using react-resizable-panels
- **Responsive Design**: Mobile-first with desktop-optimized terminal layout

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **Build System**: Vite for frontend, esbuild for server bundling
- **Development**: Hot module replacement with Vite dev server proxy

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for shared type definitions
- **Migrations**: Drizzle Kit for database migrations (`drizzle-kit push`)
- **Session Storage**: In-memory storage for development, with connect-pg-simple available for production

### Project Structure
```
├── client/src/          # React frontend application
│   ├── components/      # UI components (terminal/, ui/)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and query client
│   ├── pages/           # Route page components
│   └── store/           # Zustand state store
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Data access layer
│   └── vite.ts          # Vite dev server integration
├── shared/              # Shared types and schemas
└── migrations/          # Database migrations
```

### Key Design Decisions

1. **Monorepo Structure**: Client and server in single repository with shared types for type safety across the stack

2. **Terminal-Style UI**: Dark-only theme with muted colors, glass effects, and professional trading aesthetic

3. **Resizable Panels**: Desktop layout uses resizable panels for customizable workspace; mobile uses tab-based navigation

4. **Real-time Data Simulation**: Mock data generators for token feeds during development, designed for easy API integration

5. **Path Aliases**: TypeScript path aliases (`@/`, `@shared/`) for clean imports

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and migrations

### UI Libraries
- **Radix UI**: Comprehensive set of accessible primitives (dialog, dropdown, tabs, etc.)
- **Framer Motion**: Animation library for transitions and micro-interactions
- **Lightweight Charts**: TradingView's charting library for financial data visualization
- **embla-carousel-react**: Carousel component for UI elements

### Development Tools
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **Replit Plugins**: Dev banner, cartographer, and runtime error overlay for Replit environment

### Styling
- **Tailwind CSS v4**: Utility-first CSS with custom theme
- **tw-animate-css**: Animation utilities
- **class-variance-authority**: Component variant management