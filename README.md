# PredictProp

## Overview

PredictProp is a comprehensive prediction markets trading platform that combines traditional prop trading evaluation with cutting-edge prediction market technology. Users can participate in virtual trading challenges using Polymarket data, with a full-featured dashboard for tracking performance, managing positions, and analyzing risk.

The platform features real-time market data integration, interactive charting, comprehensive risk analysis, and a modern responsive UI built with Next.js, Tailwind CSS, and Chart.js. Built on Polygon with Privy authentication, it provides a seamless trading experience for prediction market enthusiasts.

## Core Features

### ✅ **Implemented Features**

#### **🏠 Homepage**
- Real-time Polymarket ticker with featured markets
- Responsive design with dark theme
- Interactive marquee with market links
- Hero section with call-to-action

#### **📊 Markets Page**
- Live Polymarket integration via Gamma API
- Advanced filtering (category, status, search)
- Infinite scroll with pagination
- Mobile-responsive table and card layouts
- Real-time price updates and WebSocket integration

#### **👤 Traders Dashboard** (Protected Route)
- **Authentication**: Privy integration with redirect handling
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

#### **Authentication & Security**
- **Privy** - Web3 authentication and wallet management
- **Next.js Middleware** - Route protection and redirects

#### **Real-time Data**
- **Polymarket Gamma API** - Live prediction market data
- **SWR** - Data fetching and caching with real-time updates
- **WebSocket Integration** - Real-time price updates

#### **Backend & APIs**
- **Next.js API Routes** - Serverless API endpoints
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

#### **Phase 1: Core Platform (Weeks 1-4)**
- ✅ Next.js 15 App Router setup with Turbopack
- ✅ Privy authentication integration
- ✅ Polymarket Gamma API integration
- ✅ Responsive UI with Tailwind CSS
- ✅ Real-time data fetching with SWR
- ✅ Protected routes and middleware
- ✅ Homepage with live ticker
- ✅ Markets page with filtering and pagination
- ✅ Traders dashboard with full functionality
- ✅ Performance analytics with Chart.js
- ✅ Risk monitoring and alerts
- ✅ Mobile-responsive design
- ✅ API routes for all major features

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

#### **High Priority**
1. **Chart.js SSR Issues**: `date-fns` import failing during server-side rendering
2. **ChartComponent Import**: Dynamic import path resolution issues
3. **WebSocket Connection**: Intermittent connection failures

#### **Medium Priority**
1. **Real-time Updates**: WebSocket reconnection logic needs improvement
2. **Mobile Performance**: Large bundle size affecting mobile loading
3. **Image Optimization**: Polymarket S3 images need better caching

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