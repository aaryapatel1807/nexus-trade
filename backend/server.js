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
    console.warn('Finnhub init failed, will use Yahoo Finance as fallback:', e.message);
}

import authRoutes from './routes/auth.js';
import tradeRoutes from './routes/trade.js';
import chatRoutes from './routes/chat.js';

const app = express();

// Allow requests from localhost (dev) and any *.onrender.com subdomain (production)
app.use(cors({
    origin: (origin, callback) => {
        // Allow: no origin (server-to-server, Postman), localhost, or any Render-hosted frontend
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

import YahooFinance from 'yahoo-finance2';
const FINNHUB_KEY = process.env.FINNHUB_API_KEY || '';

// Convert Yahoo Finance symbol (RELIANCE.NS) → Finnhub symbol (NSE:RELIANCE)
function toFinnhubSymbol(sym) {
    if (sym.endsWith('.NS')) return `NSE:${sym.replace('.NS', '')}`;
    if (sym.endsWith('.BO')) return `BSE:${sym.replace('.BO', '')}`;
    return null; // indices like ^NSEI not supported
}

// Fetch quote from Finnhub REST API directly (no SDK needed)
async function fetchFinnhubQuote(sym) {
    const fhSym = toFinnhubSymbol(sym);
    if (!fhSym || !FINNHUB_KEY) throw new Error('No Finnhub symbol or key');
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(fhSym)}&token=${FINNHUB_KEY}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Finnhub HTTP ${r.status}`);
    const d = await r.json();
    if (!d.c || d.c === 0) throw new Error(`Finnhub returned 0 for ${fhSym}`);
    return {
        regularMarketPrice: d.c,
        regularMarketChangePercent: d.pc ? ((d.c - d.pc) / d.pc * 100) : 0,
        shortName: sym.replace('.NS', '').replace('.BO', ''),
        marketCap: 0, forwardPE: null, trailingPE: null,
    };
}

app.get('/api/stocks', async (req, res) => {
    try {
        const symbolsStr = req.query.symbols || 'RELIANCE.NS,TCS.NS,HDFCBANK.NS,INFY.NS,SBIN.NS';
        const symbols = symbolsStr.split(',');

        const results = await Promise.all(symbols.map(async (sym) => {
            const returnSym = sym.startsWith('^') ? sym : sym.replace('.NS', '').replace('.BO', '');
            try {
                // Try Finnhub first (works on cloud), fallback to Yahoo library
                let quote;
                try {
                    quote = await fetchFinnhubQuote(sym);
                } catch (fhErr) {
                    console.log(`Finnhub failed for ${sym} (${fhErr.message}), trying Yahoo...`);
                    const yf = typeof YahooFinance === 'function' ? new YahooFinance() : YahooFinance;
                    quote = await yf.quote(sym, {}, { validateResult: false });
                }
                return {
                    sym: returnSym,
                    name: quote.shortName || quote.longName || returnSym,
                    price: quote.regularMarketPrice || 0,
                    change: quote.regularMarketChangePercent || 0,
                    value: quote.marketCap || 0,
                    pe: quote.forwardPE || quote.trailingPE || 'N/A',
                    cap: quote.marketCap ? (quote.marketCap / 1e9).toFixed(1) + 'B' : 'N/A'
                };
            } catch (err) {
                console.error(`Failed fetching ${sym}:`, err.message);
                return { sym: returnSym, name: returnSym, price: 0, change: 0, value: 0, pe: 'N/A', cap: 'N/A' };
            }
        }));

        res.json(results);
    } catch (error) {
        console.error('Error serving stock data:', error);
        res.status(500).json({ error: 'Failed to fetch stock data' });
    }
});


app.get('/api/stocks/history', async (req, res) => {
    try {
        const symbol = req.query.symbol || 'RELIANCE.NS';
        const period = (req.query.period || '1m').toLowerCase();

        const periodMap = {
            '1d': { range: '1d', interval: '15m' },
            '1w': { range: '5d', interval: '15m' }, // Yahoo API prefers '5d' for 1 week
            '1m': { range: '1mo', interval: '1d' },
            '3m': { range: '3mo', interval: '1d' },
            '1y': { range: '1y', interval: '1wk' },
            'all': { range: 'max', interval: '1mo' },
        };

        const config = periodMap[period] || periodMap['1m'];
        const isIntraday = ['15m', '5m', '1m', '30m', '60m', '1h'].includes(config.interval);

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${config.range}&interval=${config.interval}`;
        const YF_HEADERS = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Origin': 'https://finance.yahoo.com',
            'Referer': 'https://finance.yahoo.com/',
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        let formattedData = [];
        try {
            const r = await fetch(url, { headers: YF_HEADERS, signal: controller.signal });
            clearTimeout(timeout);

            if (!r.ok) throw new Error(`Yahoo HTTP ${r.status}`);
            const json = await r.json();

            const result = json?.chart?.result?.[0];
            if (result && result.timestamp && result.indicators?.quote?.[0]?.close) {
                const timestamps = result.timestamp;
                const closes = result.indicators.quote[0].close;

                for (let i = 0; i < timestamps.length; i++) {
                    if (closes[i] !== null && closes[i] !== undefined) {
                        const d = new Date(timestamps[i] * 1000);
                        const label = isIntraday
                            ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
                            : d.toISOString().slice(5, 10).replace('-', '/');

                        formattedData.push({
                            time: label,
                            fullDate: d.toISOString(),
                            value: parseFloat(closes[i].toFixed(2))
                        });
                    }
                }
            }
        } catch (fetchErr) {
            console.error(`Direct fetch failed for ${symbol}:`, fetchErr.message);
            // Fallback to library just in case
            const yf = typeof YahooFinance === 'function' ? new YahooFinance() : YahooFinance;
            const fallback = await yf.chart(symbol, { period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), interval: '1d' });
            if (fallback?.quotes) {
                formattedData = fallback.quotes
                    .filter(q => q.close !== null)
                    .map(q => {
                        const d = new Date(q.date);
                        return { time: d.toISOString().slice(5, 10).replace('-', '/'), fullDate: d.toISOString(), value: parseFloat(q.close.toFixed(2)) };
                    });
            }
        }

        res.json(formattedData);
    } catch (error) {
        console.error('Error fetching historical data:', error.message);
        res.status(500).json({ error: 'Failed to fetch historical data' });
    }
});


