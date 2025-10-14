'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import ChallengePlansTable from './components/ChallengePlansTable';
import styles from './styles/Home.module.css';

export default function Home() {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const marqueeRef = useRef(null);
  const [evaluationType, setEvaluationType] = useState('one-phase');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clickedCard, setClickedCard] = useState(null);

  const handleCardClick = (cardId) => {
    setClickedCard(cardId === clickedCard ? null : cardId);
    // Add a subtle animation effect
    setTimeout(() => setClickedCard(null), 1000);
  };

  // SWR fetcher function
  const fetcher = (url) => fetch(url).then((res) => res.json());
  
  // Fetch ticker markets via our API route to avoid CORS issues
  const { data: marketsData, error: marketsError, isLoading: marketsLoading } = useSWR(
    '/api/markets?ticker=true&limit=40',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      revalidateOnMount: true,
      dedupingInterval: 0
    }
  );

  // Extract markets array from the API response - via our API route
  const markets = marketsData?.markets || [];

  // Debug logging
  console.log('Homepage ticker data:', {
    marketsLoading,
    marketsError,
    marketsCount: markets.length,
    firstMarket: markets[0]
  });


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
            <span className={styles.titleGradient}>{t('hero.title')}</span>
            <span className={styles.titleAccent}>{t('hero.subtitle')}</span>
          </h1>
          <p className={styles.heroSubtitle}>
            {t('hero.tagline')} — get funded up to
            <span className={styles.amountHighlight}> $100,000</span>.
          </p>
          <div className={styles.cta}>
            <Link href="/traders">
              <button className={`${styles.ctaButton} ${styles.primary}`}>
                <span>{t('hero.startTrading')}</span>
                <svg className={styles.buttonIcon} viewBox="0 0 24 24">
                  <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
                </svg>
              </button>
            </Link>
            <Link href="#how-it-works">
              <button className={`${styles.ctaButton} ${styles.secondary}`}>
                <span>{t('hero.learnMore')}</span>
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
          {marketsLoading && <p className={styles.loadingMessage}>Loading markets...</p>}
          {marketsError && <p className={styles.errorMessage}>Error: {marketsError.message}</p>}

          {/* Always show marquee with data or placeholders */}
          <div className={styles.marqueeContainer}
               onMouseEnter={() => console.log('Container mouse enter')}
               onMouseLeave={() => console.log('Container mouse leave')}
               style={{ position: 'relative', zIndex: 100 }}>
            <div ref={marqueeRef} className={styles.marqueeContent}
                 onMouseEnter={() => console.log('Marquee mouse enter')}
                 onMouseLeave={() => console.log('Marquee mouse leave')}
                 style={{ position: 'relative', zIndex: 101 }}>
              {/* First set of ticker items */}
              {(markets.length > 0 ? markets : [1, 2, 3, 4, 5]).map((market, index) => {
                // If we have real market data
                if (markets.length > 0) {
                  return (
              <a
                key={`first-${index}`}
                href={`https://polymarket.com/event/${market.slug || market.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.tickerItem}
                style={{ position: 'relative', zIndex: 102 }}
                onClick={(e) => {
                  console.log('Market clicked:', market.title || market.question);
                  e.preventDefault();
                  window.open(`https://polymarket.com/event/${market.slug || market.id}`, '_blank');
                }}
              >
                <div className={styles.marketContent}>
                  <div className={styles.marketHeader}>
                    <h3 className={styles.marketTitle}>{market.title || market.question}</h3>
                    <div className={styles.marketSource}>
                      <span className={styles.sourceBadge}>Polymarket</span>
                    </div>
                  </div>
                  <div className={styles.marketData}>
                    <div className={styles.priceContainer}>
                      <div className={styles.priceItem}>
                        <span className={styles.priceLabel}>Yes Odds</span>
                        <span className={`${styles.priceValue} ${styles.yes}`}>${(market.yesPrice || 0.5).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className={styles.marketMeta}>
                      {market.endDate && (
                        <div className={styles.endDateTag}>Ends: {new Date(market.endDate).toLocaleDateString()}</div>
                      )}
                      {market.volume && (
                        <div className={styles.volumeTag}>Vol: ${(market.volume / 1000).toFixed(0)}k</div>
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
                  );
                } else {
                  // Placeholder item
                  return (
              <div
                key={`placeholder-${index}`}
                className={styles.tickerItem}
                style={{ position: 'relative', zIndex: 102 }}
              >
                <div className={styles.marketContent}>
                  <div className={styles.marketHeader}>
                    <h3 className={styles.marketTitle}>Loading Featured Events...</h3>
                    <div className={styles.marketSource}>
                      <span className={styles.sourceBadge}>Polymarket</span>
                    </div>
                  </div>
                  <div className={styles.marketData}>
                    <div className={styles.priceContainer}>
                      <div className={styles.priceItem}>
                        <span className={styles.priceLabel}>Yes Odds</span>
                        <span className={`${styles.priceValue} ${styles.yes}`}>$0.50</span>
                      </div>
                    </div>
                    <div className={styles.marketMeta}>
                      <div className={styles.endDateTag}>Loading...</div>
                      <div className={styles.volumeTag}>Featured</div>
                    </div>
                  </div>
                </div>
                <div className={styles.tickerArrow}>
                  <svg viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
                  );
                }
              })}

              {/* Duplicate set for seamless scrolling */}
              {(markets.length > 0 ? markets : [1, 2, 3, 4, 5]).map((market, index) => {
                // If we have real market data
                if (markets.length > 0) {
                  return (
              <a
                key={`second-${index}`}
                href={`https://polymarket.com/event/${market.slug || market.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.tickerItem}
                style={{ position: 'relative', zIndex: 102 }}
                onClick={(e) => {
                  console.log('Market clicked:', market.title || market.question);
                  e.preventDefault();
                  window.open(`https://polymarket.com/event/${market.slug || market.id}`, '_blank');
                }}
              >
                <div className={styles.marketContent}>
                  <div className={styles.marketHeader}>
                    <h3 className={styles.marketTitle}>{market.title || market.question}</h3>
                    <div className={styles.marketSource}>
                      <span className={styles.sourceBadge}>Polymarket</span>
                    </div>
                  </div>
                  <div className={styles.marketData}>
                    <div className={styles.priceContainer}>
                      <div className={styles.priceItem}>
                        <span className={styles.priceLabel}>Yes Odds</span>
                        <span className={`${styles.priceValue} ${styles.yes}`}>${(market.yesPrice || 0.5).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className={styles.marketMeta}>
                      {market.endDate && (
                        <div className={styles.endDateTag}>Ends: {new Date(market.endDate).toLocaleDateString()}</div>
                      )}
                      {market.volume && (
                        <div className={styles.volumeTag}>Vol: ${(market.volume / 1000).toFixed(0)}k</div>
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
                  );
                } else {
                  // Placeholder item
                  return (
              <div
                key={`placeholder-${index}`}
                className={styles.tickerItem}
                style={{ position: 'relative', zIndex: 102 }}
              >
                <div className={styles.marketContent}>
                  <div className={styles.marketHeader}>
                    <h3 className={styles.marketTitle}>Loading Featured Events...</h3>
                    <div className={styles.marketSource}>
                      <span className={styles.sourceBadge}>Polymarket</span>
                    </div>
                  </div>
                  <div className={styles.marketData}>
                    <div className={styles.priceContainer}>
                      <div className={styles.priceItem}>
                        <span className={styles.priceLabel}>Yes Odds</span>
                        <span className={`${styles.priceValue} ${styles.yes}`}>$0.50</span>
                      </div>
                    </div>
                    <div className={styles.marketMeta}>
                      <div className={styles.endDateTag}>Loading...</div>
                      <div className={styles.volumeTag}>Featured</div>
                    </div>
                  </div>
                </div>
                <div className={styles.tickerArrow}>
                  <svg viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
                  );
                }
              })}
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
                  <p>Pass the rules and start trading with PolyProp&apos;s capital up to $100,000.</p>
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
                  <h3>Keep 80% of profits (20% platform cut)</h3>
                  <p>Keep up to 80% of profits, paid within 24 hours via USDC.</p>
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
              <span>Why PolyProp</span>
            </div>
            <h2 className={styles.featuresTitle}>
              <span className={styles.titleGradient}>The Future of Prediction Trading</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
            {/* Funded Trading */}
            <div
              className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-md hover:shadow-lg hover:shadow-blue-400/30 transition-all duration-300 p-6 flex flex-col items-stretch min-h-[200px] md:min-h-[250px] cursor-pointer transform hover:-translate-y-2 hover:scale-105 hover:border-blue-400/50 ${
                clickedCard === 'funded-trading' ? 'animate-pulse shadow-2xl shadow-blue-400/50 border-blue-400/70' : ''
              }`}
              onClick={() => handleCardClick('funded-trading')}
            >
              <div className="flex flex-col items-center text-center flex-1">
                <div className={`mt-2 mb-4 transition-transform duration-300 ${clickedCard === 'funded-trading' ? 'scale-110' : ''}`}>
                  <svg className="w-12 h-12 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-xl sm:text-2xl text-white mb-3">Funded Trading</h3>
                <p className="text-sm sm:text-base lg:text-lg leading-6 sm:leading-7 text-gray-300 flex-1">
                  Trade with up to $100k, keeping 80% of profits.
                </p>
                <div className="mt-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">$100K</div>
                  <div className="text-sm text-gray-400">Max Capital</div>
                </div>
              </div>
            </div>

            {/* High-Yield */}
            <div
              className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-md hover:shadow-lg hover:shadow-green-400/30 transition-all duration-300 p-6 flex flex-col items-stretch min-h-[200px] md:min-h-[250px] cursor-pointer transform hover:-translate-y-2 hover:scale-105 hover:border-green-400/50 ${
                clickedCard === 'high-yield' ? 'animate-pulse shadow-2xl shadow-green-400/50 border-green-400/70' : ''
              }`}
              onClick={() => handleCardClick('high-yield')}
            >
              <div className="flex flex-col items-center text-center flex-1">
                <div className={`mt-2 mb-4 transition-transform duration-300 ${clickedCard === 'high-yield' ? 'scale-110' : ''}`}>
                  <svg className="w-12 h-12 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-xl sm:text-2xl text-white mb-3">High-Yield</h3>
                <p className="text-sm sm:text-base lg:text-lg leading-6 sm:leading-7 text-gray-300 flex-1">
                  Stake USDC for 10-20% APY, withdraw anytime.
                </p>
                <div className="mt-4 text-center">
                  <div className="text-2xl font-bold text-green-400">20%</div>
                  <div className="text-sm text-gray-400">Max APY</div>
                </div>
              </div>
            </div>

            {/* Real Time */}
            <div
              className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-md hover:shadow-lg hover:shadow-purple-400/30 transition-all duration-300 p-6 flex flex-col items-stretch min-h-[200px] md:min-h-[250px] cursor-pointer transform hover:-translate-y-2 hover:scale-105 hover:border-purple-400/50 ${
                clickedCard === 'real-time' ? 'animate-pulse shadow-2xl shadow-purple-400/50 border-purple-400/70' : ''
              }`}
              onClick={() => handleCardClick('real-time')}
            >
              <div className="flex flex-col items-center text-center flex-1">
                <div className={`mt-2 mb-4 transition-transform duration-300 ${clickedCard === 'real-time' ? 'scale-110' : ''}`}>
                  <svg className="w-12 h-12 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-xl sm:text-2xl text-white mb-3">Real Time</h3>
                <p className="text-sm sm:text-base lg:text-lg leading-6 sm:leading-7 text-gray-300 flex-1">
                  Growing Fast: Billions traded across Polymarket with advanced tools.
                </p>
                <div className="mt-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">$2B+</div>
                  <div className="text-sm text-gray-400">Volume</div>
                </div>
              </div>
            </div>

            {/* Referrals */}
            <div
              className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-md hover:shadow-lg hover:shadow-yellow-400/30 transition-all duration-300 p-6 flex flex-col items-stretch min-h-[200px] md:min-h-[250px] cursor-pointer transform hover:-translate-y-2 hover:scale-105 hover:border-yellow-400/50 ${
                clickedCard === 'referrals' ? 'animate-pulse shadow-2xl shadow-yellow-400/50 border-yellow-400/70' : ''
              }`}
              onClick={() => handleCardClick('referrals')}
            >
              <div className="flex flex-col items-center text-center flex-1">
                <div className={`mt-2 mb-4 transition-transform duration-300 ${clickedCard === 'referrals' ? 'scale-110' : ''}`}>
                  <svg className="w-12 h-12 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-xl sm:text-2xl text-white mb-3">Referrals</h3>
                <p className="text-sm sm:text-base lg:text-lg leading-6 sm:leading-7 text-gray-300 flex-1">
                  Earn 10% of trader fees or 5% of LP yields in USDC.
                </p>
                <div className="mt-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">10%</div>
                  <div className="text-sm text-gray-400">Commission</div>
                </div>
              </div>
            </div>

            {/* Instant Payouts */}
            <div
              className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-md hover:shadow-lg hover:shadow-cyan-400/30 transition-all duration-300 p-6 flex flex-col items-stretch min-h-[200px] md:min-h-[250px] cursor-pointer transform hover:-translate-y-2 hover:scale-105 hover:border-cyan-400/50 ${
                clickedCard === 'instant-payouts' ? 'animate-pulse shadow-2xl shadow-cyan-400/50 border-cyan-400/70' : ''
              }`}
              onClick={() => handleCardClick('instant-payouts')}
            >
              <div className="flex flex-col items-center text-center flex-1">
                <div className={`mt-2 mb-4 transition-transform duration-300 ${clickedCard === 'instant-payouts' ? 'scale-110' : ''}`}>
                  <svg className="w-12 h-12 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-xl sm:text-2xl text-white mb-3">Instant Payouts</h3>
                <p className="text-sm sm:text-base lg:text-lg leading-6 sm:leading-7 text-gray-300 flex-1">
                  Get paid immediately when you win trades.
                </p>
                <div className="mt-4 text-center">
                  <div className="text-2xl font-bold text-cyan-400">24h</div>
                  <div className="text-sm text-gray-400">Payout</div>
                </div>
              </div>
            </div>

            {/* Non-correlated */}
            <div
              className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-md hover:shadow-lg hover:shadow-pink-400/30 transition-all duration-300 p-6 flex flex-col items-stretch min-h-[200px] md:min-h-[250px] cursor-pointer transform hover:-translate-y-2 hover:scale-105 hover:border-pink-400/50 ${
                clickedCard === 'non-correlated' ? 'animate-pulse shadow-2xl shadow-pink-400/50 border-pink-400/70' : ''
              }`}
              onClick={() => handleCardClick('non-correlated')}
            >
              <div className="flex flex-col items-center text-center flex-1">
                <div className={`mt-2 mb-4 transition-transform duration-300 ${clickedCard === 'non-correlated' ? 'scale-110' : ''}`}>
                  <svg className="w-12 h-12 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-xl sm:text-2xl text-white mb-3">Non-correlated</h3>
                <p className="text-sm sm:text-base lg:text-lg leading-6 sm:leading-7 text-gray-300 flex-1">
                  Trade politics, sports, macro events & more unaffected by stocks or crypto.
                </p>
                <div className="mt-4 text-center">
                  <div className="text-2xl font-bold text-pink-400">∞</div>
                  <div className="text-sm text-gray-400">Markets</div>
                </div>
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
          <ChallengePlansTable />
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
            <Image src="/Polygon_Primary_Light.svg" alt="Polygon" width={120} height={40} />
            <Image src="/polymarket.png" alt="Polymarket" width={120} height={40} />
            <Image src="/privy_coral.png" alt="Privy" width={120} height={40} />
          </div>
          <Link href="#waitlist">
            <button className={`${styles.ctaButton} ${styles.secondary}`}>Join the Waitlist</button>
          </Link>
        </div>
      </section>
    </>
  );
}