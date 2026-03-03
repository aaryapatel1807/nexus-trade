import yf from 'yahoo-finance2';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, 'stock-cache.json');

const TOP_NSE_STOCKS = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'SBIN.NS',
    'ICICIBANK.NS', 'HINDUNILVR.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS',
    'LT.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'SUNPHARMA.NS',
    'HCLTECH.NS', 'WIPRO.NS', 'TECHM.NS', 'ONGC.NS', 'NTPC.NS', 'TATAMOTORS.NS',
    'EICHERMOT.NS', 'NESTLEIND.NS', 'DRREDDY.NS', 'CIPLA.NS', 'BAJFINANCE.NS',
    'M&M.NS', 'ADANIENT.NS', 'TITAN.NS', 'ULTRACEMCO.NS', 'JIOFIN.NS',
    'BAJAJ-AUTO.NS', 'ADANIPORTS.NS', 'COALINDIA.NS', 'GRASIM.NS', 'JSWSTEEL.NS',
    'LTIM.NS', 'POWERGRID.NS', 'TATASTEEL.NS', 'HDFCLIFE.NS', 'SBILIFE.NS'
];

async function update() {
    try {
        const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
        console.log('--- FORCING CACHE UPDATE ---');
        for (const sym of TOP_NSE_STOCKS) {
            try {
                const q = await yf.quote(sym);
                if (q && q.regularMarketPrice > 0) {
                    const clean = sym.replace('.NS', '');
                    if (cache[clean]) {
                        console.log(`Updating ${clean}: ${q.regularMarketPrice} (${q.currency})`);
                        cache[clean].price = q.regularMarketPrice;
                        cache[clean].changePct = q.regularMarketChangePercent;
                        cache[clean].lastUpdated = new Date().toISOString();
                    }
                }
            } catch (e) {
                console.log(`Failed ${sym}: ${e.message}`);
            }
        }
        writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
        console.log('--- CACHE UPDATE COMPLETE ---');
    } catch (e) {
        console.error(e.message);
    }
}
update();