// NEWS FEED --- uses Google Finance RSS (no API key required)
import RSSParser from 'rss-parser';
const rssParser = new RSSParser({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
    }
});

app.get('/api/news', async (req, res) => {
    try {
        // Multiple financial RSS sources for India + Global
        const feeds = [
            'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
            'https://www.moneycontrol.com/rss/latestnews.xml',
        ];

        const results = await Promise.allSettled(feeds.map(url => rssParser.parseURL(url)));

        let articles = [];
        results.forEach(r => {
            if (r.status === 'fulfilled' && r.value.items) {
                r.value.items.slice(0, 8).forEach(item => {
                    articles.push({
                        title: item.title || 'Market Update',
                        source: r.value.title || 'Financial News',
                        link: item.link || '#',
                        publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
                        summary: item.contentSnippet || item.content || '',
                    });
                });
            }
        });

        // Sort by date descending, limit to 10
        articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        articles = articles.slice(0, 10);

        res.json(articles);
    } catch (error) {
        console.error('News fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// SCANNER --- Fetches live NSE top stocks as the default scan
const TOP_NSE_STOCKS = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'SBIN.NS',
    'ICICIBANK.NS', 'HINDUNILVR.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS',
    'LT.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'SUNPHARMA.NS'
];

app.get('/api/scanner', async (req, res) => {
    try {
        const results = await Promise.allSettled(
            TOP_NSE_STOCKS.map(sym => yahooFinance.quote(sym))
        );

        const stocks = results
            .map((r, i) => {
                if (r.status !== 'fulfilled' || !r.value) return null;
                const q = r.value;
                return {
                    sym: q.symbol?.replace('.NS', '') || TOP_NSE_STOCKS[i].replace('.NS', ''),
                    name: q.longName || q.shortName || q.symbol,
                    price: q.regularMarketPrice || 0,
                    change: q.regularMarketChangePercent || 0,
                    volume: q.regularMarketVolume || 0,
                    cap: q.marketCap
                        ? q.marketCap >= 1e12
                            ? `₹${(q.marketCap / 1e12).toFixed(2)}T`
                            : `₹${(q.marketCap / 1e7).toFixed(0)}Cr`
                        : 'N/A',
                    pe: q.trailingPE ? parseFloat(q.trailingPE.toFixed(1)) : null,
                    high52w: q.fiftyTwoWeekHigh || 0,
                    low52w: q.fiftyTwoWeekLow || 0,
                    signal: q.regularMarketChangePercent > 2 ? 'Strong Buy'
                        : q.regularMarketChangePercent > 0.5 ? 'Buy'
                            : q.regularMarketChangePercent < -2 ? 'Strong Sell'
                                : q.regularMarketChangePercent < -0.5 ? 'Sell'
                                    : 'Neutral',
                };
            })
            .filter(Boolean);

        res.json(stocks);
    } catch (error) {
        console.error('Scanner fetch error:', error);
        res.status(500).json({ error: 'Scanner failed' });
    }
});

// STOCK SEARCH
app.get('/api/search', async (req, res) => {
    try {
        const q = req.query.q;
        if (!q || q.length < 1) return res.json([]);

        const results = await yahooFinance.search(q, { newsCount: 0, quotesCount: 15 });
        const allQuotes = results.quotes || [];

        // Prefer NSE/BSE stocks, fall back to all equities
        let quotes = allQuotes.filter(r => r.symbol?.endsWith('.NS') || r.symbol?.endsWith('.BO'));
        if (quotes.length < 3) {
            quotes = allQuotes.filter(r => r.typeDisp === 'Equity');
        }

        const mapped = quotes.slice(0, 8).map(r => ({
            sym: r.symbol?.replace('.NS', '').replace('.BO', ''),
            rawSym: r.symbol,
            name: r.longname || r.shortname || r.symbol,
            exchange: r.exchDisp || 'NSE',
            type: r.typeDisp || 'Equity',
        }));

        res.json(mapped);
    } catch (err) {
        console.error('Search error:', err.message);
        res.json([]);
    }
});

// SINGLE STOCK FULL DETAILS
app.get('/api/stock/:symbol', async (req, res) => {
    try {
        let symbol = req.params.symbol;
        if (!symbol.includes('.')) symbol = symbol + '.NS';

        // 1. Fetch metadata and historical profile from Yahoo Finance
        const [quote, summaryDetail] = await Promise.allSettled([
            yahooFinance.quote(symbol),
            yahooFinance.quoteSummary(symbol, { modules: ['assetProfile', 'summaryDetail', 'defaultKeyStatistics'] })
        ]);

        const q = quote.status === 'fulfilled' ? quote.value : {};
        const s = summaryDetail.status === 'fulfilled' ? summaryDetail.value : {};
        const profile = s.assetProfile || {};
        const stats = s.defaultKeyStatistics || {};
        const summary = s.summaryDetail || {};

        // 2. Attempt to fetch ultra-fast real-time price from Finnhub
        let finnhubQuote = null;
        if (process.env.FINNHUB_API_KEY) {
            try {
                finnhubQuote = await new Promise((resolve, reject) => {
                    // Finnhub uses slightly different tickers for international (e.g., RELIANCE.NS)
                    finnhubClient.quote(symbol, (error, data, response) => {
                        if (error) reject(error);
                        else resolve(data);
                    });
                });
            } catch (fhError) {
                console.warn(`Finnhub quote failed for ${symbol}, falling back to Yahoo Finance`, fhError?.message || '');
            }
        }

        // 3. Merge data (Prioritize Finnhub for price/change, fallback to Yahoo)
        const currentPrice = finnhubQuote && finnhubQuote.c ? finnhubQuote.c : (q.regularMarketPrice || 0);
        const priceChange = finnhubQuote && finnhubQuote.d ? finnhubQuote.d : (q.regularMarketChange || 0);
        const priceChangePct = finnhubQuote && finnhubQuote.dp ? finnhubQuote.dp : (q.regularMarketChangePercent || 0);
        const dayHigh = finnhubQuote && finnhubQuote.h ? finnhubQuote.h : (q.regularMarketDayHigh || 0);
        const dayLow = finnhubQuote && finnhubQuote.l ? finnhubQuote.l : (q.regularMarketDayLow || 0);
        const dayOpen = finnhubQuote && finnhubQuote.o ? finnhubQuote.o : (q.regularMarketOpen || 0);

        res.json({
            sym: q.symbol?.replace('.NS', '').replace('.BO', '') || symbol.replace('.NS', ''),
            rawSym: q.symbol || symbol,
            name: q.longName || q.shortName || symbol,
            price: currentPrice,
            change: priceChange,
            changePct: priceChangePct,
            open: dayOpen,
            high: dayHigh,
            low: dayLow,
            volume: q.regularMarketVolume || 0,
            avgVolume: q.averageDailyVolume3Month || 0,
            marketCap: q.marketCap || 0,
            high52w: q.fiftyTwoWeekHigh || 0,
            low52w: q.fiftyTwoWeekLow || 0,
            pe: q.trailingPE || null,
            eps: q.epsTrailingTwelveMonths || null,
            dividendYield: summary.dividendYield || null,
            beta: q.beta || null,
            sector: profile.sector || '',
            industry: profile.industry || '',
            description: profile.longBusinessSummary || '',
            website: profile.website || '',
            employees: profile.fullTimeEmployees || null,
            exchange: q.fullExchangeName || 'NSE',
            currency: q.currency || 'INR',
        });
    } catch (err) {
        console.error('Stock detail error:', err.message);
        res.status(500).json({ error: 'Failed to fetch stock details' });
    }
});

const PORT = process.env.PORT || 5000;

import prisma from './prisma.js';

// Auto-create tables on startup using raw SQL — no CLI needed
async function startServer() {
    try {
        console.log('Connecting to database and creating tables if needed...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "User" (
                "id"           SERIAL PRIMARY KEY,
                "email"        TEXT    NOT NULL UNIQUE,
                "passwordHash" TEXT    NOT NULL,
                "name"         TEXT    DEFAULT '',
                "cashBalance"  FLOAT8  DEFAULT 100000.0,
                "createdAt"    TIMESTAMPTZ DEFAULT NOW(),
                "updatedAt"    TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Portfolio" (
                "id"           SERIAL PRIMARY KEY,
                "userId"       INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
                "symbol"       TEXT    NOT NULL,
                "quantity"     INTEGER DEFAULT 0,
                "averagePrice" FLOAT8  DEFAULT 0.0,
                "updatedAt"    TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE ("userId", "symbol")
            );
        `);
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Transaction" (
                "id"        SERIAL PRIMARY KEY,
                "userId"    INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
                "symbol"    TEXT    NOT NULL,
                "type"      TEXT    NOT NULL,
                "quantity"  INTEGER NOT NULL,
                "price"     FLOAT8  NOT NULL,
                "timestamp" TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('✅ Database tables ready.');
    } catch (err) {
        console.error('⚠ Table creation warning:', err.message);
        // Continue starting the server — tables may already exist
    }

    app.listen(PORT, () => {
        console.log(`🚀 Backend running on port ${PORT}`);
    });
}

startServer();
