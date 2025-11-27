# TokenBalanceX Frontend

A modern React + Next.js frontend for the TokenBalanceX blockchain token balance tracking system.

## 🚀 Features

- **Real-time Web3 Integration**: Connect to MetaMask and other Web3 wallets
- **Dashboard**: Overview of token balances and points statistics
- **Leaderboard**: Top token holders and points earners
- **User Management**: View user profiles and transaction history
- **Contract Interaction**: Mint, burn, and transfer tokens directly from the UI
- **Multi-chain Support**: Switch between different networks (localhost, Sepolia, Base Sepolia)
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Modern UI**: Built with Tailwind CSS and beautiful components

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Ethers.js
- **State Management**: React Context API
- **UI Components**: Custom components with Lucide React icons
- **API**: Axios for backend communication
- **Notifications**: React Hot Toast
- **Charts**: Recharts for data visualization

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask or other Web3 wallet extension
- Access to the TokenBalanceX backend API

## 🚀 Quick Start

1. **Clone the repository** (if not already done)
   ```bash
   git clone <repository-url>
   cd TokenBalanceX/token-blance-front
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # Basic UI components
│   ├── WalletConnect.tsx # Wallet connection component
│   ├── Header.tsx        # Navigation header
│   ├── Sidebar.tsx       # Navigation sidebar
│   └── Layout.tsx        # Main layout component
├── contexts/              # React contexts
│   └── Web3Context.tsx   # Web3 state management
├── pages/                # Page components
│   ├── Dashboard.tsx     # Dashboard page
│   ├── Leaderboard.tsx   # Leaderboard page
│   └── ...               # Other pages
├── hooks/                # Custom React hooks
│   └── useWallet.ts      # Wallet connection hook
├── lib/                  # Library files
│   └── constants.ts      # App constants
├── services/             # API services
│   └── api.ts           # API client and endpoints
├── types/                # TypeScript type definitions
│   └── index.ts         # All type definitions
└── utils/                # Utility functions
    ├── format.ts        # Formatting utilities
    └── web3.ts          # Web3 utilities
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080

# Contract Configuration
NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=localhost

# Network Configuration
NEXT_PUBLIC_DEFAULT_NETWORK=localhost

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Development
NEXT_PUBLIC_DEBUG=true
```

### Network Configuration

The application supports multiple networks configured in `src/lib/constants.ts`:

- **localhost**: Hardhat local development network
- **sepolia**: Ethereum Sepolia testnet
- **baseSepolia**: Base Sepolia testnet

## 🔌 Wallet Integration

### Supported Wallets

- MetaMask
- Trust Wallet
- Any wallet that implements the EIP-1193 standard

### Connection Flow

1. Click "Connect Wallet" in the header
2. Approve the connection in your wallet
3. Select the desired network
4. Start interacting with the application

## 📊 Pages Overview

### Dashboard
- Account overview with balance and points
- System statistics and metrics
- Recent activity summary

### Leaderboard
- Top token holders ranking
- Points distribution
- User comparison

### Users (Coming Soon)
- User search and filtering
- Detailed user profiles
- Transaction history

### Transactions (Coming Soon)
- Transaction history
- Event logs
- Filtering and search

### Contract (Coming Soon)
- Direct contract interaction
- Mint, burn, transfer functions
- Transaction status tracking

## 🎨 UI Components

The application uses a custom component library built with Tailwind CSS:

- **Button**: Multiple variants (primary, secondary, outline, ghost, danger)
- **Card**: Flexible card container with header, body, and footer
- **Input**: Form input with validation and error states
- **Loading**: Animated loading indicators
- **Modal**: Dialog components for confirmations

## 🔐 Security Features

- **Private Key Protection**: No private keys are stored or transmitted
- **Secure API Communication**: HTTPS for production environments
- **Input Validation**: Client-side and server-side validation
- **XSS Protection**: Built-in protections in React and Next.js

## 📱 Responsive Design

The application is fully responsive and works on:

- **Desktop**: 1024px and up
- **Tablet**: 768px to 1023px
- **Mobile**: 320px to 767px

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker

```bash
# Build the image
docker build -t tokenbalance-frontend .

# Run the container
docker run -p 3000:3000 tokenbalance-frontend
```

### Manual Deployment

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 📈 Performance

The application is optimized for:

- **Fast Loading**: Code splitting and lazy loading
- **Small Bundle Size**: Tree shaking and minification
- **SEO Friendly**: Server-side rendering where applicable
- **Core Web Vitals**: Optimized for performance metrics

## 🔧 Development

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React and TypeScript
- **Prettier**: Code formatting for consistency
- **Husky**: Git hooks for code quality

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript type checking

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Wallet Connection Fails**
- Ensure MetaMask is installed and unlocked
- Check if the correct network is selected
- Clear browser cache and try again

**API Calls Fail**
- Verify the backend server is running
- Check the API URL in environment variables
- Ensure CORS is properly configured on the backend

**Build Errors**
- Clear node_modules and reinstall dependencies
- Check for TypeScript errors
- Verify all imports are correct

### Support

For support:

1. Check the [Issues](../../issues) page
2. Review the [Wiki](../../wiki) for documentation
3. Contact the development team

---

**Note**: This frontend is designed to work with the TokenBalanceX backend. Make sure the backend is properly configured and running before using this frontend.