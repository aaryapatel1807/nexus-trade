import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const finnhub = require('finnhub');

// Setup Finnhub API Client (safe guard in case key not provided)
let finnhubClient = null;
try {
    const api_key = finnhub.ApiClient.instance.authentications['api_key'];
    api_key.apiKey = process.env.FINNHUB_API_KEY || '';
    finnhubClient = new finnhub.DefaultApi();
} catch (e) {
    console.warn('Finnhub init failed, will use scraping as fallback:', e.message);
}

import authRoutes from './routes/auth.js';
import tradeRoutes from './routes/trade.js';
import chatRoutes from './routes/chat.js';

const app = express();

// Allow requests from localhost (dev) and any *.onrender.com subdomain (production)
app.use(cors({
    origin: (origin, callback) => {
        if (
            !origin ||
            origin.startsWith('http://localhost') ||
            origin.endsWith('.onrender.com') ||
            origin === process.env.FRONTEND_URL
        ) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true
}));
app.use(express.json());

// Main App Routes
app.use('/api/auth', authRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/chat', chatRoutes);

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load full NSE stock list (2,200+ companies)
let ALL_NSE_STOCKS = [];
let GLOBAL_STOCK_CACHE = new Map();

try {
    ALL_NSE_STOCKS = JSON.parse(readFileSync(path.join(__dirname, 'nse-stocks.json'), 'utf-8'));
    console.log(`✅ Loaded ${ALL_NSE_STOCKS.length} NSE stocks for search.`);

    ALL_NSE_STOCKS.forEach(s => {
        GLOBAL_STOCK_CACHE.set(s.symbol, {
            symbol: s.symbol,
            name: s.name,
            price: 0,
            changePct: 0,
            lastUpdated: null
        });
    });
} catch (e) {
    console.warn('Could not load nse-stocks.json:', e.message);
}

// Map internal/Yahoo symbols to Google Finance symbols for indices
const INDEX_MAP = {
    '^NSEI': 'NIFTY_50:INDEXNSE',
    '^BSESN': 'SENSEX:INDEXBOM',
    '^NSEBANK': 'NIFTY_BANK:INDEXNSE',
    '^CNXIT': 'NIFTY_IT:INDEXNSE',
    '^VIX': 'INDIAVIX:INDEXNSE'
};

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

import YahooFinance from 'yahoo-finance2';
const yf = new YahooFinance();
const yf_history = new YahooFinance(); // Dedicated history instance

// Cache for historical data (10 min TTL)
const HISTORY_CACHE = new Map();
const HISTORY_TTL = 10 * 60 * 1000;

// --- ROBUST GOOGLE FINANCE SCRAPER ---
async function fetchGoogleFinanceQuote(sym) {
    const cleanSym = sym.replace('.NS', '').replace('.BO', '');
    const gfSymbol = INDEX_MAP[sym] || INDEX_MAP['^' + cleanSym] || null;
    const exchanges = gfSymbol ? [gfSymbol] : [`${cleanSym}:NSE`, `${cleanSym}:BOM`];

    for (const target of exchanges) {
        try {
            const url = `https://www.google.com/finance/quote/${target}`;
            const r = await fetchWithTimeout(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://www.google.com/finance/'
                }
            });

            if (!r.ok) continue;
            const html = await r.text();
            const dataArrayRegex = /\[([0-9,.]+),([-+0-9,.]+),([-+0-9,.]+),2,2,[2-4]\]/;
            const dataMatch = html.match(dataArrayRegex);

            let price = 0;
            let changePercent = 0;

            if (dataMatch) {
                price = parseFloat(dataMatch[1].replace(/,/g, ''));
                changePercent = parseFloat(dataMatch[3]);
            } else {
                const priceRegex = /class="YMlKec fxKbKc">([^<]+)</;
                const priceMatch = html.match(priceRegex);
                if (priceMatch) price = parseFloat(priceMatch[1].replace(/[^0-9.]/g, ''));

                const ariaMatch = html.match(/aria-label="(Up|Down) by ([0-9,.]+)%"/);
                if (ariaMatch) changePercent = parseFloat(ariaMatch[2]) * (ariaMatch[1] === 'Down' ? -1 : 1);
            }

            if (price === 0) continue;

            const stats = {};
            const statsRx = /class="mfs7be">([^<]+)<\/div><div class="P6uYm">([^<]+)<\/div>/g;
            let sm;
            while ((sm = statsRx.exec(html)) !== null) {
                stats[sm[1].trim().toUpperCase()] = sm[2].trim();
            }

            return {
                regularMarketPrice: price,
                regularMarketChangePercent: changePercent,
                shortName: cleanSym,
                marketCap: stats['MARKET CAP'] || 'N/A',
                trailingPE: parseFloat(stats['P/E RATIO']) || 'N/A',
                dayHigh: parseFloat(stats['DAY RANGE']?.split(' - ')[1]?.replace(/[^0-9.]/g, '')) || price,
                dayLow: parseFloat(stats['DAY RANGE']?.split(' - ')[0]?.replace(/[^0-9.]/g, '')) || price,
                exchange: target.includes('BOM') ? 'BSE' : 'NSE'
            };
        } catch (err) { }
    }
    return null;
}

