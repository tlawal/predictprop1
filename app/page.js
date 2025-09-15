'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import styles from './styles/Home.module.css';

export default function Home() {
  const canvasRef = useRef(null);
  const [markets, setMarkets] = useState([
    { title: 'Will Bitcoin reach $150,000 by end of 2025?', yesPrice: 0.25, noPrice: 0.75, source: 'Polymarket', url: 'https://polymarket.com/market/will-bitcoin-reach-150000-by-end-of-2025' },
    { title: 'Will the S&P 500 close above 6,000 by end of 2025?', yesPrice: 0.40, noPrice: 0.60, source: 'Polymarket', url: 'https://polymarket.com/market/will-sp500-close-above-6000-by-end-of-2025' },
    { title: 'Will there be a recession in 2025?', yesPrice: 0.30, noPrice: 0.70, source: 'Polymarket', url: 'https://polymarket.com/market/will-there-be-a-recession-in-2025' },
    { title: 'Will the Fed cut rates by 100+ bps in 2025?', yesPrice: 0.55, noPrice: 0.45, source: 'Polymarket', url: 'https://polymarket.com/market/will-fed-cut-rates-by-100-bps-in-2025' },
    { title: 'Will AI stocks outperform the market in 2025?', yesPrice: 0.60, noPrice: 0.40, source: 'Polymarket', url: 'https://polymarket.com/market/will-ai-stocks-outperform-market-2025' },
    { title: 'Will Ethereum reach $10,000 by end of 2025?', yesPrice: 0.35, noPrice: 0.65, source: 'Polymarket', url: 'https://polymarket.com/market/will-ethereum-reach-10000-by-end-of-2025' },
    { title: 'Will the US election be decided by less than 5% margin?', yesPrice: 0.45, noPrice: 0.55, source: 'Polymarket', url: 'https://polymarket.com/market/will-us-election-be-decided-by-less-than-5-percent-margin' },
    { title: 'Will the housing market crash in 2025?', yesPrice: 0.20, noPrice: 0.80, source: 'Polymarket', url: 'https://polymarket.com/market/will-housing-market-crash-in-2025' }
  ]);
  const [evaluationType, setEvaluationType] = useState('one-phase');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch active markets from Polymarket and Kalshi
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoading(true);
        setError(null);
        // Polymarket API
        const polymarketResponse = await axios.get('/api/polymarket', { timeout: 10000 });
        console.log('Polymarket response:', polymarketResponse.data);
        const polymarketMarkets = Array.isArray(polymarketResponse.data)
          ? polymarketResponse.data.slice(0, 10).map(market => ({
              title: market.question || market.name || 'Untitled Market',
              yesPrice: market.outcomes?.[0]?.price || 0,
              noPrice: market.outcomes?.[1]?.price || 0,
              source: 'Polymarket',
              url: market.url,
              category: market.category || 'General',
              volume: market.volume || 0,
              createdAt: market.createdAt,
              endDate: market.end_date_iso
            }))
          : [];

        // Kalshi API - Commented out due to timeout issues
        // const kalshiResponse = await axios.get('/api/kalshi', { timeout: 10000 });
        // console.log('Kalshi response:', kalshiResponse.data);
        // const kalshiMarkets = Array.isArray(kalshiResponse.data.markets)
        //   ? kalshiResponse.data.markets.map(market => ({
        //       title: market.title || 'Untitled Market',
        //       yesPrice: (market.yes_ask || 0) / 100,
        //       noPrice: (market.no_ask || 0) / 100,
        //       source: 'Kalshi',
        //       url: market.url
        //     }))
        //   : [];
        const kalshiMarkets = []; // Empty array since Kalshi is commented out

        const combinedMarkets = [...polymarketMarkets, ...kalshiMarkets];

            setMarkets(combinedMarkets.length > 0 ? combinedMarkets : [
              { title: 'Will Bitcoin reach $150,000 by end of 2025?', yesPrice: 0.25, noPrice: 0.75, source: 'Polymarket', url: 'https://polymarket.com/market/will-bitcoin-reach-150000-by-end-of-2025' },
              { title: 'Will the S&P 500 close above 6,000 by end of 2025?', yesPrice: 0.40, noPrice: 0.60, source: 'Polymarket', url: 'https://polymarket.com/market/will-sp500-close-above-6000-by-end-of-2025' },
              { title: 'Will there be a recession in 2025?', yesPrice: 0.30, noPrice: 0.70, source: 'Polymarket', url: 'https://polymarket.com/market/will-there-be-a-recession-in-2025' },
              { title: 'Will the Fed cut rates by 100+ bps in 2025?', yesPrice: 0.55, noPrice: 0.45, source: 'Polymarket', url: 'https://polymarket.com/market/will-fed-cut-rates-by-100-bps-in-2025' },
              { title: 'Will AI stocks outperform the market in 2025?', yesPrice: 0.60, noPrice: 0.40, source: 'Polymarket', url: 'https://polymarket.com/market/will-ai-stocks-outperform-market-2025' },
              { title: 'Will Ethereum reach $10,000 by end of 2025?', yesPrice: 0.35, noPrice: 0.65, source: 'Polymarket', url: 'https://polymarket.com/market/will-ethereum-reach-10000-by-end-of-2025' },
              { title: 'Will the US election be decided by less than 5% margin?', yesPrice: 0.45, noPrice: 0.55, source: 'Polymarket', url: 'https://polymarket.com/market/will-us-election-be-decided-by-less-than-5-percent-margin' },
              { title: 'Will the housing market crash in 2025?', yesPrice: 0.20, noPrice: 0.80, source: 'Polymarket', url: 'https://polymarket.com/market/will-housing-market-crash-in-2025' }
            ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching markets:', error);
        console.error('Error details:', error.message, error.response?.data);
        setError(error.message);
        setMarkets([
          { title: 'Will Bitcoin reach $150,000 by end of 2025?', yesPrice: 0.25, noPrice: 0.75, source: 'Polymarket', url: 'https://polymarket.com/market/will-bitcoin-reach-150000-by-end-of-2025' },
          { title: 'Will the S&P 500 close above 6,000 by end of 2025?', yesPrice: 0.40, noPrice: 0.60, source: 'Polymarket', url: 'https://polymarket.com/market/will-sp500-close-above-6000-by-end-of-2025' },
          { title: 'Will there be a recession in 2025?', yesPrice: 0.30, noPrice: 0.70, source: 'Polymarket', url: 'https://polymarket.com/market/will-there-be-a-recession-in-2025' }
        ]);
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 200;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 4 + 1;
        this.speedX = Math.random() * 1.5 - 0.75;
        this.speedY = Math.random() * 1.5 - 0.75;
        this.opacity = Math.random() * 0.3 + 0.3;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.size > 0.2) this.size -= 0.03;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw() {
        ctx.fillStyle = `rgba(45, 212, 191, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function initParticles() {
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let particle of particles) {
        particle.update();
        particle.draw();
      }
      requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Challenge plan data
  const challengePlans = {
    'one-phase': [
      { size: '$10,000', profitTarget: '10% ($1,000)', dailyLoss: '5% ($500)', drawdown: '8% ($800)', fee: '$100' },
      { size: '$25,000', profitTarget: '10% ($2,500)', dailyLoss: '5% ($1,250)', drawdown: '8% ($2,000)', fee: '$250' },
      { size: '$50,000', profitTarget: '10% ($5,000)', dailyLoss: '5% ($2,500)', drawdown: '8% ($4,000)', fee: '$400' },
      { size: '$100,000', profitTarget: '10% ($10,000)', dailyLoss: '5% ($5,000)', drawdown: '8% ($8,000)', fee: '$500' },
    ],
    'two-phase': [
      { size: '$10,000', profitTarget: '10% ($1,000)', dailyLoss: '5% ($500)', drawdown: '10% ($1,000)', fee: '$120' },
      { size: '$25,000', profitTarget: '10% ($2,500)', dailyLoss: '5% ($1,250)', drawdown: '10% ($2,500)', fee: '$275' },
      { size: '$50,000', profitTarget: '10% ($5,000)', dailyLoss: '5% ($2,500)', drawdown: '10% ($5,000)', fee: '$450' },
      { size: '$100,000', profitTarget: '10% ($10,000)', dailyLoss: '5% ($5,000)', drawdown: '10% ($10,000)', fee: '$650' },
    ]
  };

  return (
    <>
      <section className={styles.hero} id="home">
        <canvas ref={canvasRef} className={styles.particles}></canvas>
        <div className={`${styles.heroContent} ${styles.container}`}>
          <h1>Trade Prediction Markets with Funded Capital</h1>
          <p>Trade politics, sports, economics & more — get funded up to $200,000.</p>
          <div className={styles.cta}>
            <Link href="/traders">
              <button className={`${styles.ctaButton} ${styles.primary}`}>Start Challenge</button>
            </Link>
            <Link href="#how-it-works">
              <button className={`${styles.ctaButton} ${styles.secondary}`}>Learn How It Works</button>
            </Link>
            <Link href="/lps">
              <button className={`${styles.ctaButton} ${styles.tertiary}`}>Stake USDC</button>
            </Link>
          </div>
        </div>
      </section>
      <section className={styles.marketTicker}>
        <div className={styles.container}>
          <h2>Live Prediction Markets</h2>
          {markets.length === 0 && <p>Loading markets...</p>}
          {error && <p>Error: {error}</p>}
          <div className={styles.marqueeContainer}>
            <div className={styles.marqueeContent}>
              {markets.map((market, index) => (
                <a 
                  key={index} 
                  href={market.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.tickerItem}
                >
                  <div>
                    <h3>{market.title}</h3>
                    <div className={styles.price}>
                      Yes: ${(market.yesPrice || 0).toFixed(2)} | No: ${(market.noPrice || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className={styles.source}>{market.source}</div>
                  {market.category && <div className={styles.category}>{market.category}</div>}
                  {market.volume > 0 && <div className={styles.volume}>Vol: ${market.volume.toLocaleString()}</div>}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className={styles.howItWorks} id="how-it-works">
        <div className={styles.container}>
          <h2>How It Works (3 Steps)</h2>
          <div className={styles.howSteps}>
            <div className={styles.step}>
              <svg viewBox="0 0 24 24" fill="#2DD4BF">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <h3>Take the Challenge</h3>
              <p>Prove your edge in a demo account with live market data.</p>
            </div>
            <div className={styles.step}>
              <svg viewBox="0 0 24 24" fill="#1E3A8A">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
              <h3>Get Funded</h3>
              <p>Pass the rules, trade with PredictProp’s capital.</p>
            </div>
            <div className={styles.step}>
              <svg viewBox="0 0 24 24" fill="#2DD4BF">
                <path d="M11 4v2H8v14h8v-6h2v8H6V4h5zm7 2.3l-8-8L9.4.9l8 8 .6-.6zm-2-2l-1.4-1.4 4.3-4.3 1.4 1.4L16 4.3z"/>
              </svg>
              <h3>Earn Payouts</h3>
              <p>Keep up to 90% of profits, paid within 24 hours.</p>
            </div>
          </div>
        </div>
      </section>
      <section className={styles.features} id="features">
        <div className={styles.container}>
          <h2>Why PredictProp?</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <svg viewBox="0 0 24 24" fill="#2DD4BF">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
              </svg>
              <h3>Funded Trading</h3>
              <p>Trade Polymarket with up to $200k, keeping 80% of profits.</p>
            </div>
            <div className={styles.featureCard}>
              <svg viewBox="0 0 24 24" fill="#1E3A8A">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
              </svg>
              <h3>High-Yield Staking</h3>
              <p>Stake USDC for 10-20% APY, withdraw anytime with zk-proofs.</p>
            </div>
            <div className={styles.featureCard}>
              <svg viewBox="0 0 24 24" fill="#2DD4BF">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
              </svg>
              <h3>Real-Time Integrations</h3>
              <p>Growing Fast: Billions traded across Polymarket with advanced tools.</p>
            </div>
            <div className={styles.featureCard}>
              <svg viewBox="0 0 24 24" fill="#1E3A8A">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
              </svg>
              <h3>Referral Rewards</h3>
              <p>Earn 10% of trader fees or 5% of LP yields in USDC.</p>
            </div>
            <div className={styles.featureCard}>
              <svg viewBox="0 0 24 24" fill="#2DD4BF">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
              </svg>
              <h3>New Asset Class</h3>
              <p>Trade politics, sports, macro events.</p>
            </div>
            <div className={styles.featureCard}>
              <svg viewBox="0 0 24 24" fill="#1E3A8A">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
              </svg>
              <h3>Non-Correlated</h3>
              <p>Unaffected by stocks or crypto cycles.</p>
            </div>
          </div>
        </div>
      </section>
      <section className={styles.challengePlans} id="challenge-plans">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Choose Your Challenge Plan</h2>
            <p>Clear, fair rules designed for trader success and risk management.</p>
          </div>
          <div className={styles.evaluationToggle}>
            <button
              className={`${styles.toggleButton} ${evaluationType === 'one-phase' ? styles.active : ''}`}
              onClick={() => setEvaluationType('one-phase')}
            >
              One-Phase Evaluation
            </button>
            <button
              className={`${styles.toggleButton} ${evaluationType === 'two-phase' ? styles.active : ''}`}
              onClick={() => setEvaluationType('two-phase')}
            >
              Two-Phase Evaluation
            </button>
          </div>
          <div className={styles.plansGrid}>
            {challengePlans[evaluationType].map((plan, index) => (
              <div key={index} className={`${styles.planCard} ${index === 1 ? styles.featured : ''}`}>
                <div className={styles.planHeader}>
                  <h3>{plan.size}</h3>
                  <div className={styles.planPrice}>{plan.fee}</div>
                </div>
                <div className={styles.planFeatures}>
                  <div className={styles.featureItem}>
                    <span className={styles.featureLabel}>Profit Target</span>
                    <span className={styles.featureValue}>{plan.profitTarget}</span>
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureLabel}>Max Daily Loss</span>
                    <span className={styles.featureValue}>{plan.dailyLoss}</span>
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureLabel}>Max Drawdown</span>
                    <span className={styles.featureValue}>{plan.drawdown}</span>
                  </div>
                </div>
                <div className={styles.planFooter}>
                  <Link href="/traders">
                    <button className={styles.planButton}>{index === 1 ? 'Most Popular' : 'Select Plan'}</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.sectionFooter}>
            <Link href="/docs">
              <button className={`${styles.ctaButton} ${styles.secondary}`}>Explore Rules & FAQ</button>
            </Link>
          </div>
        </div>
      </section>
      <section className={styles.trust} id="trust">
        <div className={styles.container}>
          <h2>Built on Trusted Platforms</h2>
          <p>Secure, transparent, and powered by leading blockchain and prediction market tech.</p>
          <div className={styles.trustLogos}>
            <Image src="https://polygon.technology/images/polygon-logo.svg" alt="Polygon" width={120} height={40} />
            <Image src="https://polymarket.com/images/logo.svg" alt="Polymarket" width={120} height={40} />
            <Image src="https://privy.io/images/logo.svg" alt="Privy" width={120} height={40} />
          </div>
          <Link href="#waitlist">
            <button className={`${styles.ctaButton} ${styles.secondary}`}>Join the 2025 Waitlist</button>
          </Link>
        </div>
      </section>
    </>
  );
}