# PolyProp

## Overview

PolyProp is the first decentralized prop trading platform for prediction markets, enabling traders to access LP-funded capital after passing a paid evaluation challenge (8-10% ROI, <5% drawdown, 30 days) using Polymarket's markets. Retail users deposit USDC into stablecoin vaults, earning 10-20% APY from 1-2% trade fees and 10-20% profit splits, with the platform taking a 5-10% yield cut. AI optimizes vault yields and manages risks. Built on Polygon with Next.js, Privy, and smart contracts, it addresses liquidity constraints in long-tail prediction markets.

## Core Features

### Trader Evaluation Challenge
Traders manage $10k virtual capital in demo mode (Supabase/Mumbai testnet), placing Polymarket bets (POST /order). Passers unlock $100k LP funds.

### Liquidity Vaults
Retail LPs deposit USDC into ERC4626 vaults, minting ppLP-USDC tokens. Bots provide market-making liquidity, generating 10-20% APY. Uniswap V3 fork enables token trading.

### AI Optimization
Stable Baselines3 for yield optimization (15% APY), LSTM for drawdown alerts.

### Compliance
Privy's Persona for KYC (non-US), GeoJS for IP bans, Chainalysis for AML.

## Tech Stack

### Frontend
- Next.js
- Tailwind CSS
- Chart.js (equity/yield graphs)

### Backend
- Node.js
- Next.js API routes
- py-clob-client (Polymarket)
- Privy SDK

### Smart Contracts
- Solidity (Hardhat, OpenZeppelin)
- Polygon (Mumbai, mainnet)

### Database
- Supabase for user/trade data

### AI
- Stable Baselines3
- LSTM (FastAPI/AWS SageMaker)

### Other
- The Graph
- Alchemy
- Sentry
- GeoJS

## Development Roadmap

### Weeks 1-2
Deploy ERC4626 vault, challenge, and Uniswap V3 fork contracts on Mumbai. Setup Next.js with Privy.

### Weeks 3-4
Build MVP (dashboard, markets, order modal, KYC).

### Weeks 5-6
Test MVP, train AI (15% APY), beta test (20-30 users), plan mainnet.

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone repo:**
   ```bash
   git clone https://github.com/tlawal/predictprop1
   cd predictprop1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   Create `.env.local` file and add:
   ```env
   # Polymarket API
   POLYMARKET_API_KEY=your_api_key_here
   
   # Privy
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Alchemy
   ALCHEMY_API_KEY=your_alchemy_key
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Deploy contracts (Coming Soon):**
   ```bash
   npx hardhat run scripts/deploy.js --network mumbai
   ```

6. **Test AI (Coming Soon):**
   ```bash
   python scripts/train_stable_baselines.py
   ```

7. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx hardhat test` - Run smart contract tests (Coming Soon)
- `npx hardhat deploy` - Deploy contracts (Coming Soon)

## Project Structure

```
predictprop1/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── kalshi/       # Kalshi API integration
│   │   ├── polymarket/   # Polymarket API integration
│   │   └── test-markets/ # Test market endpoints
│   ├── components/        # React components
│   │   ├── Footer.js     # Footer component
│   │   └── Header.js     # Header component
│   ├── styles/           # CSS modules
│   │   ├── Home.module.css
│   │   ├── Header.module.css
│   │   ├── Footer.module.css
│   │   └── [Page].module.css files
│   ├── leaderboard/      # Leaderboard page
│   ├── lps/             # Liquidity providers page
│   ├── markets/         # Markets page
│   ├── traders/         # Traders page
│   ├── pages/           # Additional pages
│   ├── page.js          # Home page
│   ├── layout.js        # Root layout
│   ├── globals.css      # Global styles
│   └── ThemeContext.js  # Theme context provider
├── public/               # Static assets
│   ├── *.svg           # SVG icons
│   └── index.html      # Static HTML
├── src/                 # Additional source files (empty)
├── contracts/           # Smart contracts (Coming Soon)
├── scripts/             # Deployment & utility scripts (Coming Soon)
├── package.json         # Dependencies and scripts
├── next.config.mjs      # Next.js configuration
├── eslint.config.mjs    # ESLint configuration
├── postcss.config.mjs   # PostCSS configuration
└── README.md           # This file
```

## Contributing

### Focus Areas
- DeFi protocols and mechanisms
- Prediction markets integration
- Polygon ecosystem development
- AI/ML optimization algorithms

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines
- Submit issues/PRs for bugs, UI improvements, or AI enhancements
- Test on Mumbai testnet before mainnet deployment
- Follow existing code style and conventions
- Add tests for new features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@polyprop.com or join our Discord community.

## Disclaimer

This software is for educational and research purposes. Trading involves risk of loss. Please do your own research before investing.