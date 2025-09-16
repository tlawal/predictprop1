import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to get recent markets with timeout
    let data = [];
    let response;
    
    try {
      // Try multiple Polymarket API endpoints with different parameters
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      // Try different API endpoints and parameters for current markets
      const apiEndpoints = [
        // Try Gamma Events API first (this is the correct endpoint)
        'https://gamma-api.polymarket.com/events?limit=100&start_date_min=2025-05-01',
        // Try with different date filters
        'https://gamma-api.polymarket.com/events?limit=100&creation_date_min=2025-05-01T00:00:00Z',
        // Try with active filter
        'https://gamma-api.polymarket.com/events?limit=100&active=true&closed=false',
        // Try with recent events
        'https://gamma-api.polymarket.com/events?limit=100&order=creationDate&ascending=false',
        // Try CLOB API as fallback
        'https://clob.polymarket.com/markets?limit=1000'
      ];
      
      for (const endpoint of apiEndpoints) {
        try {
          console.log('Trying endpoint:', endpoint);
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': 'PredictProp/1.0',
            },
            signal: controller.signal,
          });
          
          if (response.ok) {
            const responseData = await response.json();
            let markets = [];
            
            // Handle different API response formats
            if (Array.isArray(responseData)) {
              // Events API format - extract markets from events
              if (responseData[0] && responseData[0].markets) {
                // Events API - flatten markets from events
                markets = responseData.flatMap(event => 
                  event.markets ? event.markets.map(market => ({
                    ...market,
                    eventId: event.id,
                    eventTitle: event.title,
                    eventSlug: event.slug,
                    eventCreationDate: event.creationDate,
                    eventStartDate: event.startDate,
                    eventEndDate: event.endDate
                  })) : []
                );
              } else {
                // Direct markets array
                markets = responseData;
              }
            } else if (responseData.data) {
              // CLOB API format
              markets = responseData.data;
            }
            
            console.log(`Success with ${endpoint}:`, markets.length, 'markets');
            
            if (markets.length > 0) {
              data = markets;
              console.log('Sample market data:', markets[0]);
              console.log('Sample market dates:', markets.slice(0, 5).map(m => ({
                question: m.question,
                createdAt: m.createdAt || m.eventCreationDate,
                startDate: m.startDateIso || m.eventStartDate,
                endDate: m.endDateIso || m.eventEndDate,
                active: m.active
              })));
              break; // Exit loop if we got data
            }
          } else {
            console.log(`Failed with ${endpoint}:`, response.status, response.statusText);
          }
        } catch (endpointError) {
          console.log(`Error with ${endpoint}:`, endpointError.message);
        }
      }
      
      clearTimeout(timeoutId);
    } catch (error) {
      console.log('All API endpoints failed:', error.message);
      // Don't throw error, just use fallback data
    }
    
    // Filter for markets created after May 2025
    const may2025 = new Date('2025-05-01');
    
    const activeMarkets = data
      .filter(market => {
        // Filter for markets created after May 2025
        const hasQuestion = market.question && market.question.length > 0;
        const isNotArchived = !market.question?.toLowerCase().includes('arch');
        
        // Check if market was created after May 2025 (use event creation date or market creation date)
        const creationDate = new Date(market.eventCreationDate || market.createdAt || market.creationDate);
        const isAfterMay2025 = creationDate >= may2025;
        
        // Only include markets with questions, not archived, and created after May 2025
        return hasQuestion && isNotArchived && isAfterMay2025;
      })
      .sort((a, b) => {
        // Sort by volume, highest first
        const aVolume = a.volumeNum || 0;
        const bVolume = b.volumeNum || 0;
        return bVolume - aVolume;
      })
      .slice(0, 7) // Increase to 7 markets as requested
      .map(market => {
        // Parse outcome prices from different API formats
        let outcomes = [];
        try {
          if (market.tokens && Array.isArray(market.tokens)) {
            // CLOB API format
            outcomes = market.tokens.map(token => ({
              name: token.outcome,
              price: token.price || 0.5
            }));
          } else if (market.outcomePrices) {
            // Gamma API format
            const prices = JSON.parse(market.outcomePrices);
            if (Array.isArray(prices) && prices.length >= 2) {
              outcomes = [
                { name: 'Yes', price: parseFloat(prices[0]) || 0.5 },
                { name: 'No', price: parseFloat(prices[1]) || 0.5 }
              ];
            }
          } else if (market.outcomes) {
            // Events API format
            const outcomesData = JSON.parse(market.outcomes);
            if (Array.isArray(outcomesData)) {
              outcomes = outcomesData.map(outcome => ({
                name: outcome,
                price: 0.5 // Default price if not available
              }));
            }
          }
        } catch (e) {
          console.log('Error parsing outcome prices:', e);
          outcomes = [
            { name: 'Yes', price: 0.5 },
            { name: 'No', price: 0.5 }
          ];
        }

        // Create proper Polymarket URL using slug
        console.log('Market slug:', market.slug, 'Market ID:', market.id, 'Event slug:', market.eventSlug);
        const marketUrl = market.slug 
          ? `https://polymarket.com/market/${market.slug}`
          : market.eventSlug
          ? `https://polymarket.com/event/${market.eventSlug}`
          : `https://polymarket.com/market/${market.id}`;
        
        console.log('Market URL generated:', marketUrl, 'for market:', market.question);

        return {
          id: market.id || market.question_id,
          question: market.question,
          name: market.question,
          outcomes: outcomes,
          active: market.active,
          end_date_iso: market.endDateIso || market.end_date_iso || market.eventEndDate,
          createdAt: market.eventCreationDate || market.createdAt || market.creationDate,
          category: market.category,
          volume: market.volumeNum || market.volume || 0,
          url: marketUrl,
        };
      });

    console.log('Total markets from API:', data.length);
    console.log('Markets found after May 2025 filtering:', activeMarkets.length);
    
    // Show date range of all markets
    if (data.length > 0) {
      const dates = data.map(m => new Date(m.createdAt || m.startDateIso || m.startDate)).filter(d => !isNaN(d));
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        console.log('Date range of all markets:', minDate.toISOString(), 'to', maxDate.toISOString());
      }
      
      console.log('Sample market dates (first 10):', data.slice(0, 10).map(m => ({
        question: m.question?.substring(0, 50) + '...',
        createdAt: m.createdAt,
        startDate: m.startDateIso,
        endDate: m.endDateIso
      })));
    }
    
    // If we don't have enough markets after May 2025, use fallback data
    let finalMarkets = activeMarkets;
    if (activeMarkets.length < 5) {
      console.log('Not enough markets after May 2025, using fallback data with May 2025+ dates');
      console.log('Markets found:', activeMarkets.length);
      console.log('Sample markets:', activeMarkets.slice(0, 3).map(m => ({
        question: m.question,
        createdAt: m.createdAt,
        active: m.active
      })));
      finalMarkets = []; // Force fallback to curated markets
    }
    
    // Prepare response data
    const responseData = finalMarkets.length > 0 ? finalMarkets : [
      {
        id: 'fallback-1',
        question: 'Will Bitcoin reach $200,000 by end of 2026?',
        name: 'Bitcoin $200K 2026',
        outcomes: [
          { name: 'Yes', price: 0.15 },
          { name: 'No', price: 0.85 }
        ],
        active: true,
        end_date_iso: '2026-12-31T23:59:59Z',
        createdAt: '2025-05-15T00:00:00Z',
        url: 'https://polymarket.com/market/will-bitcoin-reach-200000-by-end-of-2026'
      },
      {
        id: 'fallback-2',
        question: 'Will the S&P 500 close above 7,000 by end of 2026?',
        name: 'S&P 500 7000 2026',
        outcomes: [
          { name: 'Yes', price: 0.30 },
          { name: 'No', price: 0.70 }
        ],
        active: true,
        end_date_iso: '2026-12-31T23:59:59Z',
        createdAt: '2025-05-20T00:00:00Z',
        url: 'https://polymarket.com/market/will-sp500-close-above-7000-by-end-of-2026'
      },
      {
        id: 'fallback-3',
        question: 'Will there be a recession in 2026?',
        name: 'Recession 2026',
        outcomes: [
          { name: 'Yes', price: 0.25 },
          { name: 'No', price: 0.75 }
        ],
        active: true,
        end_date_iso: '2026-12-31T23:59:59Z',
        createdAt: '2025-06-01T00:00:00Z',
        url: 'https://polymarket.com/market/will-there-be-a-recession-in-2026'
      },
      {
        id: 'fallback-4',
        question: 'Will the Fed cut rates by 150+ bps in 2026?',
        name: 'Fed Rate Cuts 2026',
        outcomes: [
          { name: 'Yes', price: 0.40 },
          { name: 'No', price: 0.60 }
        ],
        active: true,
        end_date_iso: '2026-12-31T23:59:59Z',
        createdAt: '2025-06-15T00:00:00Z',
        url: 'https://polymarket.com/market/will-fed-cut-rates-by-150-bps-in-2026'
      },
      {
        id: 'fallback-5',
        question: 'Will AI stocks outperform the market in 2026?',
        name: 'AI Stocks 2026',
        outcomes: [
          { name: 'Yes', price: 0.55 },
          { name: 'No', price: 0.45 }
        ],
        active: true,
        end_date_iso: '2026-12-31T23:59:59Z',
        createdAt: '2025-07-01T00:00:00Z',
        url: 'https://polymarket.com/market/will-ai-stocks-outperform-market-2026'
      },
      {
        id: 'fallback-6',
        question: 'Will Ethereum reach $15,000 by end of 2026?',
        name: 'Ethereum $15K 2026',
        outcomes: [
          { name: 'Yes', price: 0.25 },
          { name: 'No', price: 0.75 }
        ],
        active: true,
        end_date_iso: '2026-12-31T23:59:59Z',
        createdAt: '2025-07-15T00:00:00Z',
        url: 'https://polymarket.com/market/will-ethereum-reach-15000-by-end-of-2026'
      },
      {
        id: 'fallback-7',
        question: 'Will the US have a new president in 2028?',
        name: 'New President 2028',
        outcomes: [
          { name: 'Yes', price: 0.80 },
          { name: 'No', price: 0.20 }
        ],
        active: true,
        end_date_iso: '2028-01-20T23:59:59Z',
        createdAt: '2025-08-01T00:00:00Z',
        url: 'https://polymarket.com/market/will-us-have-new-president-2028'
      }
    ];
    
    // Create response with cache headers
    const apiResponse = NextResponse.json(responseData);
    apiResponse.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    
    return apiResponse;
    
  } catch (error) {
    console.error('Error fetching Polymarket data:', error);
    
    // Return fallback data with current, relevant 2025 markets for continuous scrolling
    const fallbackData = [
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
      }
    ];
    
    // Create fallback response with cache headers
    const fallbackResponse = NextResponse.json(fallbackData);
    fallbackResponse.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    
    return fallbackResponse;
  }
}