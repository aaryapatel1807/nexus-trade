import dotenv from 'dotenv';
dotenv.config();

async function testFinnhubHistory() {
    const sym = 'NSE:RELIANCE';
    const to = Math.floor(Date.now() / 1000);
    const from = to - (30 * 24 * 60 * 60); // 30 days ago
    const res = 'D'; // Daily
    const FINNHUB_KEY = process.env.FINNHUB_API_KEY;

    if (!FINNHUB_KEY) {
        console.error("FINNHUB_API_KEY is missing from .env");
        return;
    }

    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${sym}&resolution=${res}&from=${from}&to=${to}&token=${FINNHUB_KEY}`;
    console.log("Fetching Finnhub:", url.replace(FINNHUB_KEY, 'HIDDEN'));

    const r = await fetch(url);
    const d = await r.json();
    console.log("Response:", JSON.stringify(d).substring(0, 100));
    if (d.s === 'ok') {
        console.log("Close array length:", d.c.length);
        console.log("Sample:", d.c[0], new Date(d.t[0] * 1000).toISOString());
    } else {
        console.log("Error status:", d.s);
    }
}
testFinnhubHistory();
