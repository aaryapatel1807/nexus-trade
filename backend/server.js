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
    'M&M.NS', 'ADANIENT.NS', 'TITAN.NS', 'ULTRACEMCO.NS', 'JIOFIN.NS'
];

import yahooFinance from 'yahoo-finance2';

// --- ROBUST GOOGLE FINANCE SCRAPER ---
async function fetchGoogleFinanceQuote(sym) {
    const cleanSym = sym.replace('.NS', '').replace('.BO', '');
    const gfSymbol = INDEX_MAP[sym] || INDEX_MAP['^' + cleanSym] || null;
    const exchanges = gfSymbol ? [gfSymbol] : [`${cleanSym}:NSE`, `${cleanSym}:BOM`];

    let lastError = null;
    for (const target of exchanges) {
        try {
            const url = `https://www.google.com/finance/quote/${target}`;
            const r = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://www.google.com/finance/'
                }
            });

            if (!r.ok) continue;
            const html = await r.text();

            // 1. Precise Quote Extraction from SSR Data Blobs
            // Google Finance provides a structured array [price, change, percent, 2, 2, 2/3] 
            // in its AF_initDataCallback blocks (usually ds:17 or ds:16).
            // This is the most reliable source for the primary instrument's data.
            const dataArrayRegex = /\[([0-9,.]+),([-+0-9,.]+),([-+0-9,.]+),2,2,[2-4]\]/;
            const dataMatch = html.match(dataArrayRegex);

            let price = 0;
            let changePercent = 0;

            if (dataMatch) {
                price = parseFloat(dataMatch[1].replace(/,/g, ''));
                changePercent = parseFloat(dataMatch[3]);
            } else {
                // Fallback to legacy price selector if array not found
                const priceRegex = /class="YMlKec fxKbKc">([^<]+)</;
                const priceMatch = html.match(priceRegex);
                if (priceMatch) {
                    price = parseFloat(priceMatch[1].replace(/[^0-9.]/g, ''));
                }

                // Fallback for percentage
                const ariaMatch = html.match(/aria-label="(Up|Down) by ([0-9,.]+)%"/);
                if (ariaMatch) {
                    changePercent = parseFloat(ariaMatch[2]) * (ariaMatch[1] === 'Down' ? -1 : 1);
                }
            }

            if (price === 0) continue;

            // 3. Stats extraction
            const stats = {};
            const statsRx = /class="mfs7be">([^<]+)<\/div><div class="P6uYm">([^<]+)<\/div>/g;
            let sm;
            while ((sm = statsRx.exec(html)) !== null) {
                stats[sm[1].trim().toUpperCase()] = sm[2].trim();
            }

            const parseRange = (str) => {
                if (!str) return [0, 0];
                const parts = str.split(' - ').map(p => parseFloat(p.replace(/[^0-9.]/g, '')) || 0);
                return parts.length === 2 ? parts : [parts[0], parts[0]];
            };

            const dayRange = parseRange(stats['DAY RANGE']);
            const yearRange = parseRange(stats['YEAR RANGE']);

            return {
                regularMarketPrice: price,
                regularMarketChangePercent: changePercent,
                shortName: cleanSym,
                marketCap: stats['MARKET CAP'] || 'N/A',
                trailingPE: parseFloat(stats['P/E RATIO']) || 'N/A',
                dividendYield: stats['DIVIDEND YIELD'] || 'N/A',
                regularMarketDayLow: dayRange[0],
                regularMarketDayHigh: dayRange[1],
                fiftyTwoWeekLow: yearRange[0],
                fiftyTwoWeekHigh: yearRange[1],
                averageDailyVolume3Month: stats['AVG VOLUME'] || 0,
                exchange: target.includes('BOM') ? 'BSE' : 'NSE'
            };
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError || new Error(`No data found for ${sym}`);
}

// --- BACKGROUND WORKER ---
async function startBackgroundWorker() {
    console.log('🚀 Starting Background Stock Worker (2,264 stocks)...');
    let currentIndex = 0;
    const BATCH_SIZE = 10;

    setInterval(async () => {
        const batch = ALL_NSE_STOCKS.slice(currentIndex, currentIndex + BATCH_SIZE);
        currentIndex = (currentIndex + BATCH_SIZE) % ALL_NSE_STOCKS.length;

        for (const stock of batch) {
            try {
                const data = await fetchGoogleFinanceQuote(`${stock.symbol}.NS`);
                GLOBAL_STOCK_CACHE.set(stock.symbol, {
                    ...stock,
                    price: data.regularMarketPrice,
                    changePct: data.regularMarketChangePercent,
                    high: data.regularMarketDayHigh,
                    low: data.regularMarketDayLow,
                    marketCap: data.marketCap,
                    pe: data.trailingPE,
                    divYield: data.dividendYield,
                    yearHigh: data.fiftyTwoWeekHigh,
                    yearLow: data.fiftyTwoWeekLow,
                    lastUpdated: new Date().toISOString()
                });
            } catch (err) { }
        }
    }, 5000);
}
startBackgroundWorker();

