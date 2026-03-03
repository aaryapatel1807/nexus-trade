import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import tradeRoutes from './routes/trade.js';
import chatRoutes from './routes/chat.js';

const app = express();

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origin.startsWith('http://localhost') || origin.endsWith('.onrender.com') || origin === process.env.FRONTEND_URL) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/chat', chatRoutes);

import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * =============================================================
 *   PRICE FETCH STRATEGY — NSE INDIA API (Primary) + Fallbacks
 * =============================================================
 *
 *  1. PRIMARY: NSE India official unofficial API
 *     GET https://www.nseindia.com/api/quote-equity?symbol=RELIANCE
 *     Returns 100% INR prices. Can never return Dow Jones / index data.
 *
 *  2. SECONDARY: NSE alternative endpoint
 *     GET https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050
 *
 *  3. FALLBACK: Google Finance scrape (precise jsname="ip75Cb" selector)
 *     Class-based selectors from Google Finance for final resort.
 *
 *  WHY NOT YAHOO FINANCE?
 *  Yahoo Finance (yahoo-finance2) has been confirmed to return Dow Jones,
 *  S&P 500, and other index data (47,000+) for .NS stock symbols due to
 *  their internal routing confusion. This is NOT fixable with validation.
 */

// ─────────────────────────────────────────────────────────────
//  STOCK METADATA & CACHE
// ─────────────────────────────────────────────────────────────
let ALL_NSE_STOCKS = [];
let GLOBAL_STOCK_CACHE = new Map();
const CACHE_FILE = path.join(__dirname, 'stock-cache.json');

function saveCacheToDisk() {
    try {
        const obj = Object.fromEntries(GLOBAL_STOCK_CACHE);
        writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2));
    } catch (e) {
        console.error('Failed to save cache:', e.message);
    }
}

try {
    ALL_NSE_STOCKS = JSON.parse(readFileSync(path.join(__dirname, 'nse-stocks.json'), 'utf-8'));
    console.log(`✅ Loaded ${ALL_NSE_STOCKS.length} NSE stocks.`);

    if (existsSync(CACHE_FILE)) {
        const diskCache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
        Object.entries(diskCache).forEach(([k, v]) => GLOBAL_STOCK_CACHE.set(k, v));
        console.log(`💾 Restored ${GLOBAL_STOCK_CACHE.size} stocks from disk.`);
    }

    ALL_NSE_STOCKS.forEach(s => {
        if (!GLOBAL_STOCK_CACHE.has(s.symbol)) {
            GLOBAL_STOCK_CACHE.set(s.symbol, { symbol: s.symbol, name: s.name, price: 0, changePct: 0, lastUpdated: null });
        }
    });
} catch (e) {
    console.warn('Could not load nse-stocks.json:', e.message);
}

// ─────────────────────────────────────────────────────────────
//  TOP NSE STOCKS LIST
// ─────────────────────────────────────────────────────────────
const TOP_NSE_STOCKS = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN',
    'ICICIBANK', 'HINDUNILVR', 'BHARTIARTL', 'ITC', 'KOTAKBANK',
    'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'SUNPHARMA',
    'HCLTECH', 'WIPRO', 'TECHM', 'ONGC', 'NTPC', 'TATAMOTORS',
    'EICHERMOT', 'NESTLEIND', 'DRREDDY', 'CIPLA', 'BAJFINANCE',
    'M%26M', 'ADANIENT', 'TITAN', 'ULTRACEMCO', 'JIOFIN',
    'BAJAJ-AUTO', 'ADANIPORTS', 'COALINDIA', 'GRASIM', 'JSWSTEEL',
    'LTIM', 'POWERGRID', 'TATASTEEL', 'HDFCLIFE', 'SBILIFE'
];

// ─────────────────────────────────────────────────────────────
//  NSE INDIA API HEADERS (required for session cookie)
// ─────────────────────────────────────────────────────────────
const NSE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/',
    'Connection': 'keep-alive',
};

// NSE requires a session cookie obtained by first visiting the homepage
let NSE_COOKIE = '';
let NSE_COOKIE_FETCHED_AT = 0;
const NSE_COOKIE_TTL = 10 * 60 * 1000; // 10 minutes

async function getNSECookie() {
    if (NSE_COOKIE && Date.now() - NSE_COOKIE_FETCHED_AT < NSE_COOKIE_TTL) {
        return NSE_COOKIE;
    }
    try {
        const r = await fetchWithTimeout('https://www.nseindia.com/', { headers: NSE_HEADERS }, 8000);
        const setCookie = r.headers.get('set-cookie');
        if (setCookie) {
            NSE_COOKIE = setCookie.split(';')[0];
            NSE_COOKIE_FETCHED_AT = Date.now();
            console.log('[NSE] Session cookie refreshed.');
        }
    } catch (e) {
        console.warn('[NSE] Cookie fetch failed:', e.message);
    }
    return NSE_COOKIE;
}

