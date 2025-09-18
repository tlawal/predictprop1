export async function GET() {
  // Mock data for 3-5 active prediction markets
  const mockMarkets = [
    {
      id: 1,
      question: "Will Bitcoin reach $150,000 by end of 2025?",
      endDate: "2025-12-31T23:59:59Z",
      yesOdds: 0.25,
      volume: 1250000,
      source: "Polymarket",
      url: "https://polymarket.com/event/will-bitcoin-reach-150k-2025"
    },
    {
      id: 2,
      question: "Will the S&P 500 close above 6,000 by end of 2025?",
      endDate: "2025-12-31T23:59:59Z",
      yesOdds: 0.40,
      volume: 890000,
      source: "Polymarket",
      url: "https://polymarket.com/event/sp500-6000-2025"
    },
    {
      id: 3,
      question: "Will there be a recession in 2025?",
      endDate: "2025-12-31T23:59:59Z",
      yesOdds: 0.30,
      volume: 2100000,
      source: "Polymarket",
      url: "https://polymarket.com/event/recession-2025"
    },
    {
      id: 4,
      question: "Will the Fed cut rates by 100+ bps in 2025?",
      endDate: "2025-12-31T23:59:59Z",
      yesOdds: 0.55,
      volume: 675000,
      source: "Polymarket",
      url: "https://polymarket.com/event/fed-rates-100bps-2025"
    },
    {
      id: 5,
      question: "Will AI stocks outperform the market in 2025?",
      endDate: "2025-12-31T23:59:59Z",
      yesOdds: 0.60,
      volume: 445000,
      source: "Polymarket",
      url: "https://polymarket.com/event/ai-stocks-outperform-2025"
    }
  ];

  return Response.json(mockMarkets);
}
