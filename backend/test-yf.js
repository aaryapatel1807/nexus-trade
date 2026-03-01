import yahooFinance from 'yahoo-finance2';

async function test() {
    try {
        console.log("Fetching RELIANCE.NS...");
        const quote = await yahooFinance.quote('RELIANCE.NS');
        console.log("Success:", quote.regularMarketPrice);
    } catch (err) {
        console.error("Error:", err);
    }
}
test();