// ─────────────────────────────────────────────────────────────
//  PRIMARY: NSE INDIA API QUOTE
// ─────────────────────────────────────────────────────────────
async function fetchNSEQuote(symbol) {
    // symbol should be plain e.g. "RELIANCE" (no .NS)
    const sym = symbol.replace('.NS', '').replace('.BO', '').replace('%26', '&');
    const cookie = await getNSECookie();
    if (!cookie) return null; // Can't proceed without session

    const endpoints = [
        `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(sym)}`,
        `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(sym)}&series=EQ`,
    ];

    for (const url of endpoints) {
        try {
            const r = await fetchWithTimeout(url, {
                headers: { ...NSE_HEADERS, 'Cookie': cookie }
            }, 7000);

            if (!r.ok) {
                console.warn(`[NSE] HTTP ${r.status} for ${sym} at ${url}`);
                continue;
            }

            const data = await r.json();

            // The NSE API returns priceInfo for equity stocks
            const price = data?.priceInfo?.lastPrice;
            const changePct = data?.priceInfo?.pChange ?? data?.priceInfo?.change ?? 0;
            const companyName = data?.info?.companyName || data?.metadata?.companyName || sym;

            if (!price || price <= 0) continue;

            console.log(`[NSE ✅] ${sym}: ₹${price}`);
            return {
                regularMarketPrice: price,
                regularMarketChangePercent: changePct,
                shortName: companyName,
                marketCap: 'N/A',
                trailingPE: data?.metadata?.pdSymbolPe || 'N/A',
                dayHigh: data?.priceInfo?.dayHigh || price,
                dayLow: data?.priceInfo?.dayLow || price,
                exchange: 'NSE'
            };
        } catch (e) {
            console.warn(`[NSE] Error for ${sym}: ${e.message}`);
        }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────
//  FALLBACK: GOOGLE FINANCE SCRAPE
// ─────────────────────────────────────────────────────────────
// Hard price limits — absolute maximum realistic NSE stock price
const NSE_PRICE_CEILING = 75000; // Only MRF can reach this
const NSE_HARD_FLOOR = 0.5;      // Sub-penny stocks are invalid

async function fetchGoogleQuote(symbol) {
    const sym = symbol.replace('.NS', '').replace('.BO', '');
    const targets = [`${sym}:NSE`, `${sym}:BOM`];

    for (const target of targets) {
        try {
            const url = `https://www.google.com/finance/quote/${target}`;
            const r = await fetchWithTimeout(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            }, 6000);

            if (!r.ok) continue;
            const html = await r.text();

            // STRICT: Only match inside the designated live-price container
            const priceMatch = html.match(/jsname="ip75Cb"[^>]*>₹([0-9,.]+)</);
            if (!priceMatch) continue;

            const price = parseFloat(priceMatch[1].replace(/,/g, ''));

            // Hard guards
            if (price < NSE_HARD_FLOOR || price > NSE_PRICE_CEILING) {
                console.warn(`[GF] Price ${price} out of bounds for ${sym}`);
                continue;
            }

            // Title guard: page title should NOT contain index keywords
            const titleMatch = html.match(/<title>([^<]+)\|/);
            const title = (titleMatch?.[1] || '').toUpperCase();
            if (title.includes('INDEX') || title.includes('DOW') || title.includes('S&P') || title.includes('SENSEX') || title.includes('NIFTY')) {
                console.warn(`[GF] Index title detected for ${sym}: ${title}`);
                continue;
            }

            let changePercent = 0;
            const ariaMatch = html.match(/aria-label="(Up|Down) by ([0-9,.]+)%"/);
            if (ariaMatch) changePercent = parseFloat(ariaMatch[2]) * (ariaMatch[1] === 'Down' ? -1 : 1);

            console.log(`[GF ✅] ${sym}: ₹${price}`);
            return {
                regularMarketPrice: price,
                regularMarketChangePercent: changePercent,
                shortName: sym,
                marketCap: 'N/A',
                trailingPE: 'N/A',
                dayHigh: price,
                dayLow: price,
                exchange: target.includes('BOM') ? 'BSE' : 'NSE'
            };
        } catch (e) { /* try next exchange */ }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────
//  MAIN QUOTE FUNCTION: NSE -> Google Finance
// ─────────────────────────────────────────────────────────────
async function fetchStockQuote(sym) {
    const cleanSym = sym.replace('.NS', '').replace('.BO', '');

    // 1. Try NSE India API (guaranteed INR, guaranteed stock data)
    const nseResult = await fetchNSEQuote(cleanSym);
    if (nseResult) return nseResult;

    // 2. Google Finance scrape as fallback
    const gfResult = await fetchGoogleQuote(cleanSym);
    if (gfResult) return gfResult;

    console.error(`[QUOTE] All sources failed for ${cleanSym}`);
    return null;
}

// ─────────────────────────────────────────────────────────────
//  CHART HISTORY (Yahoo Finance chart API — only used for history)
// ─────────────────────────────────────────────────────────────
import YahooFinance from 'yahoo-finance2';
const yf_history = new YahooFinance();
const HISTORY_CACHE = new Map();
const HISTORY_TTL = 10 * 60 * 1000;

const INDEX_MAP = {
    '^NSEI': 'NIFTY_50:INDEXNSE',
    '^BSESN': 'SENSEX:INDEXBOM',
    '^NSEBANK': 'NIFTY_BANK:INDEXNSE',
    '^CNXIT': 'NIFTY_IT:INDEXNSE',
    '^VIX': 'INDIAVIX:INDEXNSE'
};

app.get('/api/stock/history/:symbol', async (req, res) => {
    let { symbol } = req.params;
    let { range } = req.query;

    // Normalize: always add .NS suffix for Yahoo chart API
    if (!symbol.includes('.') && !symbol.startsWith('^')) symbol = symbol + '.NS';

    const cacheKey = `${symbol}_${range}`;
    const cached = HISTORY_CACHE.get(cacheKey);
    if (cached && (Date.now() - cached.time < HISTORY_TTL)) {
        return res.json(cached.data);
    }

    try {
        const now = new Date();
        let period1, interval;

        switch (range) {
            case '1D': period1 = new Date(now.getTime() - 86400000); interval = '15m'; break;
            case '1W': period1 = new Date(now.getTime() - 7 * 86400000); interval = '1h'; break;
            case '1M': period1 = new Date(now.getTime() - 30 * 86400000); interval = '1d'; break;
            case '3M': period1 = new Date(now.getTime() - 90 * 86400000); interval = '1d'; break;
            case '1Y': period1 = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); interval = '1wk'; break;
            case 'ALL': period1 = new Date(2000, 0, 1); interval = '1mo'; break;
            default: period1 = new Date(now.getTime() - 30 * 86400000); interval = '1d';
        }

        const result = await yf_history.chart(symbol, { period1, interval });

        if (!result || !result.quotes || result.quotes.length === 0) {
            return res.status(404).json({ error: 'No chart data available' });
        }

        let chartData = result.quotes
            .map(q => ({
                time: Math.floor(q.date.getTime() / 1000),
                value: +(q.close || q.open || 0).toFixed(2)
            }))
            .filter(q => q.value > 0);

        // Sync final point to live price for real-time accuracy
        const liveQuote = await fetchStockQuote(symbol);
        if (liveQuote?.regularMarketPrice > 0) {
            chartData.push({ time: Math.floor(Date.now() / 1000), value: liveQuote.regularMarketPrice });
        }

        // Fallback: if we still have < 2 points, generate a minimal 2-point line
        if (chartData.length < 2 && liveQuote) {
            chartData = [
                { time: Math.floor(Date.now() / 1000) - 3600, value: +(liveQuote.regularMarketPrice * 0.99).toFixed(2) },
                { time: Math.floor(Date.now() / 1000), value: liveQuote.regularMarketPrice }
            ];
        }

        HISTORY_CACHE.set(cacheKey, { time: Date.now(), data: chartData });
        res.json(chartData);
    } catch (e) {
        console.error(`Chart error for ${symbol}:`, e.message);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});

// ─────────────────────────────────────────────────────────────
//  PERIODIC CACHE UPDATES
// ─────────────────────────────────────────────────────────────
async function updateTopStocks() {
    console.log('[UPDATE] Starting top stock refresh...');
    for (const sym of TOP_NSE_STOCKS) {
        const quote = await fetchStockQuote(sym);
        if (quote) {
            const clean = sym.replace('.NS', '');
            const existing = GLOBAL_STOCK_CACHE.get(clean) || {};
            GLOBAL_STOCK_CACHE.set(clean, {
                ...existing,
                price: quote.regularMarketPrice,
                changePct: quote.regularMarketChangePercent,
                lastUpdated: new Date().toISOString()
            });
        }
        await new Promise(r => setTimeout(r, 300)); // gentle throttle
    }
    saveCacheToDisk();
    console.log('[UPDATE] Top stock refresh complete.');
}

setInterval(updateTopStocks, 5 * 60 * 1000);
updateTopStocks();

// ─────────────────────────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────────────────────────
app.get('/api/stocks', (req, res) => {
    res.json(Array.from(GLOBAL_STOCK_CACHE.values()));
});

app.get('/api/stocks/top', (req, res) => {
    const top = TOP_NSE_STOCKS.map(s => GLOBAL_STOCK_CACHE.get(s.replace('.NS', '').replace('%26', '&'))).filter(Boolean);
    res.json(top);
});

app.get('/api/stock/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const fullSym = symbol.includes('.') ? symbol : (symbol.startsWith('^') ? symbol : symbol + '.NS');
    const quote = await fetchStockQuote(fullSym);
    if (!quote) return res.status(404).json({ error: 'Stock not found' });
    res.json(quote);
});

// ─────────────────────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────────────────────
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