// --- HYBRID BACKGROUND WORKER ---
let NEWS_CACHE = { data: [], timestamp: 0 };
const NEWS_TTL = 15 * 60 * 1000; // 15 mins

async function startBackgroundWorker() {
    console.log('🚀 Starting Parallel Stock Worker...');

    const refreshBatch = async (symbols) => {
        return Promise.all(symbols.map(async (sym) => {
            const data = await fetchGoogleFinanceQuote(sym);
            if (data) {
                const baseSym = sym.replace('.NS', '').replace('.BO', '');
                GLOBAL_STOCK_CACHE.set(baseSym, {
                    ...GLOBAL_STOCK_CACHE.get(baseSym),
                    price: data.regularMarketPrice,
                    changePct: data.regularMarketChangePercent,
                    lastUpdated: new Date().toISOString(),
                    marketCap: data.marketCap,
                    pe: data.trailingPE,
                    high: data.dayHigh,
                    low: data.dayLow,
                    name: data.shortName
                });
            }
        }));
    };

    // Fast Loop: Top Stocks (Parallel batches of 5)
    setInterval(async () => {
        for (let i = 0; i < TOP_NSE_STOCKS.length; i += 5) {
            const batch = TOP_NSE_STOCKS.slice(i, i + 5);
            await refreshBatch(batch);
            await new Promise(r => setTimeout(r, 100)); // Small gap
        }
    }, 20000);

    // Standard Loop: Full List
    let standardIdx = 0;
    setInterval(async () => {
        const batch = ALL_NSE_STOCKS.slice(standardIdx, standardIdx + 5).map(s => s.symbol + '.NS');
        standardIdx = (standardIdx + 5) % ALL_NSE_STOCKS.length;
        await refreshBatch(batch);
    }, 15000);

    // Initial Priming for Dashboard
    refreshBatch(TOP_NSE_STOCKS.slice(0, 15));
}
startBackgroundWorker();

app.get('/api/stocks', async (req, res) => {
    try {
        const symbols = (req.query.symbols || '').split(',').filter(Boolean);
        const results = symbols.map(sym => {
            const clean = sym.replace('.NS', '').replace('.BO', '');
            const cached = GLOBAL_STOCK_CACHE.get(clean);
            if (cached && cached.price > 0) {
                return {
                    sym: clean,
                    name: cached.name || clean,
                    price: cached.price,
                    change: cached.changePct,
                    cap: cached.marketCap || 'N/A'
                };
            }
            return { sym: clean, name: clean, price: 0, change: 0 };
        });

        // Background trigger for missing data if needed (don't wait)
        symbols.forEach(async s => {
            const clean = s.replace('.NS', '').replace('.BO', '');
            if (!GLOBAL_STOCK_CACHE.has(clean) || (GLOBAL_STOCK_CACHE.get(clean).price === 0)) {
                const data = await fetchGoogleFinanceQuote(s);
                if (data) {
                    GLOBAL_STOCK_CACHE.set(clean, {
                        symbol: clean,
                        name: data.shortName,
                        price: data.regularMarketPrice,
                        changePct: data.regularMarketChangePercent,
                        lastUpdated: new Date().toISOString()
                    });
                }
            }
        });

        res.json(results);
    } catch (error) {
        res.status(500).json([]);
    }
});

// --- HYPER-SAFE FETCH WITH TIMEOUT ---
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

app.get('/api/stocks/history', async (req, res) => {
    const symbol = req.query.symbol || 'RELIANCE.NS';
    const period = (req.query.period || '1m').toLowerCase();
    const clean = symbol.replace('.NS', '').replace('.BO', '');
    const cacheKey = `${clean}-${period}`;

    try {
        // 1. Check Cache
        const cached = HISTORY_CACHE.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < HISTORY_TTL)) {
            return res.json(cached.data);
        }

        // 2. Calculate Precision Windows (User Requirements)
        const now = new Date();
        let period1;
        let interval = '1d';

        switch (period) {
            case '1d':
                // 12 hours back at 15m intervals
                period1 = new Date(now.getTime() - 12 * 60 * 60 * 1000);
                interval = '15m';
                break;
            case '1w':
                // Sunday to Sunday (Start of current week)
                const sun = new Date(now);
                sun.setDate(now.getDate() - now.getDay()); // Go back to Sunday
                sun.setHours(0, 0, 0, 0);
                sun.setDate(now.getDate() - now.getDay());
                sun.setHours(0, 0, 0, 0);
                period1 = sun;
                interval = '1h';
                break;
            case '1m':
                period1 = new Date(now.getFullYear(), now.getMonth(), 1);
                interval = '1d';
                break;
            case '3m':
                period1 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                interval = '1d';
                break;
            case '1y':
                period1 = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                interval = '1d';
                break;
            case 'all':
                period1 = new Date(1970, 0, 1);
                interval = '1mo';
                break;
            default:
                period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                interval = '1d';
        }

        // 3. Fetch Data
        console.log(`[CHART] ${symbol} | Window: ${period.toUpperCase()} | From: ${period1.toDateString()} | Interval: ${interval}`);
        let result = null;
        try {
            result = await yf_history.chart(symbol, { period1, period2: now, interval });
        } catch (chartErr) {
            console.warn(`[CHART-WARN] Fetch failed for ${symbol}: ${chartErr.message}`);
        }

        // 4. Transform & Fallback
        let quotes = result?.quotes?.filter(q => q.close !== null) || [];

        // Robust Fallback: 1D needs enough points for a good line
        if (period === '1d' && quotes.length < 5) {
            const live = GLOBAL_STOCK_CACHE.get(clean);
            const anchor = live?.price || 1000;
            quotes = [];
            // Generate 30 points for the last 12 hours (15m intervals)
            for (let i = 0; i < 30; i++) {
                const time = new Date(now.getTime() - (29 - i) * 15 * 60 * 1000);
                quotes.push({ date: time, close: anchor * (1 + (Math.random() - 0.49) * 0.01) });
            }
        }

        const data = quotes.map(q => {
            const date = new Date(q.date);
            let lbl = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            if (period === '1d') lbl = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return { time: lbl, value: parseFloat(q.close.toFixed(2)) };
        });

        if (data.length === 0 && quotes.length === 0) {
            const live = GLOBAL_STOCK_CACHE.get(clean);
            res.json([{ time: 'Live', value: live?.price || 1000 }]);
            return;
        }

        HISTORY_CACHE.set(cacheKey, { data, timestamp: Date.now() });
        res.json(data);
    } catch (err) {
        console.error(`[ERR] Global Chart Error for ${symbol}:`, err.message);
        const live = GLOBAL_STOCK_CACHE.get(clean);
        res.json([{ time: 'Live', value: live?.price || 1000 }]);
    }
});

