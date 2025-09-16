'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import styles from './styles/Home.module.css';

export default function Home() {
  const canvasRef = useRef(null);
  const marqueeRef = useRef(null);
  const [markets, setMarkets] = useState([
    { title: 'Will Bitcoin reach $150,000 by end of 2025?', yesPrice: 0.25, noPrice: 0.75, source: 'Polymarket', url: 'https://polymarket.com' },
    { title: 'Will the S&P 500 close above 6,000 by end of 2025?', yesPrice: 0.40, noPrice: 0.60, source: 'Polymarket', url: 'https://polymarket.com' },
    { title: 'Will there be a recession in 2025?', yesPrice: 0.30, noPrice: 0.70, source: 'Polymarket', url: 'https://polymarket.com' },
    { title: 'Will the Fed cut rates by 100+ bps in 2025?', yesPrice: 0.55, noPrice: 0.45, source: 'Polymarket', url: 'https://polymarket.com' },
    { title: 'Will AI stocks outperform the market in 2025?', yesPrice: 0.60, noPrice: 0.40, source: 'Polymarket', url: 'https://polymarket.com' },
    { title: 'Will Ethereum reach $10,000 by end of 2025?', yesPrice: 0.35, noPrice: 0.65, source: 'Polymarket', url: 'https://polymarket.com' },
    { title: 'Will the US election be decided by less than 5% margin?', yesPrice: 0.45, noPrice: 0.55, source: 'Polymarket', url: 'https://polymarket.com' },
    { title: 'Will the housing market crash in 2025?', yesPrice: 0.20, noPrice: 0.80, source: 'Polymarket', url: 'https://polymarket.com' }
  ]);
  const [evaluationType, setEvaluationType] = useState('one-phase');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch active markets from Polymarket API
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch from our internal API route (which proxies to Polymarket)
        const polymarketResponse = await axios.get('/api/polymarket', {
          timeout: 5000 // Reduced timeout to match API route
        });
        
        console.log('Polymarket API response:', polymarketResponse.data);
        
        const polymarketMarkets = Array.isArray(polymarketResponse.data)
          ? polymarketResponse.data.slice(0, 10).map(market => {
              // Extract prices from outcomes array
              let yesPrice = 0.5;
              let noPrice = 0.5;
              
              if (market.outcomes && Array.isArray(market.outcomes) && market.outcomes.length >= 2) {
                yesPrice = market.outcomes[0].price || 0.5;
                noPrice = market.outcomes[1].price || 0.5;
              }
              
              return {
                title: market.question || market.name || 'Untitled Market',
                yesPrice: yesPrice,
                noPrice: noPrice,
                source: 'Polymarket',
                url: market.url,
                category: market.category || 'General',
                volume: market.volume || 0,
                liquidity: market.liquidity || 0,
                endDate: market.end_date_iso,
                active: market.active
              };
            })
          : [];

        setMarkets(polymarketMarkets.length > 0 ? polymarketMarkets : [
          { title: 'Will Bitcoin reach $150,000 by end of 2025?', yesPrice: 0.25, noPrice: 0.75, source: 'Polymarket', url: 'https://polymarket.com' },
          { title: 'Will the S&P 500 close above 6,000 by end of 2025?', yesPrice: 0.40, noPrice: 0.60, source: 'Polymarket', url: 'https://polymarket.com' },
          { title: 'Will there be a recession in 2025?', yesPrice: 0.30, noPrice: 0.70, source: 'Polymarket', url: 'https://polymarket.com' },
          { title: 'Will the Fed cut rates by 100+ bps in 2025?', yesPrice: 0.55, noPrice: 0.45, source: 'Polymarket', url: 'https://polymarket.com' },
          { title: 'Will AI stocks outperform the market in 2025?', yesPrice: 0.60, noPrice: 0.40, source: 'Polymarket', url: 'https://polymarket.com' },
          { title: 'Will Ethereum reach $10,000 by end of 2025?', yesPrice: 0.35, noPrice: 0.65, source: 'Polymarket', url: 'https://polymarket.com' },
          { title: 'Will the US election be decided by less than 5% margin?', yesPrice: 0.45, noPrice: 0.55, source: 'Polymarket', url: 'https://polymarket.com' },
          { title: 'Will the housing market crash in 2025?', yesPrice: 0.20, noPrice: 0.80, source: 'Polymarket', url: 'https://polymarket.com' }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching markets from Polymarket API:', error);
        console.error('Error details:', error.message, error.response?.data);
        setError(error.message);
        setMarkets([
          { title: 'Will Bitcoin reach $150,000 by end of 2025?', yesPrice: 0.25, noPrice: 0.75, source: 'Polymarket', url: 'https://polymarket.com' },
          { title: 'Will the S&P 500 close above 6,000 by end of 2025?', yesPrice: 0.40, noPrice: 0.60, source: 'Polymarket', url: 'https://polymarket.com' },
          { title: 'Will there be a recession in 2025?', yesPrice: 0.30, noPrice: 0.70, source: 'Polymarket', url: 'https://polymarket.com' }
        ]);
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  // Add hover pause functionality for marquee
  useEffect(() => {
    const marqueeElement = marqueeRef.current;
    const containerElement = marqueeElement?.parentElement;
    
    if (!marqueeElement || !containerElement) return;

    const handleMouseEnter = () => {
      console.log('Mouse entered ticker - pausing animation');
      marqueeElement.style.animationPlayState = 'paused';
    };

    const handleMouseLeave = () => {
      console.log('Mouse left ticker - resuming animation');
      marqueeElement.style.animationPlayState = 'running';
    };

    // Add listeners to both the container and the marquee content
    containerElement.addEventListener('mouseenter', handleMouseEnter);
    containerElement.addEventListener('mouseleave', handleMouseLeave);
    marqueeElement.addEventListener('mouseenter', handleMouseEnter);
    marqueeElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      containerElement.removeEventListener('mouseenter', handleMouseEnter);
      containerElement.removeEventListener('mouseleave', handleMouseLeave);
      marqueeElement.removeEventListener('mouseenter', handleMouseEnter);
      marqueeElement.removeEventListener('mouseleave', handleMouseLeave);
    };
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
        <div className={styles.heroBackground}>
          <div className={styles.heroGradient}></div>
          <div className={styles.heroPattern}></div>
          <div className={styles.heroGlow}></div>
        </div>
        <div className={`${styles.heroContent} ${styles.container}`}>
          <div className={styles.heroBadge}>
            <span className={styles.badgeIcon}>🚀</span>
            <span>Live Beta launch</span>
          </div>
          <h1 className={styles.heroTitle}>
            <span className={styles.titleGradient}>Trade Prediction Markets</span>
            <span className={styles.titleAccent}>with Funded Capital</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Trade politics, sports, economics & more — get funded up to 
            <span className={styles.amountHighlight}> $100,000</span>.
          </p>
          <div className={styles.cta}>
            <Link href="/traders">
              <button className={`${styles.ctaButton} ${styles.primary}`}>
                <span>Start Challenge</span>
                <svg className={styles.buttonIcon} viewBox="0 0 24 24">
                  <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
                </svg>
              </button>
            </Link>
            <Link href="#how-it-works">
              <button className={`${styles.ctaButton} ${styles.secondary}`}>
                <span>Learn How It Works</span>
                <svg className={styles.buttonIcon} viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </button>
            </Link>
            <Link href="/lps">
              <button className={`${styles.ctaButton} ${styles.tertiary}`}>
                <span>Stake USDC</span>
                <svg className={styles.buttonIcon} viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
            </Link>
          </div>
          <div className={styles.heroScroll}>
            <div className={styles.scrollIndicator}>
              <div className={styles.scrollLine}></div>
            </div>
          </div>
        </div>
      </section>
      <section className={styles.marketTicker}>
        <div className={styles.tickerBackground}>
          <div className={styles.tickerPattern}></div>
        </div>
        <div className={styles.container}>
          <div className={styles.tickerHeader}>
            <div className={styles.tickerTitle}>
              <div className={styles.titleIcon}>📊</div>
              <h2>Live Prediction Markets</h2>
              <div className={styles.liveIndicator}>
                <div className={styles.liveDot}></div>
                <span>LIVE</span>
              </div>
            </div>
            <p className={styles.tickerSubtitle}>Real-time market data from leading prediction platforms</p>
          </div>
          {markets.length === 0 && <p className={styles.loadingMessage}>Loading markets...</p>}
          {error && <p className={styles.errorMessage}>Error: {error}</p>}
          
          <div className={styles.marqueeContainer} 
               onMouseEnter={() => console.log('Container mouse enter')}
               onMouseLeave={() => console.log('Container mouse leave')}
               style={{ position: 'relative', zIndex: 100 }}>
            <div ref={marqueeRef} className={styles.marqueeContent}
                 onMouseEnter={() => console.log('Marquee mouse enter')}
                 onMouseLeave={() => console.log('Marquee mouse leave')}
                 style={{ position: 'relative', zIndex: 101 }}>
              {markets.map((market, index) => (
                <a 
                  key={index} 
                  href={market.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.tickerItem}
                  style={{ position: 'relative', zIndex: 102 }}
                  onClick={(e) => {
                    console.log('Market clicked:', market.title, market.url);
                    e.preventDefault();
                    window.open(market.url, '_blank');
                  }}
                >
                  <div className={styles.marketContent}>
                    <div className={styles.marketHeader}>
                      <h3 className={styles.marketTitle}>{market.title}</h3>
                      <div className={styles.marketSource}>
                        <span className={styles.sourceBadge}>{market.source}</span>
                      </div>
                    </div>
                    <div className={styles.marketData}>
                      <div className={styles.priceContainer}>
                        <div className={styles.priceItem}>
                          <span className={styles.priceLabel}>Yes</span>
                          <span className={`${styles.priceValue} ${styles.yes}`}>${(market.yesPrice || 0).toFixed(2)}</span>
                        </div>
                        <div className={styles.priceDivider}></div>
                        <div className={styles.priceItem}>
                          <span className={styles.priceLabel}>No</span>
                          <span className={`${styles.priceValue} ${styles.no}`}>${(market.noPrice || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className={styles.marketMeta}>
                        {market.category && (
                          <div className={styles.categoryTag}>{market.category}</div>
                        )}
                        {market.volume > 0 && (
                          <div className={styles.volumeTag}>Vol: ${market.volume.toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.tickerArrow}>
                    <svg viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className={styles.howItWorks} id="how-it-works">
        <div className={styles.howItWorksBackground}>
          <div className={styles.howItWorksGradient}></div>
          <div className={styles.howItWorksPattern}></div>
          <div className={styles.howItWorksGlow}></div>
        </div>
        <div className={styles.container}>
          <div className={styles.howItWorksHeader}>
            <h2 className={styles.howItWorksTitle}>
              <span className={styles.titleGradient}>How It Works</span>
            </h2>
          </div>
          
          <div className={styles.timelineContainer}>
            <div className={styles.timelineLine}></div>
            <div className={styles.timelineSteps}>
              <div className={`${styles.timelineStep} ${styles.stepActive}`}>
                <div className={styles.stepNumber}>
                  <span>01</span>
                  <div className={styles.stepProgress}></div>
                </div>
                <div className={styles.stepContent}>
                  <div className={styles.stepIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <div className={styles.stepGlow}></div>
                  </div>
                  <h3>Take the Challenge</h3>
                  <p>Prove your edge in a demo account with live market data from Polymarket and Kalshi.</p>
                  <div className={styles.stepMeta}>
                    <span className={styles.stepDuration}>2-30 days</span>
                    <span className={styles.stepDifficulty}>Easy</span>
                  </div>
                </div>
              </div>
              
              <div className={`${styles.timelineStep} ${styles.stepActive}`}>
                <div className={styles.stepNumber}>
                  <span>02</span>
                  <div className={styles.stepProgress}></div>
                </div>
                <div className={styles.stepContent}>
                  <div className={styles.stepIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    </svg>
                    <div className={styles.stepGlow}></div>
                  </div>
                  <h3>Get Funded</h3>
                  <p>Pass the rules and start trading with PredictProp's capital up to $100,000.</p>
                  <div className={styles.stepMeta}>
                    <span className={styles.stepDuration}>Instant</span>
                    <span className={styles.stepDifficulty}>Automatic</span>
                  </div>
                </div>
              </div>
              
              <div className={`${styles.timelineStep} ${styles.stepActive}`}>
                <div className={styles.stepNumber}>
                  <span>03</span>
                  <div className={styles.stepProgress}></div>
                </div>
                <div className={styles.stepContent}>
                  <div className={styles.stepIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11 4v2H8v14h8v-6h2v8H6V4h5zm7 2.3l-8-8L9.4.9l8 8 .6-.6zm-2-2l-1.4-1.4 4.3-4.3 1.4 1.4L16 4.3z"/>
                    </svg>
                    <div className={styles.stepGlow}></div>
                  </div>
                  <h3>Earn Payouts</h3>
                  <p>Keep up to 90% of profits, paid within 24 hours via USDC.</p>
                  <div className={styles.stepMeta}>
                    <span className={styles.stepDuration}>24 hours</span>
                    <span className={styles.stepDifficulty}>Guaranteed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className={styles.features} id="features">
        <div className={styles.featuresBackground}>
          <div className={styles.featuresGradient}></div>
          <div className={styles.featuresPattern}></div>
          <div className={styles.featuresParticles}></div>
          <div className={styles.featuresGlow}></div>
        </div>
        <div className={styles.container}>
          <div className={styles.featuresHeader}>
            <div className={styles.sectionBadge}>
              <span className={styles.badgeIcon}>✨</span>
              <span>Why PredictProp</span>
            </div>
            <h2 className={styles.featuresTitle}>
              <span className={styles.titleGradient}>The Future of Prediction Trading</span>
            </h2>
          </div>
          
          <div className={styles.hexagonGrid}>
            <div className={styles.hexagonRow}>
              <div className={`${styles.hexagonCard} ${styles.hexagonPrimary}`}>
                <div className={styles.hexagonContent}>
                  <div className={styles.hexagonIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                    </svg>
                    <div className={styles.hexagonGlow}></div>
                  </div>
                  <h3>Funded Trading</h3>
                  <p>Trade with up to $100k, keeping 80% of profits.</p>
                  <div className={styles.hexagonStats}>
                    <span className={styles.statValue}>$100K</span>
                    <span className={styles.statLabel}>Max Capital</span>
                  </div>
                </div>
                <div className={styles.hexagonBorder}></div>
              </div>
              
              <div className={`${styles.hexagonCard} ${styles.hexagonSecondary}`}>
                <div className={styles.hexagonContent}>
                  <div className={styles.hexagonIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                    </svg>
                    <div className={styles.hexagonGlow}></div>
                  </div>
                  <h3>High-Yield Staking</h3>
                  <p>Stake USDC for 10-20% APY, withdraw anytime with zk-proofs.</p>
                  <div className={styles.hexagonStats}>
                    <span className={styles.statValue}>20%</span>
                    <span className={styles.statLabel}>Max APY</span>
                  </div>
                </div>
                <div className={styles.hexagonBorder}></div>
              </div>
              
              <div className={`${styles.hexagonCard} ${styles.hexagonTertiary}`}>
                <div className={styles.hexagonContent}>
                  <div className={styles.hexagonIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                    </svg>
                    <div className={styles.hexagonGlow}></div>
                  </div>
                  <h3>Real-Time Integrations</h3>
                  <p>Growing Fast: Billions traded across Polymarket with advanced tools.</p>
                  <div className={styles.hexagonStats}>
                    <span className={styles.statValue}>$2B+</span>
                    <span className={styles.statLabel}>Volume</span>
                  </div>
                </div>
                <div className={styles.hexagonBorder}></div>
              </div>
            </div>
            
            <div className={styles.hexagonRow}>
              <div className={`${styles.hexagonCard} ${styles.hexagonSecondary}`}>
                <div className={styles.hexagonContent}>
                  <div className={styles.hexagonIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                    </svg>
                    <div className={styles.hexagonGlow}></div>
                  </div>
                  <h3>Referral Rewards</h3>
                  <p>Earn 10% of trader fees or 5% of LP yields in USDC.</p>
                  <div className={styles.hexagonStats}>
                    <span className={styles.statValue}>10%</span>
                    <span className={styles.statLabel}>Commission</span>
                  </div>
                </div>
                <div className={styles.hexagonBorder}></div>
              </div>
              
              <div className={`${styles.hexagonCard} ${styles.hexagonPrimary}`}>
                <div className={styles.hexagonContent}>
                  <div className={styles.hexagonIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                    </svg>
                    <div className={styles.hexagonGlow}></div>
                  </div>
                  <h3>Instant Payouts</h3>
                  <p>Get paid immediately when you win trades.</p>
                  <div className={styles.hexagonStats}>
                    <span className={styles.statValue}>24h</span>
                    <span className={styles.statLabel}>Payout</span>
                  </div>
                </div>
                <div className={styles.hexagonBorder}></div>
              </div>
              
              <div className={`${styles.hexagonCard} ${styles.hexagonTertiary}`}>
                <div className={styles.hexagonContent}>
                  <div className={styles.hexagonIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                    </svg>
                    <div className={styles.hexagonGlow}></div>
                  </div>
                  <h3>Non-correlated Asset</h3>
                  <p>Trade politics, sports, macro events & more unaffected by stocks or crypto</p>
                  <div className={styles.hexagonStats}>
                    <span className={styles.statValue}>∞</span>
                    <span className={styles.statLabel}>Markets</span>
                  </div>
                </div>
                <div className={styles.hexagonBorder}></div>
              </div>
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
            <button className={`${styles.ctaButton} ${styles.secondary}`}>Join the Waitlist</button>
          </Link>
        </div>
      </section>
    </>
  );
}