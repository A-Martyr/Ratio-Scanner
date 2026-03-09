import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker symbol is required' }, { status: 400 });
  }

  try {
    const quote = await yahooFinance.quoteSummary(ticker.toUpperCase(), { 
      modules: ['price'] 
    });

    const financials = await yahooFinance.fundamentalsTimeSeries(ticker.toUpperCase(), {
      period1: new Date(Date.now() - 365 * 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      module: 'all',
      type: 'annual'
    });

    if (!financials || financials.length === 0) {
      return NextResponse.json({ error: 'Incomplete financial data for this ticker' }, { status: 404 });
    }

    const priceInfo = quote.price;
    const companyName = priceInfo?.longName || priceInfo?.shortName || ticker.toUpperCase();

    // Map the financials to an array of historical snapshots (up to 5 most recent years)
    const history = financials.slice(-5).map((yearlyData: any) => {
      const currentAssets = yearlyData.currentAssets || 0;
      const currentLiabilities = yearlyData.currentLiabilities || 0;
      const totalLiabilities = yearlyData.totalLiabilitiesNetMinorityInterest || 0;
      const totalEquity = yearlyData.stockholdersEquity || 0;
      const netIncome = yearlyData.netIncome || 0;
      
      let year = new Date().getFullYear();
      if (yearlyData.date || yearlyData.asOfDate) {
         year = new Date(yearlyData.date || yearlyData.asOfDate).getFullYear();
      }

      const currentRatio = currentLiabilities ? (currentAssets / currentLiabilities) : null;
      const debtToEquity = totalEquity ? (totalLiabilities / totalEquity) : null;
      const returnOnEquity = totalEquity ? (netIncome / totalEquity) : null;

      return {
        year,
        metrics: {
          currentRatio,
          debtToEquity,
          returnOnEquity
        },
        raw: {
          currentAssets,
          currentLiabilities,
          totalLiabilities,
          totalEquity,
          netIncome 
        }
      };
    });

    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      name: companyName,
      history
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to fetch financial data' }, { status: 500 });
  }
}
