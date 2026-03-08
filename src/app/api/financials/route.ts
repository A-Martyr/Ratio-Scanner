import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

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
      period1: new Date(Date.now() - 365 * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      module: 'all',
      type: 'quarterly'
    });

    if (!financials || financials.length === 0) {
      return NextResponse.json({ error: 'Incomplete financial data for this ticker' }, { status: 404 });
    }

    const latest = financials[financials.length - 1] as any;
    const priceInfo = quote.price;

    const currentAssets = latest.currentAssets || 0;
    const currentLiabilities = latest.currentLiabilities || 0;
    const totalLiabilities = latest.totalLiabilitiesNetMinorityInterest || 0;
    const totalEquity = latest.stockholdersEquity || 0;
    const netIncome = latest.netIncome || 0;
    const companyName = priceInfo?.longName || priceInfo?.shortName || ticker.toUpperCase();

    const currentRatio = currentLiabilities ? (currentAssets / currentLiabilities) : null;
    const debtToEquity = totalEquity ? (totalLiabilities / totalEquity) : null;
    
    // Annualize the quarterly net income to get a standard ROE
    const returnOnEquity = totalEquity ? ((netIncome * 4) / totalEquity) : null;

    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      name: companyName,
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
        netIncome: netIncome * 4 
      }
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to fetch financial data' }, { status: 500 });
  }
}
