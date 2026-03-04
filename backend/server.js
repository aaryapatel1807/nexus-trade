import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import tradeRoutes from './routes/trade.js';
import chatRoutes from './routes/chat.js';
import YahooFinance from 'yahoo-finance2';

const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests without origin (SSR, mobile apps)
        if (!origin) return callback(null, true);

        const allowedPatterns = [
            /^http:\/\/localhost(:\d+)?$/,  // localhost variants
            /\.onrender\.com$/,              // Render deployment
            /\.vercel\.app$/,                // Vercel deployment
        ];

        // Add environment-based URLs
        if (process.env.FRONTEND_URL) {
            try {
                allowedPatterns.push(new URL(process.env.FRONTEND_URL).origin);
            } catch (e) {
                console.warn('[CORS] Invalid FRONTEND_URL:', e.message);
            }
        }

        const isAllowed = allowedPatterns.some(pattern => {
            if (pattern instanceof RegExp) return pattern.test(origin);
            return pattern === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked origin: ${origin}`);
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/chat', chatRoutes);

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

let cacheWriteInProgress = false;

function saveCacheToDisk() {
    if (cacheWriteInProgress) {
        console.debug('[CACHE] Write already in progress, skipping...');
        return;
    }

    cacheWriteInProgress = true;
    try {
        const obj = Object.fromEntries(GLOBAL_STOCK_CACHE);
        writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2));
        console.debug('[CACHE] Saved to disk');
    } catch (e) {
        console.error('Failed to save cache:', e.message);
    } finally {
        cacheWriteInProgress = false;
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
            GLOBAL_STOCK_CACHE.set(s.symbol, {
                symbol: s.symbol,
                name: s.name,
                price: null,  // ← Use null, not 0 - easier to detect uninitialized
                changePct: 0,
                lastUpdated: null
            });
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
    'M&M', 'ADANIENT', 'TITAN', 'ULTRACEMCO', 'JIOFIN',
    'BAJAJ-AUTO', 'ADANIPORTS', 'COALINDIA', 'GRASIM', 'JSWSTEEL',
    'LTIM', 'POWERGRID', 'TATASTEEL', 'HDFCLIFE', 'SBILIFE'
];

// ─────────────────────────────────────────────────────────────
//  CORE UTILITY: fetchWithTimeout
//  MUST be defined before any fetch functions that use it.
// ─────────────────────────────────────────────────────────────
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        return response;
    } catch (e) {
        clearTimeout(timer);
        if (e.name === 'AbortError') throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
        throw e;
    }
}

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
//  PRIMARY: YAHOO FINANCE RAW JSON API (works from any IP globally)
//  Uses query1.finance.yahoo.com directly — NOT the yahoo-finance2 library
//  The library had a routing bug; the raw API endpoint is reliable.
// ─────────────────────────────────────────────────────────────

// Stocks whose price can legitimately exceed 15,000 INR
const HIGH_VALUE_STOCKS = new Set(['MRF', 'PAGEIND', 'HONAUT', 'MARUTI', 'SHREECEM', 'NESTLEIND']);
const NSE_PRICE_CEILING = 75000;  // Hard absolute maximum for any NSE stock
const NSE_PRICE_CEILING_DEFAULT = 30000; // Max for most stocks

function isValidNSEPrice(price, symbol) {
    if (!price || isNaN(price) || price <= 0) return false;
    const sym = symbol.replace('.NS', '').replace('.BO', '').toUpperCase();
    const ceiling = HIGH_VALUE_STOCKS.has(sym) ? NSE_PRICE_CEILING : NSE_PRICE_CEILING_DEFAULT;
    if (price > ceiling) {
        console.warn(`[VALIDATE] Rejected ${sym}: ₹${price} exceeds ceiling ₹${ceiling}`);
        return false;
    }
    return true;
}

async function fetchYahooQuote(symbol) {
    // Always use .NS suffix for NSE stocks
    const yfSym = symbol.includes('.') ? symbol : `${symbol}.NS`;
    const YF_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
    };

    // Try v8/chart first, then fall back to v7/quote
    const urls = [
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfSym)}?interval=1d&range=1d`,
        `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfSym)}?interval=1d&range=1d`,
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yfSym)}`,
    ];

    for (const url of urls) {
        try {
            const r = await fetchWithTimeout(url, { headers: YF_HEADERS }, 8000);
            if (!r.ok) { console.warn(`[YF] HTTP ${r.status} for ${yfSym} at ${url}`); continue; }

            const data = await r.json();

            // Handle v8/chart format
            const meta = data?.chart?.result?.[0]?.meta;
            // Handle v7/quote format
            const q = data?.quoteResponse?.result?.[0];

            const price = meta?.regularMarketPrice ?? q?.regularMarketPrice;
            const currency = meta?.currency ?? q?.currency;

            // Strict currency check — must be INR
            if (currency && currency !== 'INR') {
                console.warn(`[YF] Rejected ${yfSym}: currency=${currency} (not INR)`);
                continue;
            }

            if (!isValidNSEPrice(price, symbol)) continue;

            const previousClose = meta?.chartPreviousClose || meta?.previousClose || q?.regularMarketPreviousClose || price;
            const changePct = previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : (q?.regularMarketChangePercent ?? 0);

            console.log(`[YF ✅] ${yfSym}: ₹${price} (${changePct.toFixed(2)}%)`);
            return {
                regularMarketPrice: price,
                regularMarketChangePercent: changePct,
                shortName: meta?.longName || meta?.shortName || q?.longName || q?.shortName || symbol,
                marketCap: 'N/A',
                trailingPE: 'N/A',
                dayHigh: meta?.regularMarketDayHigh || q?.regularMarketDayHigh || price,
                dayLow: meta?.regularMarketDayLow || q?.regularMarketDayLow || price,
                exchange: 'NSE'
            };
        } catch (e) {
            console.warn(`[YF] Error for ${yfSym}: ${e.message}`);
        }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────
//  FALLBACK: GOOGLE FINANCE SCRAPE (works globally)
// ─────────────────────────────────────────────────────────────
const NSE_HARD_FLOOR = 0.5;

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
            }, 8000);

            if (!r.ok) continue;
            const html = await r.text();

            // Target the precise live-price container
            const priceMatch = html.match(/jsname="ip75Cb"[^>]*>₹([0-9,.]+)</);
            if (!priceMatch) continue;

            const price = parseFloat(priceMatch[1].replace(/,/g, ''));

            if (!isValidNSEPrice(price, sym)) continue;

            // Title guard: reject if page is an index, not a stock
            const titleMatch = html.match(/<title>([^<]+)\|/);
            const title = (titleMatch?.[1] || '').toUpperCase();
            if (title.includes('INDEX') || title.includes('DOW') || title.includes('S&P')) {
                console.warn(`[GF] Index title for ${sym}: ${title}`);
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
//  MAIN QUOTE FUNCTION: Yahoo Finance → Google Finance
// ─────────────────────────────────────────────────────────────
async function fetchStockQuote(sym) {
    const cleanSym = sym.replace('.NS', '').replace('.BO', '');

    // 1. Yahoo Finance raw JSON API (works globally, strict INR validation)
    const yfResult = await fetchYahooQuote(cleanSym);
    if (yfResult) return yfResult;

    // 2. Google Finance scrape as fallback
    const gfResult = await fetchGoogleQuote(cleanSym);
    if (gfResult) return gfResult;

    console.error(`[QUOTE] All sources failed for ${cleanSym}`);
    return null;
}

// ─────────────────────────────────────────────────────────────
//  CHART HISTORY (Yahoo Finance chart API — only used for history)
// ─────────────────────────────────────────────────────────────
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
        try {
            const quote = await fetchStockQuote(sym);
            if (quote) {
                const clean = sym.replace('.NS', '').replace('%26', '&');
                const existing = GLOBAL_STOCK_CACHE.get(clean) || {};
                // Ensure price is always a number, never a string
                const price = parseFloat(quote.regularMarketPrice);
                if (!Number.isFinite(price) || price < 0) {
                    console.warn(`[UPDATE] Invalid price for ${sym}: ${quote.regularMarketPrice}`);
                    continue;
                }
                GLOBAL_STOCK_CACHE.set(clean, {
                    ...existing,
                    symbol: clean,  // ← Ensure symbol field exists
                    name: existing.name || quote.shortName || clean,
                    price: price,  // ← Store as float, not string
                    changePct: parseFloat(quote.regularMarketChangePercent) || 0,
                    lastUpdated: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error(`[UPDATE] Failed to fetch ${sym}:`, e.message);
            continue;
        }
        await new Promise(r => setTimeout(r, 300)); // gentle throttle
    }
    saveCacheToDisk();
    console.log('[UPDATE] Top stock refresh complete.');
}

let updateJobHandle = null;

// Start update job
function startUpdateJob() {
    updateJobHandle = setInterval(updateTopStocks, 5 * 60 * 1000);
    updateTopStocks(); // Initial run
}

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received - shutting down gracefully...');
    if (updateJobHandle) {
        clearInterval(updateJobHandle);
    }
    saveCacheToDisk();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received - shutting down gracefully...');
    if (updateJobHandle) {
        clearInterval(updateJobHandle);
    }
    saveCacheToDisk();
    process.exit(0);
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    startUpdateJob();
});

// Export server instance for testing or external control
export default server;
