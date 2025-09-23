# PredictProp

## Supabase Setup

**⚠️ The app works without Supabase!** If you haven't set up Supabase yet, the app will use mock data and won't crash. Follow this guide when you're ready to enable real data persistence.

### Quick Start (Without Supabase)
- The app runs with mock data by default
- No Supabase setup required to test features
- All functionality works with virtual trades and data
- See [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for detailed instructions

### Full Setup (With Supabase)

#### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be set up (usually takes 2-3 minutes)

### 2. Get Environment Variables
1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: The `anon` `public` key (starts with `eyJ...`)

### 3. Configure Environment
Add these to your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Database Migrations
```bash
# Install Supabase CLI if you haven't already
npm install supabase --save-dev

# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref your-project-id

# Push the schema to your database
npx supabase db push
```

### 5. Test the Integration
```bash
npm run dev
```
- Open the app and try logging in with Privy
- Check browser console for successful Supabase user sync
- Try creating a challenge and placing trades

### Database Schema
The app uses the following tables:
- **users**: User profiles synced from Privy auth with role management
- **challenges**: Trading challenges with balance and parameters
- **trades**: Individual trades linked to challenges
- **yields**: LP yield tracking
- **orders**: Payment processing and order management
- **contracts**: Digital contract signing with verification
- **admin_logs**: Audit trail for administrative actions
- **plans**: Configurable challenge plans

All tables include Row Level Security (RLS) policies for secure access.

## Smart Contract Vault System

### 🔐 **ERC4626 Vault Overview**
PolyPropVault is a production-grade ERC4626-compatible smart contract for liquidity provider deposits on Polygon. The vault accepts USDC deposits, mints tokenized shares, and distributes yields from resolved prediction market trades and evaluation fees.

#### **Key Features**
- **ERC4626 Standard**: Full compatibility with tokenized yield vaults
- **USDC Deposits**: Polygon-native USDC with 6-decimal precision
- **Dual Yield Sources**: Evaluation fees (90% platform, 10% LPs) + trader profits (80% traders, 10% platform, 10% LPs)
- **APY Targeting**: Variable 10-20%+ APY calculated off-chain from platform profits
- **Oracle Integration**: Platform backend/Chainlink for profit allocation calls
- **AI Optimization**: Oracle-fed weights for high-performing trader/MM allocations
- **Governance**: Owner-controlled fee splits for dynamic yield adjustment
- **Security**: ReentrancyGuard, Pausable, virtual shares, checks-effects-interactions

#### **Fee Structure**
```
Evaluation Fees: 90% → Platform Multisig, 10% → LP Yield (compounded)
Trader Profits: 80% → Trader Claims, 10% → Platform, 10% → LP Yield (compounded)
```

#### **APY Calculation**
```javascript
APY = (totalYieldAccrued / TVL) * 365 * 100; // In basis points
```

### 🛠️ **Contract Compilation**

#### **Prerequisites**
```bash
# Install dependencies
npm install

# Set environment variables in .env.local
ALCHEMY_POLYGON_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_without_0x_prefix
PLATFORM_MULTISIG=0x... # Platform multisig address
USDC_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174 # Polygon USDC
PROFIT_ORACLE=0x... # Oracle contract address
```

#### **Compile Contracts**
```bash
# Compile all contracts
npx hardhat compile

# Output: artifacts/ directory with ABI and bytecode
```

### 🚀 **Contract Deployment**

#### **Local Development**
```bash
# Start local Hardhat network
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.js --network hardhat
```

#### **Polygon Testnet (Mumbai)**
```bash
# Deploy to Mumbai testnet
npx hardhat run scripts/deploy.js --network polygonMumbai

# Verify contract on PolygonScan
npx hardhat verify --network polygonMumbai DEPLOYED_CONTRACT_ADDRESS
```

#### **Polygon Mainnet**
```bash
# Deploy to mainnet (ensure sufficient MATIC for gas)
npx hardhat run scripts/deploy.js --network polygon

# Verify contract on PolygonScan
npx hardhat verify --network polygon DEPLOYED_CONTRACT_ADDRESS \
  "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" \
  "0xPLATFORM_MULTISIG_ADDRESS" \
  "0xORACLE_ADDRESS"
```

### 🔌 **Contract Interaction**

#### **Ethers.js Integration**
```javascript
import { ethers } from 'ethers';

// Connect to vault contract
const vaultAddress = '0x...'; // Deployed vault address
const vault = new ethers.Contract(vaultAddress, abi, signer);

// Deposit USDC (LP deposits)
const depositAmount = ethers.utils.parseUnits('100', 6); // 100 USDC
await usdc.approve(vault.address, depositAmount);
await vault.deposit(depositAmount, userAddress);

// Check balance
const shares = await vault.balanceOf(userAddress);
const assets = await vault.previewRedeem(shares);

// Withdraw (redeem shares for USDC)
await vault.redeem(shares, userAddress, userAddress);

// Allocate profits (oracle only)
const totalProfits = ethers.utils.parseUnits('1000', 6);
await vault.allocateProfits(totalProfits);

// Collect evaluation fees (oracle only)
const totalFees = ethers.utils.parseUnits('500', 6);
await vault.collectEvaluationFees(totalFees);

// Claim trader profits
const claimable = await vault.getTraderClaimable(traderAddress);
await vault.claimTraderProfits(claimable);

// Check APY
const apy = await vault.getEstimatedAPY(); // In basis points
console.log(`Current APY: ${apy / 100}%`);

// Emergency controls (owner only)
await vault.pause();
await vault.unpause();
```

#### **Frontend Integration**
```javascript
// React hook for vault interaction
const useVault = (vaultAddress) => {
  const [vault, setVault] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const vaultContract = new ethers.Contract(vaultAddress, abi, signer);
      setVault(vaultContract);
    }
  }, [vaultAddress]);

  return vault;
};
```

### 🧪 **Testing**

#### **Run Test Suite**
```bash
# Run all tests
npx hardhat test

# Run specific test
npx hardhat test test/PolyPropVault.test.js

# Test coverage
npx hardhat coverage
```

#### **Test Scenarios**
- ✅ Deposit/withdrawal functionality
- ✅ Share calculation accuracy
- ✅ Profit allocation and fee collection
- ✅ Emergency pause/unpause
- ✅ Access control (owner/oracle restrictions)
- ✅ APY calculation validation

### 🔒 **Security Features**

#### **Built-in Protections**
- **ReentrancyGuard**: Prevents reentrancy attacks on deposits/withdrawals
- **Pausable**: Emergency pause functionality for critical issues
- **Virtual Shares**: Prevents inflation attacks by maintaining minimum share supply
- **Access Control**: Owner-only functions for critical operations
- **Input Validation**: Comprehensive checks on all user inputs

#### **Audit Considerations**
- **Checks-Effects-Interactions**: Pattern followed in state-changing functions
- **Gas Optimization**: Immutable constants, batch calculations, minimized storage reads
- **Clear Documentation**: Extensive inline comments for all functions and variables
- **Extensible Design**: Virtual functions for future AI-weighted allocations

### 📊 **Yield Optimization**

#### **APY Targeting Strategy**
The vault aims for 10-20%+ variable APY through:
1. **Platform Profits**: 10% of resolved trader profits
2. **Evaluation Fees**: 10% of collected evaluation fees
3. **AI Optimization**: Oracle-fed weights prioritize high-performing traders/MMs
4. **Compounding**: All LP yields automatically compounded

#### **Oracle Integration**
```solidity
interface IProfitOracle {
    function getProfitAllocation(uint256 totalProfits)
        external view returns (bytes[] memory traderAllocations, uint256 platformFee, uint256 lpYield);

    function getEvaluationFeeSplit(uint256 totalFees)
        external view returns (uint256 platformFee, uint256 lpYield);
}
```

#### **Governance Controls**
```solidity
// Owner can adjust fee splits dynamically
function updateFeeSplits(
    uint256 evaluationPlatformSplit,
    uint256 traderPlatformSplit,
    uint256 traderLPSplit
) external onlyOwner;
```

### 📋 **Contract Architecture**

```
contracts/
├── PolyPropVault.sol      # Main ERC4626 vault contract
├── SimpleProfitOracle.sol # Basic oracle implementation for testing
└── MockUSDC.sol          # Mock USDC for local testing

scripts/
└── deploy.js             # Deployment script with configuration

test/
└── PolyPropVault.test.js # Comprehensive test suite
```

### 🔧 **Environment Setup**

#### **Required Environment Variables**
```env
# Polygon RPC
ALCHEMY_POLYGON_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ALCHEMY_MUMBAI_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY

# Deployment Account
PRIVATE_KEY=your_private_key_without_0x_prefix

# Contract Addresses
PLATFORM_MULTISIG=0x... # Multisig wallet for platform fees
USDC_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174 # Polygon USDC
PROFIT_ORACLE=0x... # Deployed oracle contract

# Verification
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

## Overview

PredictProp is a comprehensive prediction markets trading platform that combines traditional prop trading evaluation with cutting-edge prediction market technology. Users can participate in virtual trading challenges using Polymarket data, with a full-featured dashboard for tracking performance, managing positions, and analyzing risk.

The platform features real-time market data integration, interactive charting, comprehensive risk analysis, and a modern responsive UI built with Next.js, Tailwind CSS, and Chart.js. Built on Polygon with Privy authentication, it provides a seamless trading experience for prediction market enthusiasts.

## Plan Selection & Payment System

### 🔧 **Supabase Plan Management**
- **Dynamic Plans**: Configurable challenge types (1-step/2-step) with custom parameters
- **Admin Management**: Full CRUD API for plan administration
- **Real-time Updates**: Live plan data with caching

### 💳 **Dual Payment Integration**
- **Stripe Integration**: Credit card payments with secure Elements
- **Crypto Payments**: Direct USDC transfers on Polygon network
- **Challenge Creation**: Automatic challenge setup upon successful payment
- **Email Notifications**: Welcome emails for new challenge starts

### 📋 **Plan Features**
- **1-Step Challenges**: Single evaluation phase with profit targets
- **2-Step Challenges**: Two-phase evaluation with progression requirements
- **Dynamic Parameters**: ROI targets, win rates, drawdown limits, exposure caps
- **Account Sizes**: Multiple balance options per plan type

## Core Features

### ✅ **Implemented Features**

#### **🏠 Homepage**
- Real-time Polymarket ticker with featured markets
- Responsive design with dark theme
- Interactive marquee with market links
- Hero section with call-to-action

#### **📊 Markets Page**
- **Live Polymarket Integration**: Real-time data via Gamma API and CLOB WebSocket
- **Advanced Filtering**: Category, status, search with URL state persistence
- **Sortable Columns**: Click headers for multi-column sorting with visual indicators
- **Orderbook Tooltips**: Hover odds to see bid/ask/spread data
- **AI Edge Detection**: Yellow chips for potential mispricing opportunities
- **Infinite Scroll**: SWR-powered pagination with loading states
- **Mobile-Responsive**: Table + card layouts with touch-friendly interactions
- **WebSocket Authentication**: API key-based CLOB connection with fallback polling

#### **👤 Traders Dashboard** (Protected Route)
- **Authentication**: Privy integration with redirect handling

#### **🔧 Admin Dashboard** (Protected Route)
- **Role-Based Access**: Automatic redirect for non-admin users
- **Tabbed Interface**: Headless UI tabs for different management sections
- **Orders Management**: SWR-powered table with approve/reject actions
- **Contracts System**: Digital signing with email 2FA verification
- **Customer Management**: Editable forms with breach tracking
- **Risk Monitoring**: Real-time position monitoring with WS sync
- **Reports & Analytics**: Revenue, conversion, and plan performance metrics
- **Audit Logging**: All admin actions logged to Supabase
- **Virtual Balance**: Real-time balance tracking with ROI indicators
- **Demo Mode**: Dismissible badge with challenge size display

##### **Challenges Tab**
- Phase 1 progress tracking (6% ROI target)
- Win rate monitoring (70% target)
- Drawdown and exposure risk metrics
- Challenge rules and requirements display

##### **Positions Tab**
- Comprehensive position table with sorting and filtering
- Real-time P&L calculations
- Market icons and expiration countdowns
- Mobile card layout
- Position closing modal with P&L preview

##### **Performance Tab** (Advanced Analytics)
- **Trade History**: Accordion-style cards with detailed P&L breakdown
- **Risk Alerts**: LSTM-style drawdown monitoring with severity levels
- **Equity Curve Chart**: Interactive Chart.js visualization with zoom/pan

#### **Enhanced Dashboard Features**
- **Side Panel**: Profile management, language selector, notifications, account links
- **Trading Objectives**: Visual progress cards for profit targets, drawdown limits, exposure caps
- **Results Progress**: Win rate pie charts and P&L breakdown analytics
- **Equity Alerts**: Automatic warnings when approaching account limits
- **Responsive Design**: Mobile drawer panel, desktop fixed sidebar
- **Performance Metrics**: Win rate, total P&L, trade counts
- Filter chips for Open/Resolved/All trades

#### **🏆 Additional Pages**
- **Leaderboard**: Trading performance rankings
- **Liquidity Providers**: LP-focused features
- **Responsive Navigation**: Theme toggle and mobile menu

### 🚧 **Planned Features**

#### **Smart Contracts & DeFi**
- ERC4626 vault contracts for liquidity management
- Uniswap V3 fork for token trading
- Automated market making bots

#### **AI & Risk Management**
- LSTM models for drawdown prediction and alerts
- Stable Baselines3 for yield optimization
- Machine learning for trade signal generation

#### **Compliance & Security**
- Privy Persona KYC integration
- GeoJS IP-based restrictions
- Chainalysis AML monitoring

#### **Advanced Analytics**
- Portfolio optimization algorithms
- Risk-adjusted return calculations
- Predictive modeling for market movements

## Tech Stack

### ✅ **Implemented**

#### **Frontend**
- **Next.js 15.5.3** - App Router with Turbopack
- **React 18** - Modern React with hooks and Suspense
- **Tailwind CSS 4** - Utility-first CSS framework
- **Chart.js** - Interactive data visualization (equity curves, performance metrics)
- **Headless UI** - Accessible component primitives (tabs, disclosures)
- **Heroicons** - Beautiful hand-crafted SVG icons
- **React Tooltip** - Rich tooltips for market data and orderbook info
- **Zustand** - Lightweight state management for sorting and real-time data

#### **Authentication & Security**
- **Privy** - Web3 authentication and wallet management
- **Next.js Middleware** - Route protection and redirects

#### **Real-time Data**
- **Polymarket Gamma API** - Live prediction market data
- **Polymarket CLOB WebSocket** - Authenticated real-time price feeds
- **SWR** - Data fetching and caching with real-time updates
- **Orderbook API** - Bid/ask spread and depth analysis
- **WebSocket Authentication** - API key-based CLOB connections

#### **Backend & APIs**
- **Next.js API Routes** - Serverless API endpoints
- **Orderbook API** - CLOB bid/ask data with Redis caching
- **Supabase Ready** - Database integration prepared
- **Redis Caching** - Performance optimization for API responses

### 🚧 **Planned/Coming Soon**

#### **Smart Contracts**
- **Solidity** - ERC4626 vaults, challenge contracts
- **Hardhat** - Development environment and testing
- **OpenZeppelin** - Secure contract libraries
- **Polygon** - Mumbai testnet and mainnet deployment

#### **AI & Machine Learning**
- **Stable Baselines3** - Reinforcement learning for yield optimization
- **LSTM Models** - Risk prediction and drawdown analysis
- **FastAPI** - ML model serving
- **AWS SageMaker** - ML infrastructure

#### **Advanced Features**
- **The Graph** - Decentralized data indexing
- **Alchemy** - Enhanced Web3 infrastructure
- **Sentry** - Error monitoring and tracking
- **GeoJS** - Geographic restrictions and compliance

## Development Status & Roadmap

### ✅ **Completed (Current State)**

#### **Phase 1: Core Platform (Weeks 1-4)** ✅ **COMPLETED**
- ✅ Next.js 15 App Router setup with Turbopack
- ✅ Privy authentication integration
- ✅ Polymarket Gamma API integration
- ✅ Responsive UI with Tailwind CSS
- ✅ Real-time data fetching with SWR
- ✅ Protected routes and middleware
- ✅ Homepage with live ticker
- ✅ **Enhanced Markets Page**: Sorting, tooltips, AI hints, orderbook integration
- ✅ Traders dashboard with full functionality
- ✅ Performance analytics with Chart.js
- ✅ Risk monitoring and alerts
- ✅ Mobile-responsive design
- ✅ **WebSocket Authentication**: API key-based CLOB connections
- ✅ API routes for all major features
- ✅ **Comprehensive Testing Suite**: Jest, Cypress E2E, simulation scripts
- ✅ **Performance Optimizations**: Redis caching, SWR tuning, WebSocket backoff
- ✅ **Orderbook API**: Bid/ask data with Redis caching

#### **Phase 2: Advanced Features (Weeks 5-8)**

##### **🔧 Immediate Fixes Needed**
- **Chart.js SSR Issues**: Fix date-fns import and ChartComponent loading
- **WebSocket Integration**: Complete real-time price updates
- **Error Boundaries**: Add proper error handling throughout app
- **Performance Optimization**: Code splitting and lazy loading

##### **📊 Data Integration**
- **Supabase Setup**: Connect to production database
- **Real Trade Data**: Integrate actual user positions and history
- **Market Resolution**: Live outcome fetching from Polymarket
- **Historical Data**: Backfill trade history and performance metrics

### 🚧 **Upcoming Development**

#### **Phase 3: DeFi & Smart Contracts (Weeks 9-12)**
- **ERC4626 Vault Contracts**: Deploy on Mumbai testnet
- **Challenge Smart Contracts**: Automated evaluation system
- **Uniswap V3 Fork**: Token trading functionality
- **Automated Market Making**: Bot integration for liquidity

#### **Phase 4: AI & Advanced Analytics (Weeks 13-16)**
- **LSTM Risk Models**: Drawdown prediction and alerts
- **Yield Optimization**: Stable Baselines3 implementation
- **Portfolio Optimization**: Risk-adjusted strategies
- **Predictive Analytics**: Market movement forecasting

#### **Phase 5: Production & Scale (Weeks 17-20)**
- **Mainnet Deployment**: Polygon mainnet launch
- **KYC Integration**: Privy Persona compliance
- **Monitoring & Analytics**: Sentry and performance tracking
- **Security Audits**: Smart contract and application security
- **Beta Testing**: User acceptance testing and feedback

### 🐛 **Known Issues**

#### **High Priority** ✅ **RESOLVED**
- ✅ **Chart.js SSR Issues**: Fixed with dynamic imports and proper component isolation
- ✅ **WebSocket Connection**: Implemented authentication and robust reconnection logic
- ✅ **Symbol Conversion Errors**: Resolved Chart.js and Zustand selector issues
- ✅ **Component Import Issues**: Fixed with proper dynamic import paths

#### **Medium Priority**
1. **Bundle Size Optimization**: Consider code splitting for better mobile performance
2. **Error Boundaries**: Add comprehensive error handling throughout app

#### **Low Priority**
1. **Accessibility**: Some components need ARIA labels
2. **Theme Persistence**: Dark/light mode not saved across sessions
3. **Progressive Web App**: PWA manifest and service worker missing

## Getting Started

### Prerequisites
- **Node.js 18+** - Required for Next.js 15
- **npm or yarn** - Package manager
- **Git** - Version control

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/tlawal/predictprop1
   cd predictprop1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   # Polymarket API (Public - no API key required for read-only)
   NEXT_PUBLIC_POLYMARKET_API_KEY=your_polymarket_api_key

   # Privy Authentication
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

   # Supabase (Optional - for production database)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Alchemy (Optional - for enhanced Web3 features)
   ALCHEMY_API_KEY=your_alchemy_api_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Setup

#### **For Development**
- The app works without most environment variables for basic functionality
- Polymarket API integration works without API keys (public endpoints)
- Privy authentication requires app setup for full functionality

#### **For Production**
- Set up Privy app at [privy.io](https://privy.io)
- Configure Supabase database for user data persistence
- Add Alchemy API key for enhanced Web3 features

## Project Structure

```
predictprop1/
├── 📁 app/                          # Next.js 15 App Router
│   ├── 📁 api/                      # API Routes
│   │   ├── 📁 auth/                 # Authentication endpoints
│   │   ├── 📁 balance/              # User balance API
│   │   ├── 📁 challenge/            # Challenge progress API
│   │   ├── 📁 history/              # Trade history API
│   │   ├── 📁 markets/              # Markets data API
│   │   ├── 📁 midpoint/             # Price midpoint API
│   │   ├── 📁 order/                # Order placement API
│   │   ├── 📁 positions/            # User positions API
│   │   └── 📁 risk/                 # Risk analysis API
│   ├── 📁 components/               # Shared React components
│   ├── 📁 leaderboard/              # Leaderboard page
│   ├── 📁 lps/                      # Liquidity providers page
│   ├── 📁 markets/                  # Markets page + components
│   │   ├── 📁 components/           # Markets-specific components
│   │   └── page.js
│   ├── 📁 styles/                   # Legacy CSS modules
│   ├── 📁 traders/                  # Traders dashboard
│   │   ├── 📁 components/           # Trader-specific components
│   │   │   ├── ChartComponent.js    # Chart.js wrapper
│   │   │   ├── CloseModal.js        # Position closing modal
│   │   │   ├── EquityCurveChart.js  # Performance chart
│   │   │   ├── PositionsTable.js    # Positions management
│   │   │   ├── ProgressTracker.js   # Challenge progress
│   │   │   ├── RiskAlertBanner.js   # Risk notifications
│   │   │   └── TradeHistoryList.js  # Trade history accordion
│   │   └── page.js                  # Main traders page
│   ├── 📄 favicon.ico
│   ├── 📄 globals.css               # Global styles
│   ├── 📄 layout.js                 # Root layout
│   ├── 📄 page.js                   # Homepage
│   └── 📄 ThemeContext.js           # Theme management
├── 📁 lib/                          # Utility libraries
│   ├── 📁 hooks/                    # Custom React hooks
│   │   └── usePolymarket.js         # Polymarket data hooks
│   ├── 📁 services/                 # External service integrations
│   │   └── polymarket.js            # Polymarket API client
│   ├── 📁 stores/                   # State management (deprecated)
│   └── 📄 websocket.js              # WebSocket utilities
├── 📁 public/                       # Static assets
│   ├── 📄 *.svg                     # SVG icons and logos
│   ├── 📄 *.png                     # Image assets
│   └── 📄 index.html                # Fallback HTML
├── 📁 node_modules/                 # Dependencies
├── 📄 .env.local                    # Environment variables
├── 📄 eslint.config.mjs             # ESLint configuration
├── 📄 jsconfig.json                 # JavaScript project config
├── 📄 next.config.mjs               # Next.js configuration
├── 📄 package.json                  # Dependencies & scripts
├── 📄 package-lock.json             # Lockfile
├── 📄 postcss.config.mjs            # PostCSS configuration
└── 📄 README.md                     # This file
```

### Key Architecture Highlights

#### **🎯 App Router Structure**
- **File-based routing** with nested layouts
- **Server Components** for optimal performance
- **Client Components** only where needed (interactivity)

#### **📊 API-First Design**
- **RESTful endpoints** for all data operations
- **Caching layers** with Redis-ready architecture
- **Error handling** with proper HTTP status codes
- **Type-safe responses** with consistent schemas

#### **🧩 Component Architecture**
- **Atomic design** with reusable components
- **Feature-based organization** (pages with dedicated components)
- **Responsive design** with mobile-first approach
- **Accessibility** with semantic HTML and ARIA labels

#### **🔄 Data Flow**
- **SWR** for client-side data fetching and caching
- **Real-time updates** via WebSocket integration
- **Optimistic updates** for better UX
- **Error boundaries** for graceful failure handling

## Contributing

### Current Development Priorities

#### **🔥 High Priority**
1. **Fix Chart.js Issues**: Resolve SSR and date-fns import problems
2. **WebSocket Stability**: Improve real-time price update connections
3. **Supabase Integration**: Connect to production database
4. **Error Boundaries**: Add comprehensive error handling

#### **📈 Medium Priority**
1. **Performance Optimization**: Code splitting and lazy loading
2. **Mobile Optimization**: Bundle size reduction and PWA features
3. **Testing Suite**: Unit and integration tests
4. **Documentation**: API documentation and component stories

#### **🔮 Future Enhancements**
1. **DeFi Integration**: Smart contracts for vaults and challenges
2. **AI Features**: LSTM models and predictive analytics
3. **Advanced Analytics**: Portfolio optimization and risk modeling
4. **Multi-chain Support**: Additional blockchain integrations

### Development Workflow

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/your-username/predictprop1
   cd predictprop1
   ```

2. **Create Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Run Linting**:
   ```bash
   npm run lint
   ```

6. **Test Build**:
   ```bash
   npm run build
   ```

### Code Style Guidelines

#### **React Components**
- Use functional components with hooks
- Implement proper TypeScript types (planned)
- Follow component composition patterns
- Use meaningful component and prop names

#### **API Routes**
- Consistent error response format
- Proper HTTP status codes
- Input validation and sanitization
- Comprehensive error handling

#### **Styling**
- Tailwind CSS utility classes
- Responsive design (mobile-first)
- Consistent color scheme and spacing
- Dark theme as primary design

### Testing Strategy

#### **🧪 Comprehensive Testing Suite**

##### **✅ Implemented Testing Infrastructure**

###### **Jest Unit Testing**
- **Component Testing**: React Testing Library with full coverage
- **Mock Setup**: Comprehensive mocks for APIs, WebSocket, and external services
- **Custom Matchers**: Extended Jest matchers for accessibility and form validation
- **Snapshot Testing**: Visual regression testing for UI components
- **Performance Testing**: Component render time validation

```bash
# Run unit tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

###### **Cypress E2E Testing**
- **Full User Flow Testing**: Complete journey from landing to trading
- **Custom Commands**: Reusable commands for authentication, navigation, and trading
- **API Mocking**: Intercept and mock external API calls
- **Visual Testing**: Screenshot comparison and visual regression
- **Performance Monitoring**: Page load and interaction timing

```bash
# Run E2E tests headlessly
npm run e2e

# Open Cypress Test Runner
npm run e2e:open
```

###### **Simulation & Data Generation**
- **Virtual Trading Simulation**: Generate realistic test trades
- **Market Resolution Engine**: Simulate binary outcome resolution
- **Risk Analysis Testing**: Drawdown and cluster analysis validation
- **Database Seeding**: Populate Supabase with test data

```bash
# Run trading simulation
npm run simulate
```

##### **🔧 Testing Configuration**

###### **Jest Configuration** (`jest.config.js`)
- **Environment**: jsdom for DOM simulation
- **Coverage**: 70% threshold across branches, functions, lines, statements
- **Transform**: Babel integration for Next.js compatibility
- **Setup**: Global mocks and utilities in `jest.setup.js`

###### **Cypress Configuration** (`cypress.config.js`)
- **Base URL**: Configurable for different environments
- **Video Recording**: Automatic video capture for failed tests
- **Retry Logic**: 2 retries for run mode, 0 for interactive mode
- **Custom Tasks**: Database seeding and cleanup utilities

##### **📋 Test Coverage Areas**

###### **Component Tests** (`/__tests__/components.test.js`)
- **AuthButton**: Authentication flow and modal interactions
- **OrderModal**: Form validation, submission, and error handling
- **Integration Testing**: Component interaction and state management
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

###### **E2E Test Flow** (`cypress/e2e/full-flow.cy.js`)
1. **Homepage**: Challenge selection and navigation
2. **Authentication**: Privy modal login process
3. **Markets**: Search, filtering, and order placement
4. **Traders Dashboard**: Position management and performance analysis
5. **Risk Monitoring**: Alert dismissal and notification handling

##### **🎯 Testing Best Practices**

###### **Test Organization**
- **Unit Tests**: Isolated component and utility testing
- **Integration Tests**: API route and service layer testing
- **E2E Tests**: Complete user journey validation
- **Performance Tests**: Load time and interaction speed validation

###### **Mock Strategy**
- **API Mocks**: Intercept external API calls for consistent testing
- **Database Mocks**: Simulate Supabase operations
- **WebSocket Mocks**: Mock real-time price updates
- **Authentication Mocks**: Simulate Privy auth flow

###### **CI/CD Integration**
- **Automated Testing**: Run tests on every push and PR
- **Parallel Execution**: Run tests in parallel for faster feedback
- **Test Reporting**: Generate detailed reports with screenshots
- **Coverage Reports**: Track and enforce test coverage thresholds

##### **🚀 Testing Commands**

```bash
# Run all tests
npm test && npm run e2e

# Run specific test suites
npm run test -- --testPathPattern=components
npm run test -- --testPathPattern=utils

# Debug failing tests
npm run test -- --verbose --detectOpenHandles

# Generate coverage report
npm run test:coverage
```

##### **📊 Test Data Management**

###### **Fixtures and Seeds**
- **User Data**: Mock user profiles with different permission levels
- **Market Data**: Realistic market scenarios and edge cases
- **Trade Data**: Various trade states and P&L scenarios
- **Risk Scenarios**: Different drawdown and exposure situations

###### **Data Generation**
- **Simulation Script**: Generate 20+ virtual trades with realistic parameters
- **Market Resolution**: Random binary outcomes with proper P&L calculation
- **Risk Analysis**: Cluster drawdown patterns and severity assessment

##### **🔍 Debugging and Troubleshooting**

###### **Common Test Issues**
- **Flaky Tests**: Use retry logic and stable selectors
- **Timing Issues**: Implement proper wait strategies
- **Network Errors**: Mock external dependencies
- **Environment Issues**: Consistent test environment setup

###### **Debug Tools**
- **Cypress Runner**: Interactive debugging with time travel
- **Jest Debugger**: Step-through debugging for unit tests
- **Console Logs**: Detailed logging for test execution
- **Screenshots**: Automatic capture for failed tests

##### **🎲 Virtual Trading Simulation**

###### **Overview**
The simulation script generates realistic trading data for testing and demonstration purposes. It creates virtual trades, simulates market resolution, and analyzes risk patterns - perfect for populating the dashboard with sample data.

###### **Features**
- **20 Virtual Trades**: Generates diverse trading scenarios
- **Random Market Selection**: Uses real Polymarket data via Gamma API
- **Binary Resolution**: Simulates Yes/No market outcomes
- **P&L Calculation**: Realistic profit/loss based on entry prices and outcomes
- **Cluster Analysis**: Groups trades by end date for drawdown analysis
- **Risk Assessment**: Calculates drawdown percentages and severity levels

###### **Usage**
```bash
# Run the complete simulation
npm run simulate

# The script will:
# 1. Fetch random markets from Polymarket
# 2. Generate 20 virtual trades with random parameters
# 3. Simulate CLOB order placement
# 4. Insert trades into Supabase database
# 5. Simulate market resolution after random delays
# 6. Update resolved trades with P&L
# 7. Analyze cluster drawdown patterns
# 8. Log comprehensive statistics
```

###### **Simulation Output**
```
🚀 Starting PolyProp Trading Simulation...
📊 Trades Generated: 20
✅ Trades Resolved: 18 (90% resolution rate)
💰 Total Volume: $12,450.00
📈 Total PnL: $1,234.56
🎯 Win Rate: 65%
📊 Cluster Drawdown Analysis:
   • Clusters Analyzed: 8
   • Loss Clusters: 3
   • Average Drawdown: 3.2%
   • Maximum Drawdown: 5.8%
```

###### **Database Integration**
The simulation script integrates with Supabase to:
- **Insert Trades**: Creates realistic trade records
- **Update Resolution**: Simulates market outcomes
- **Calculate P&L**: Computes profits and losses
- **Store Analytics**: Saves performance metrics

###### **Configuration**
```javascript
// Environment variables for simulation
VIRTUAL_USER_ID=virtual-trader-001
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

###### **Risk Analysis Engine**
- **Drawdown Detection**: Identifies positions with losses
- **Cluster Grouping**: Groups by end date for pattern analysis
- **Severity Classification**: High/Medium/Low risk assessment
- **Exposure Calculation**: Total position values and concentrations

##### **🔧 Performance Optimizations**

###### **Redis Caching Strategy**
- **API Routes**: All `/api/*` routes support Redis caching
- **TTL Configuration**: 30-minute cache expiration for markets data
- **Fallback Logic**: Automatic fallback to in-memory cache
- **Environment Setup**: Configure `REDIS_URL` for production caching

```javascript
// Cache configuration in API routes
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
await redisClient.setex(`yield:${cacheKey}`, 1800, JSON.stringify(data));
```

###### **SWR Optimization**
- **Revalidate on Focus**: Disabled to reduce unnecessary API calls
- **Deduping Interval**: 1-minute deduping to prevent duplicate requests
- **Error Retry**: 2 retry attempts with exponential backoff
- **Suspense**: Disabled for better error handling

```javascript
const swrConfig = {
  refreshInterval: 300000, // 5 minutes
  revalidateOnFocus: false,
  dedupingInterval: 60000, // 1 minute
  errorRetryCount: 2,
  errorRetryInterval: 10000, // 10 seconds
};
```

###### **WebSocket Exponential Backoff**
- **Base Delay**: 1 second initial reconnection delay
- **Exponential Growth**: 1s, 2s, 4s, 8s, 16s, 32s (max 30s)
- **Jitter**: Random jitter to prevent thundering herd
- **Max Attempts**: 5 reconnection attempts before fallback
- **Cleanup**: Proper timeout cleanup on disconnect

```javascript
// Exponential backoff with jitter
const baseDelay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
const jitter = Math.random() * 0.1 * baseDelay;
const delay = Math.min(baseDelay + jitter, this.maxReconnectDelay);
```

###### **Memory Management**
- **Cache Limits**: Maximum 10 entries in memory cache
- **LRU Eviction**: Least recently used cache cleanup
- **Resource Cleanup**: Proper cleanup of timeouts and connections
- **Memory Monitoring**: Automatic cache size monitoring

### Deployment

#### **Development**
- Local development with `npm run dev`
- Hot reload with Turbopack
- Environment variables in `.env.local`

#### **Staging**
- Vercel deployment previews
- Automated testing on PRs
- Environment-specific configurations

#### **Production**
- Vercel platform deployment
- Environment variable management
- CDN optimization and caching
- Monitoring and error tracking

## API Documentation

### Core Endpoints

#### **Markets API**
```
GET /api/markets?q=search&category=politics&limit=20&offset=0
```
- **Query Parameters**: Search, category filtering, pagination
- **Response**: Market data with real-time prices
- **Caching**: 30-second intervals with SWR

#### **Positions API**
```
GET /api/positions?userId=user_id
```
- **Response**: User positions with P&L calculations
- **Real-time**: Automatic updates via SWR
- **Mock Data**: Currently uses demo positions

#### **Challenge API**
```
GET /api/challenge?userId=user_id
```
- **Response**: Challenge progress and metrics
- **Calculations**: ROI, win rate, drawdown analysis
- **Mock Data**: Simulated challenge progress

#### **History API**
```
GET /api/history?userId=user_id&status=open
```
- **Response**: Trade history with outcome resolution
- **Filtering**: Open/Resolved/All trades
- **Performance**: Equity curve calculations

#### **Risk API**
```
GET /api/risk?userId=user_id
```
- **Response**: Risk analysis and alerts
- **LSTM Simulation**: Drawdown clustering analysis
- **Recommendations**: Risk mitigation suggestions

## Troubleshooting

### Common Issues

#### **Chart.js Not Loading**
- **Issue**: SSR conflicts with Chart.js
- **Solution**: Ensure dynamic imports are used
- **Status**: Currently being resolved

#### **Polymarket API Errors**
- **Issue**: Rate limiting or CORS issues
- **Solution**: Implement proper error handling and retries
- **Status**: Working with public endpoints

#### **WebSocket Connection Issues**
- **Issue**: Intermittent connection failures
- **Solution**: Improve reconnection logic
- **Status**: Needs enhancement

#### **Build Errors**
- **Issue**: Missing dependencies or configuration
- **Solution**: Check package.json and next.config.mjs
- **Status**: Generally stable

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Comprehensive API and component docs
- **Community**: Join our Discord for discussions

## Disclaimer

This software is for educational and research purposes. Prediction market trading involves significant risk of loss. Please do your own research and never invest more than you can afford to lose. Past performance does not guarantee future results.