const yahooFinance = require('yahoo-finance2').default;
async function test() {
  try {
    const result = await yahooFinance.quoteSummary('AAPL', { modules: ['balanceSheetHistory', 'incomeStatementHistory'] });
    console.log("Balance Sheet key count:", Object.keys(result.balanceSheetHistory).length);
    if (result.balanceSheetHistory.balanceSheetStatements && result.balanceSheetHistory.balanceSheetStatements.length > 0) {
       console.log("Keys in latest balance sheet:", Object.keys(result.balanceSheetHistory.balanceSheetStatements[0]));
    }
    console.log("Income statement key count:", Object.keys(result.incomeStatementHistory).length);
    if (result.incomeStatementHistory.incomeStatementHistory && result.incomeStatementHistory.incomeStatementHistory.length > 0) {
       console.log("Keys in latest income sheet:", Object.keys(result.incomeStatementHistory.incomeStatementHistory[0]));
    }
  } catch(e) { console.error(e); }
}
test();