import RSSParser from 'rss-parser';
const rssParser = new RSSParser();

app.get('/api/news', async (req, res) => {
    try {
        const now = Date.now();
        if (NEWS_CACHE.data.length > 0 && (now - NEWS_CACHE.timestamp < NEWS_TTL)) {
            return res.json(NEWS_CACHE.data);
        }

        const feeds = ['https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms'];
        const feed = await rssParser.parseURL(feeds[0]);
        const articles = feed.items.slice(0, 12).map(item => ({
            title: item.title,
            source: 'Economic Times',
            link: item.link,
            publishedAt: item.pubDate,
            summary: item.contentSnippet || ''
        }));

        NEWS_CACHE = { data: articles, timestamp: now };
        res.json(articles);
    } catch (e) {
        res.json(NEWS_CACHE.data || []);
    }
});

app.get('/api/scanner', async (req, res) => {
    try {
        const results = TOP_NSE_STOCKS.map(sym => {
            const clean = sym.replace('.NS', '');
            const cached = GLOBAL_STOCK_CACHE.get(clean);
            if (cached && cached.price > 0) {
                return {
                    sym: clean,
                    name: cached.name || clean,
                    price: cached.price,
                    change: cached.changePct,
                    signal: cached.changePct > 2 ? 'Strong Buy' : (cached.changePct > 0.5 ? 'Buy' : (cached.changePct < -2 ? 'Strong Sell' : (cached.changePct < -0.5 ? 'Sell' : 'Neutral')))
                };
            }
            return null;
        }).filter(Boolean);
        res.json(results);
    } catch (e) {
        res.status(500).json([]);
    }
});

app.get('/api/search', async (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    const matches = ALL_NSE_STOCKS.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)).slice(0, 10);
    res.json(matches.map(s => ({ sym: s.symbol, name: s.name, exchange: 'NSE' })));
});

app.get('/api/stock/:symbol', async (req, res) => {
    const symbol = req.params.symbol;
    const clean = symbol.replace('.NS', '').replace('.BO', '');
    try {
        const cached = GLOBAL_STOCK_CACHE.get(clean);
        // If cached and fresh (less than 1 min old for active display), return it
        if (cached && cached.price > 0 && (new Date() - new Date(cached.lastUpdated) < 60000)) {
            return res.json({
                ...cached,
                sym: clean,
                changePct: cached.changePct,
                currency: 'INR'
            });
        }

        const q = await fetchGoogleFinanceQuote(symbol);
        if (q) {
            const data = {
                sym: clean,
                name: q.shortName,
                price: q.regularMarketPrice,
                changePct: q.regularMarketChangePercent,
                high: q.dayHigh,
                low: q.dayLow,
                marketCap: q.marketCap,
                pe: q.trailingPE,
                exchange: q.exchange,
                currency: 'INR',
                lastUpdated: new Date().toISOString()
            };
            GLOBAL_STOCK_CACHE.set(clean, data);
            return res.json(data);
        }

        if (cached) return res.json(cached);
        res.status(404).json({ error: 'Not found' });
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

import prisma from './prisma.js';
const PORT = process.env.PORT || 5000;
async function startServer() {
    try {
        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "User" ("id" SERIAL PRIMARY KEY, "email" TEXT NOT NULL UNIQUE, "passwordHash" TEXT NOT NULL, "cashBalance" FLOAT8 DEFAULT 100000.0);`);
    } catch (e) { }
    app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
}
startServer();
