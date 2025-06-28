# 🌐 Dezentra - Cross-Chain E-commerce Platform

> **A revolutionary decentralized e-commerce platform leveraging Chainlink CCIP for seamless cross-chain transactions and interoperability**

[![Chainlink CCIP](https://img.shields.io/badge/Chainlink-CCIP-orange)](https://chainlinkcommunity.com/ccip)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)](https://www.typescriptlang.org/)
[![Wagmi](https://img.shields.io/badge/Wagmi-2.0.0-purple)](https://wagmi.sh/)
[![Vite](https://img.shields.io/badge/Vite-6.1.0-yellow)](https://vitejs.dev/)

## 🎯 Project Overview

Dezenmart is a cutting-edge decentralized e-commerce platform that revolutionizes online commerce by enabling seamless cross-chain transactions using **Chainlink CCIP (Cross-Chain Interoperability Protocol)**. Our platform eliminates the barriers between different blockchain networks, allowing users to buy and sell products across multiple chains with unprecedented ease and security.

### 🌟 Key Features

- **🔗 Cross-Chain Transactions**: Seamless purchases across Avalanche, Base, Sepolia, and Arbitrum networks
- **🛡️ Escrow Protection**: Secure payment escrow with automatic fund release upon delivery confirmation
- **🚚 Logistics Integration**: Multi-provider logistics system with cross-chain delivery tracking
- **⚡ Real-Time Updates**: Live transaction status updates with CCIP message tracking
- **🎨 Modern UI/UX**: Beautiful, responsive interface with smooth animations
- **🔐 Multi-Wallet Support**: RainbowKit integration with WalletConnect support

## 🔗 Chainlink Integration

### Primary Chainlink Service: **CCIP (Cross-Chain Interoperability Protocol)**

Our project extensively uses **Chainlink CCIP** to enable state changes across multiple blockchain networks. This is the core innovation that makes Dezenmart eligible for Chainlink core prizes.

#### CCIP Implementation Details:

**Smart Contract Functions:**
- `buyCrossChainTrade()` - Initiates cross-chain purchase transactions
- `confirmCrossChainPurchase()` - Confirms purchases across chains
- `confirmCrossChainDelivery()` - Handles delivery confirmations
- `cancelCrossChainPurchase()` - Manages cross-chain cancellations
- `raiseCrossChainDispute()` - Resolves disputes across networks
- `ccipReceive()` - Receives and processes CCIP messages

**Frontend Integration:**
- Dynamic chain detection and switching
- Cross-chain fee estimation and payment
- Real-time CCIP message tracking
- Unified payment interfaces for multi-chain transactions

## 📁 Files Using Chainlink

### Smart Contract Integration
- [`src/utils/abi/dezenmartAbi.json`](./src/utils/abi/dezenmartAbi.json) - Complete ABI with CCIP functions
- [`src/utils/config/web3.config.ts`](./src/utils/config/web3.config.ts) - CCIP router addresses and chain selectors
- [`src/utils/types/web3.types.ts`](./src/utils/types/web3.types.ts) - Cross-chain transaction types

### Frontend Components
- [`src/context/Web3Context.tsx`](./src/context/Web3Context.tsx) - CCIP transaction handling and fee estimation
- [`src/components/web3/PaymentModal.tsx`](./src/components/web3/PaymentModal.tsx) - Cross-chain payment processing
- [`src/components/trade/status`](./src/components/trade/status) - CCIP status tracking
- [`src/pages/ViewOrderDetail.tsx`](./src/pages/ViewOrderDetail.tsx) - Cross-chain order management
- [`src/pages/Trade.tsx`](./src/pages/Account.tsx) - Multi-chain trade creation and management

### Configuration Files
- [`src/utils/config/web3.config.ts`](./src/utils/config/web3.config.ts) - CCIP router addresses, chain selectors, and cross-chain pairs
- [`src/utils/config/chains.config.ts`](./src/utils/config/chains.config.ts) - Supported blockchain networks
- [`src/utils/config/contracts.config.ts`](./src/utils/config/contracts.config.ts) - Contract addresses per network

## 🏗️ Architecture & Tech Stack

### Frontend Stack
- **Framework**: React 18.3.1 with TypeScript 5.7.2
- **Build Tool**: Vite 6.1.0
- **Styling**: Tailwind CSS 3.4.17
- **Animations**: Framer Motion 12.15.0
- **State Management**: Redux Toolkit 2.7.0
- **Form Handling**: React Hook Form 7.55.0

### Web3 Integration
- **Wallet Connection**: RainbowKit 2.2.5 + WalletConnect 2.7.0
- **Ethereum Interaction**: Wagmi 2.0.0 + Viem 2.0.0
- **Query Management**: TanStack React Query 5.0.0
- **Multi-Chain Support**: Dynamic chain detection and switching

### Blockchain Networks
- **Avalanche Fuji Testnet** - Primary network for cross-chain operations
- **Base Sepolia** - Layer 2 scaling solution
- **Sepolia Testnet** - Ethereum testnet
- **Arbitrum Sepolia** - High-performance L2 network

### Chainlink CCIP Configuration
```typescript
// CCIP Router Addresses
CCIP_ROUTER_ADDRESSES = {
  [avalancheFuji.id]: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
  [baseSepolia.id]: "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93",
  [sepolia.id]: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
  [arbitrumSepolia.id]: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
}

// Cross-Chain Pairs
CROSS_CHAIN_PAIRS = {
  [avalancheFuji.id]: [baseSepolia.id, sepolia.id, arbitrumSepolia.id],
  [baseSepolia.id]: [avalancheFuji.id, sepolia.id, arbitrumSepolia.id],
  [sepolia.id]: [avalancheFuji.id, baseSepolia.id, arbitrumSepolia.id],
  [arbitrumSepolia.id]: [avalancheFuji.id, baseSepolia.id, sepolia.id],
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask or compatible Web3 wallet
- Testnet tokens for supported networks

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/dezenmart-frontend.git
cd dezenmart-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Setup
Create a `.env` file with the following variables:
```env
VITE_RPC_URL_AVALANCHE_FUJI=your_avalanche_rpc_url
VITE_RPC_URL_BASE_SEPOLIA=your_base_rpc_url
VITE_RPC_URL_SEPOLIA=your_sepolia_rpc_url
VITE_RPC_URL_ARBITRUM_SEPOLIA=your_arbitrum_rpc_url
```

## 🔄 Cross-Chain Transaction Flow

1. **User Selection**: Buyer connects to any of the supported networks
2. **Fee Estimation**: System calculates CCIP fees for cross-chain transfer
3. **Transaction Initiation**: `buyCrossChainTrade()` function called with CCIP parameters
4. **CCIP Processing**: Chainlink CCIP handles the cross-chain message transfer
5. **Destination Execution**: Smart contract on destination chain processes the transaction
6. **Status Updates**: Real-time tracking of CCIP message status
7. **Completion**: Funds released upon delivery confirmation

## 🛡️ Security Features

- **Escrow Protection**: All payments held in escrow until delivery confirmation
- **Multi-Signature**: Cross-chain transactions require multiple confirmations
- **Dispute Resolution**: Automated dispute handling with CCIP message tracking
- **Chain Validation**: Source chain allowlisting for security
- **Message Deduplication**: Prevents replay attacks with message ID tracking

## 📊 Performance Optimizations

- **React.memo**: Component memoization to prevent unnecessary re-renders
- **useCallback/useMemo**: Optimized state management and calculations
- **React Query**: Efficient data fetching with caching and background updates
- **Lazy Loading**: Code splitting for better initial load times
- **Debounced Inputs**: Optimized user interactions

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Theme**: Modern dark interface optimized for Web3 applications
- **Smooth Animations**: Framer Motion for engaging user interactions
- **Real-Time Updates**: Live transaction status with progress indicators
- **Accessibility**: WCAG compliant with proper ARIA labels

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Code Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Modal, Button, etc.)
│   ├── trade/          # Trade-specific components
│   ├── web3/           # Web3 integration components
│   └── layout/         # Layout components
├── context/            # React contexts (Web3, Snackbar)
├── pages/              # Page components
├── utils/              # Utility functions and configurations
│   ├── abi/           # Smart contract ABIs
│   ├── config/        # Configuration files
│   └── types/         # TypeScript type definitions
└── hooks/             # Custom React hooks
```

## 🌐 Live Demo

**Demo URL**: [https://dezentra.netlify.app](https://dezentra.netlify.app)

**Test Networks**:
- Avalanche Fuji: [https://faucet.avax.network](https://faucet.avax.network)
- Base Sepolia: [https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- Sepolia: [https://sepoliafaucet.com](https://sepoliafaucet.com)
- Arbitrum Sepolia: [https://faucet.quicknode.com/arbitrum/sepolia](https://faucet.quicknode.com/arbitrum/sepolia)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Submission

This project was built for the **Chromion: A Chainlink Hackathon** and demonstrates innovative use of Chainlink CCIP for cross-chain e-commerce applications.

### Chainlink Integration Summary
- **Primary Service**: CCIP (Cross-Chain Interoperability Protocol)
- **State Changes**: Cross-chain purchase transactions, delivery confirmations, dispute resolutions
- **Networks**: 4 supported networks with full interoperability
- **Security**: Escrow protection with CCIP message tracking
- **User Experience**: Seamless cross-chain transactions with real-time status updates

---

**Built with ❤️ using Chainlink CCIP for the future of decentralized commerce**
