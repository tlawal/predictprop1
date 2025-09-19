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

#### **Current Testing**
- Manual testing of all features
- Browser developer tools for debugging
- Console logging for API responses

#### **Planned Testing**
- **Unit Tests**: Jest for component testing
- **Integration Tests**: API route testing
- **E2E Tests**: Playwright for user flows
- **Performance Tests**: Lighthouse and Web Vitals

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