const cache = { quotes: {}, history: {} };
const CACHE_TTL_MS = 60 * 1000;

app.get('/api/stocks', async (req, res) => {
    try {
        const symbols = (req.query.symbols || 'RELIANCE.NS,TCS.NS,HDFCBANK.NS').split(',');
        const now = Date.now();

        const results = await Promise.all(symbols.map(async (sym) => {
            const returnSym = sym.startsWith('^') ? sym : sym.replace('.NS', '').replace('.BO', '');
            if (cache.quotes[sym] && (now - cache.quotes[sym].timestamp < CACHE_TTL_MS)) {
                return cache.quotes[sym].data;
            }

            try {
                const quote = await fetchGoogleFinanceQuote(sym);
                const newData = {
                    sym: returnSym,
                    name: quote.shortName || returnSym,
                    price: quote.regularMarketPrice || 0,
                    change: quote.regularMarketChangePercent || 0,
                    value: quote.marketCap || 0,
                    pe: quote.trailingPE || 'N/A',
                    cap: quote.marketCap
                };
                cache.quotes[sym] = { data: newData, timestamp: now };
                return newData;
            } catch (err) {
                if (cache.quotes[sym]) return cache.quotes[sym].data;
                return { sym: returnSym, name: returnSym, price: 0, change: 0, value: 0, pe: 'N/A', cap: 'N/A' };
            }
        }));

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stocks' });
    }
});

app.get('/api/stocks/history', async (req, res) => {
    try {
        const symbol = req.query.symbol || 'RELIANCE.NS';
        const period = (req.query.period || '1m').toLowerCase();
        const cacheKey = `${symbol}-${period}`;

        if (cache.history[cacheKey] && (Date.now() - cache.history[cacheKey].timestamp < CACHE_TTL_MS)) {
            return res.json(cache.history[cacheKey].data);
        }

        // Anchoring to real price for synthesis
        let anchorPrice = 1000;
        try {
            const fresh = await fetchGoogleFinanceQuote(symbol);
            anchorPrice = fresh.regularMarketPrice;
        } catch (e) { }

        const dataPoints = period === '1d' ? 50 : 30;
        let formattedData = [];
        let simPrice = anchorPrice;
        for (let i = 0; i < dataPoints; i++) {
            formattedData.push({ time: i, value: parseFloat(simPrice.toFixed(2)) });
            simPrice = simPrice / (1 + (Math.random() - 0.48) * 0.005);
        }
        formattedData.reverse();
        cache.history[cacheKey] = { data: formattedData, timestamp: Date.now() };
        res.json(formattedData);
    } catch (e) {
        res.status(500).json({ error: 'Failed' });
    }
});

import RSSParser from 'rss-parser';
const rssParser = new RSSParser();

app.get('/api/news', async (req, res) => {
    try {
        const feeds = ['https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms'];
        const feed = await rssParser.parseURL(feeds[0]);
        const articles = feed.items.slice(0, 10).map(item => ({
            title: item.title,
            source: 'Economic Times',
            link: item.link,
            publishedAt: item.pubDate,
            summary: item.contentSnippet || ''
        }));
        res.json(articles);
    } catch (e) {
        res.status(500).json([]);
    }
});

app.get('/api/scanner', async (req, res) => {
    try {
        const results = await Promise.all(TOP_NSE_STOCKS.map(async sym => {
            try {
                const q = await fetchGoogleFinanceQuote(sym);
                return {
                    sym: sym.replace('.NS', ''),
                    name: q.shortName,
                    price: q.regularMarketPrice,
                    change: q.regularMarketChangePercent,
                    signal: q.regularMarketChangePercent > 0.5 ? 'Buy' : 'Neutral'
                };
            } catch (e) { return null; }
        }));
        res.json(results.filter(Boolean));
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
    try {
        const q = await fetchGoogleFinanceQuote(symbol);
        res.json({
            sym: symbol.replace('.NS', ''),
            name: q.shortName,
            price: q.regularMarketPrice,
            changePct: q.regularMarketChangePercent,
            high: q.regularMarketDayHigh,
            low: q.regularMarketDayLow,
            marketCap: q.marketCap,
            pe: q.trailingPE,
            divYield: q.dividendYield,
            high52w: q.fiftyTwoWeekHigh,
            low52w: q.fiftyTwoWeekLow,
            exchange: q.exchange,
            currency: 'INR'
        });
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
