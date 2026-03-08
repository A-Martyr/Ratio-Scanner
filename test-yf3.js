const { default: YahooFinance } = require('yahoo-finance2');
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const fund = await yahooFinance.fundamentalsTimeSeries('AAPL', {
      period1: '2023-01-01',
      module: 'all',
      type: 'quarterly'
    });
    console.log("fundamentalsTimeSeries length:", fund.length);
    if (fund.length > 0) {
      const latest = fund[fund.length - 1];
      console.log("Latest keys:", Object.keys(latest).filter(k => k.toLowerCase().includes('asset') || k.toLowerCase().includes('liab') || k.toLowerCase().includes('equity') || k.toLowerCase().includes('income')));
      console.log({
        assets: latest.currentAssets,
        liabs: latest.currentLiabilities,
        equity: latest.stockholdersEquity,
        netIncome: latest.netIncome
      });
    }
  } catch (e) {
    console.error(e);
  }
}
test();
