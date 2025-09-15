import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to get recent markets with timeout
    let data = [];
    let response;
    
    try {
      // Try main Polymarket API with shorter timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      response = await fetch('https://clob.polymarket.com/markets', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const clobData = await response.json();
        data = clobData.data || clobData;
        console.log('CLOB API data received:', data.length, 'markets');
      }
    } catch (error) {
      console.log('CLOB API failed, using fallback data:', error.message);
      // Don't throw error, just use fallback data
    }
    
    // Filter for recent markets (last 2 years) and prioritize active ones
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    const activeMarkets = data
      .filter(market => {
        const isNotArchived = !market.question.toLowerCase().includes('arch');
        const isActive = market.active === true;
        
        // Check if market was created within the last 2 years
        const marketDate = new Date(market.createdAt || market.end_date_iso);
        const isRecent = marketDate >= twoYearsAgo;
        
        // Look for markets that are active, not archived, and created recently
        return isActive && isNotArchived && isRecent;
      })
      .sort((a, b) => {
        // Sort by creation date, most recent first
        const aDate = new Date(a.createdAt || a.end_date_iso);
        const bDate = new Date(b.createdAt || b.end_date_iso);
        return bDate - aDate;
      })
      .slice(0, 8) // Limit to 8 markets
      .map(market => ({
        id: market.id,
        question: market.question,
        name: market.question,
        outcomes: market.outcomes ? JSON.parse(market.outcomes).map(outcome => ({
          name: outcome,
          price: market.outcomePrices ? JSON.parse(market.outcomePrices)[JSON.parse(market.outcomes).indexOf(outcome)] || 0 : 0,
        })) : [],
        active: market.active,
        end_date_iso: market.endDate,
        createdAt: market.createdAt,
        category: market.category,
        volume: market.volumeNum || 0,
        url: `https://polymarket.com/market/${market.slug}`,
      }));

    console.log('Active markets found:', activeMarkets.length);
    if (activeMarkets.length === 0) {
      console.log('No active markets found, using fallback data');
      // Return fallback data with current, relevant 2025 markets for continuous scrolling
      return NextResponse.json([
        {
          id: 'fallback-1',
          question: 'Will Bitcoin reach $150,000 by end of 2025?',
          name: 'Bitcoin $150K 2025',
          outcomes: [
            { name: 'Yes', price: 0.25 },
            { name: 'No', price: 0.75 }
          ],
          active: true,
          end_date_iso: '2025-12-31T23:59:59Z',
          url: 'https://polymarket.com/market/will-bitcoin-reach-150000-by-end-of-2025'
        },
        {
          id: 'fallback-2',
          question: 'Will the S&P 500 close above 6,000 by end of 2025?',
          name: 'S&P 500 6000 2025',
          outcomes: [
            { name: 'Yes', price: 0.40 },
            { name: 'No', price: 0.60 }
          ],
          active: true,
          end_date_iso: '2025-12-31T23:59:59Z',
          url: 'https://polymarket.com/market/will-sp500-close-above-6000-by-end-of-2025'
        },
        {
          id: 'fallback-3',
          question: 'Will there be a recession in 2025?',
          name: 'Recession 2025',
          outcomes: [
            { name: 'Yes', price: 0.30 },
            { name: 'No', price: 0.70 }
          ],
          active: true,
          end_date_iso: '2025-12-31T23:59:59Z',
          url: 'https://polymarket.com/market/will-there-be-a-recession-in-2025'
        },
        {
          id: 'fallback-4',
          question: 'Will the Fed cut rates by 100+ bps in 2025?',
          name: 'Fed Rate Cuts 2025',
          outcomes: [
            { name: 'Yes', price: 0.55 },
            { name: 'No', price: 0.45 }
          ],
          active: true,
          end_date_iso: '2025-12-31T23:59:59Z',
          url: 'https://polymarket.com/market/will-fed-cut-rates-by-100-bps-in-2025'
        },
        {
          id: 'fallback-5',
          question: 'Will AI stocks outperform the market in 2025?',
          name: 'AI Stocks 2025',
          outcomes: [
            { name: 'Yes', price: 0.60 },
            { name: 'No', price: 0.40 }
          ],
          active: true,
          end_date_iso: '2025-12-31T23:59:59Z',
          url: 'https://polymarket.com/market/will-ai-stocks-outperform-market-2025'
        },
        {
          id: 'fallback-6',
          question: 'Will Ethereum reach $10,000 by end of 2025?',
          name: 'Ethereum $10K 2025',
          outcomes: [
            { name: 'Yes', price: 0.35 },
            { name: 'No', price: 0.65 }
          ],
          active: true,
          end_date_iso: '2025-12-31T23:59:59Z',
          url: 'https://polymarket.com/market/will-ethereum-reach-10000-by-end-of-2025'
        },
        {
          id: 'fallback-7',
          question: 'Will the US election be decided by less than 5% margin?',
          name: 'US Election Margin 2024',
          outcomes: [
            { name: 'Yes', price: 0.45 },
            { name: 'No', price: 0.55 }
          ],
          active: true,
          end_date_iso: '2024-11-06T23:59:59Z',
          url: 'https://polymarket.com/market/will-us-election-be-decided-by-less-than-5-percent-margin'
        },
        {
          id: 'fallback-8',
          question: 'Will the housing market crash in 2025?',
          name: 'Housing Crash 2025',
          outcomes: [
            { name: 'Yes', price: 0.20 },
            { name: 'No', price: 0.80 }
          ],
          active: true,
          end_date_iso: '2025-12-31T23:59:59Z',
          url: 'https://polymarket.com/market/will-housing-market-crash-in-2025'
        }
      ]);
    }
    return NextResponse.json(activeMarkets);
  } catch (error) {
    console.error('Error fetching Polymarket data:', error);
    
    // Return fallback data with current, relevant 2025 markets for continuous scrolling
    return NextResponse.json([
      {
        id: 'fallback-1',
        question: 'Will Bitcoin reach $150,000 by end of 2025?',
        name: 'Bitcoin $150K 2025',
        outcomes: [
          { name: 'Yes', price: 0.25 },
          { name: 'No', price: 0.75 }
        ],
        active: true,
        end_date_iso: '2025-12-31T23:59:59Z',
        url: 'https://polymarket.com/market/will-bitcoin-reach-150000-by-end-of-2025'
      },
      {
        id: 'fallback-2',
        question: 'Will the S&P 500 close above 6,000 by end of 2025?',
        name: 'S&P 500 6000 2025',
        outcomes: [
          { name: 'Yes', price: 0.40 },
          { name: 'No', price: 0.60 }
        ],
        active: true,
        end_date_iso: '2025-12-31T23:59:59Z',
        url: 'https://polymarket.com/market/will-sp500-close-above-6000-by-end-of-2025'
      },
      {
        id: 'fallback-3',
        question: 'Will there be a recession in 2025?',
        name: 'Recession 2025',
        outcomes: [
          { name: 'Yes', price: 0.30 },
          { name: 'No', price: 0.70 }
        ],
        active: true,
        end_date_iso: '2025-12-31T23:59:59Z',
        url: 'https://polymarket.com/market/will-there-be-a-recession-in-2025'
      },
      {
        id: 'fallback-4',
        question: 'Will the Fed cut rates by 100+ bps in 2025?',
        name: 'Fed Rate Cuts 2025',
        outcomes: [
          { name: 'Yes', price: 0.55 },
          { name: 'No', price: 0.45 }
        ],
        active: true,
        end_date_iso: '2025-12-31T23:59:59Z',
        url: 'https://polymarket.com/market/will-fed-cut-rates-by-100-bps-in-2025'
      },
      {
        id: 'fallback-5',
        question: 'Will AI stocks outperform the market in 2025?',
        name: 'AI Stocks 2025',
        outcomes: [
          { name: 'Yes', price: 0.60 },
          { name: 'No', price: 0.40 }
        ],
        active: true,
        end_date_iso: '2025-12-31T23:59:59Z',
        url: 'https://polymarket.com/market/will-ai-stocks-outperform-market-2025'
      },
      {
        id: 'fallback-6',
        question: 'Will Ethereum reach $10,000 by end of 2025?',
        name: 'Ethereum $10K 2025',
        outcomes: [
          { name: 'Yes', price: 0.35 },
          { name: 'No', price: 0.65 }
        ],
        active: true,
        end_date_iso: '2025-12-31T23:59:59Z',
        url: 'https://polymarket.com/market/will-ethereum-reach-10000-by-end-of-2025'
      },
      {
        id: 'fallback-7',
        question: 'Will the US election be decided by less than 5% margin?',
        name: 'US Election Margin 2024',
        outcomes: [
          { name: 'Yes', price: 0.45 },
          { name: 'No', price: 0.55 }
        ],
        active: true,
        end_date_iso: '2024-11-06T23:59:59Z',
        url: 'https://polymarket.com/market/will-us-election-be-decided-by-less-than-5-percent-margin'
      },
      {
        id: 'fallback-8',
        question: 'Will the housing market crash in 2025?',
        name: 'Housing Crash 2025',
        outcomes: [
          { name: 'Yes', price: 0.20 },
          { name: 'No', price: 0.80 }
        ],
        active: true,
        end_date_iso: '2025-12-31T23:59:59Z',
        url: 'https://polymarket.com/market/will-housing-market-crash-in-2025'
      }
    ]);
  }
}
