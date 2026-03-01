import YahooFinance from 'yahoo-finance2';

const yahooFinance = typeof YahooFinance === 'function' ? new YahooFinance({ suppressNotices: ['yahooSurvey'] }) : YahooFinance;

async function testHistory() {
    try {
        console.log("Fetching RELIANCE.NS history...");
        const period1 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        console.log("Period config:", period1);

        const history = await yahooFinance.historical('RELIANCE.NS', { period1, interval: '1d' });
        console.log("Success! Data points:", history.length);
        if (history.length > 0) {
            console.log("Sample point:", history[0].date, history[0].close);
        }
    } catch (err) {
        console.error("Historical Error:", err.message || err);
    }
}
testHistory();
