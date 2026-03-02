import fs from 'fs';
const path = 'server.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace fetchGoogleFinanceQuote
const newScraper = `// Fetch quote by scraping Google Finance (Bypasses all API limits and cloud blocks)
async function fetchGoogleFinanceQuote(sym) {
    const cleanSym = sym.replace('.NS', '').replace('.BO', '');
    const exchanges = ['NSE', 'BOM']; // Try NSE first, then BSE (BOM)
    let lastError = null;

    for (const exchange of exchanges) {
        try {
            const url = \`https://www.google.com/finance/quote/\${cleanSym}:\${exchange}\`;
            const r = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Referer': 'https://www.google.com/finance/'
                }
            });

            if (!r.ok) continue;
            const html = await r.text();

            const priceStart = html.indexOf('class="YMlKec fxKbKc"');
            if (priceStart === -1) continue;
            
            const priceMatch = html.slice(priceStart, priceStart + 150).match(/>([^<]+)</);
            if (!priceMatch) continue;

            const price = parseFloat(priceMatch[1].replace(/[^0-9.]/g, ''));
            if (isNaN(price)) continue;

            let changePercent = 0;
            const rx = />([+-]?[0-9,.]+)%</g;
            let m;
            let foundChanges = [];
            while ((m = rx.exec(html)) !== null) {
                foundChanges.push(parseFloat(m[1]));
            }
            if (foundChanges.length > 0) changePercent = foundChanges[0];

            const stats = {};
            const statsRx = /class="mfs7be">([^<]+)<\\/div><div class="P6uYm">([^<]+)<\\/div>/g;
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
                marketCap: stats['MARKET CAP'] || 0,
                trailingPE: parseFloat(stats['P/E RATIO']) || null,
                dividendYield: stats['DIVIDEND YIELD'] || null,
                regularMarketDayLow: dayRange[0],
                regularMarketDayHigh: dayRange[1],
                fiftyTwoWeekLow: yearRange[0],
                fiftyTwoWeekHigh: yearRange[1],
                averageDailyVolume3Month: stats['AVG VOLUME'] || 0,
                exchange: exchange === 'BOM' ? 'BSE' : 'NSE'
            };
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError || new Error(\`Failed to scrape \${sym} after trying NSE and BSE\`);
}`;

const scraperRegex = /\/\/ Fetch quote by scraping Google Finance[\s\S]*?async function fetchGoogleFinanceQuote[\s\S]*?\{[\s\S]*?\n\}/;
content = content.replace(scraperRegex, newScraper);

// 2. Fix /api/stock/:symbol scoping
const newRoute = `app.get('/api/stock/:symbol', async (req, res) => {
    let symbol = req.params.symbol;
    if (!symbol.includes('.')) symbol = symbol + '.NS';

    try {
        const [quote, summaryDetail, assetProfile] = await Promise.all([
            yahooFinance.quote(symbol).catch(e => { console.warn('Yahoo Quote failed:', e.message); return { status: 'rejected', reason: e }; }),
            yahooFinance.quoteSummary(symbol, { modules: ["summaryDetail", "defaultKeyStatistics"] }).catch(e => ({ status: 'rejected', reason: e })),
            yahooFinance.quoteSummary(symbol, { modules: ["assetProfile"] }).catch(e => ({ status: 'rejected', reason: e }))
        ]);

        const q = quote.status !== 'rejected' ? quote : {};
        const s = summaryDetail.status !== 'rejected' ? summaryDetail : {};
        const profile = assetProfile.status !== 'rejected' ? assetProfile.assetProfile || {} : {};
        const stats = s.defaultKeyStatistics || {};
        const summary = s.summaryDetail || {};

        let finnhubQuote = null;
        if (process.env.FINNHUB_API_KEY) {
            try {
                finnhubQuote = await new Promise((resolve, reject) => {
                    finnhubClient.quote(symbol, (error, data, response) => {
                        if (error) reject(error);
                        else resolve(data);
                    });
                });
            } catch (fhError) {
                console.warn(\`Finnhub quote failed for \${symbol}, falling back to Yahoo Finance\`, fhError?.message || '');
            }
        }

        const currentPrice = finnhubQuote && finnhubQuote.c ? finnhubQuote.c : (q.regularMarketPrice || 0);
        const priceChange = finnhubQuote && finnhubQuote.d ? finnhubQuote.d : (q.regularMarketChange || 0);
        const priceChangePercent = finnhubQuote && finnhubQuote.dp ? finnhubQuote.dp : (q.regularMarketChangePercent || 0);
        const dayHigh = finnhubQuote && finnhubQuote.h ? finnhubQuote.h : (q.regularMarketDayHigh || 0);
        const dayLow = finnhubQuote && finnhubQuote.l ? finnhubQuote.l : (q.regularMarketDayLow || 0);
        const dayOpen = finnhubQuote && finnhubQuote.o ? finnhubQuote.o : (q.regularMarketOpen || 0);

        if (!currentPrice || currentPrice === 0) throw new Error('No price returned from Yahoo/Finnhub');

        res.json({
            sym: q.symbol?.replace('.NS', '').replace('.BO', '') || symbol.replace('.NS', ''),
            rawSym: q.symbol || symbol,
            name: q.longName || q.shortName || symbol,
            price: currentPrice,
            change: priceChange,
            changePct: priceChangePercent,
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
        console.warn(\`Yahoo Detail failed for \${symbol}, using Scraper fallback:\`, err.message);
        try {
            const cached = GLOBAL_STOCK_CACHE.get(symbol.replace('.NS', ''));
            const scraped = await fetchGoogleFinanceQuote(symbol);
            res.json({
                sym: symbol.replace('.NS', ''),
                rawSym: symbol,
                name: scraped.shortName || cached?.name || symbol.replace('.NS', ''),
                price: scraped.regularMarketPrice,
                change: (scraped.regularMarketPrice * (scraped.regularMarketChangePercent / 100)),
                changePct: scraped.regularMarketChangePercent,
                open: 0,
                high: scraped.regularMarketDayHigh,
                low: scraped.regularMarketDayLow,
                volume: 0,
                avgVolume: scraped.averageDailyVolume3Month,
                marketCap: scraped.marketCap,
                high52w: scraped.fiftyTwoWeekHigh,
                low52w: scraped.fiftyTwoWeekLow,
                pe: scraped.trailingPE,
                eps: null,
                dividendYield: scraped.dividendYield,
                beta: null,
                sector: '',
                industry: '',
                description: '',
                website: '',
                employees: null,
                exchange: scraped.exchange || 'NSE',
                currency: 'INR',
                lastUpdated: new Date().toISOString()
            });
        } catch (scrapErr) {
            console.error('Total fallback failure:', scrapErr.message);
            res.status(500).json({ error: 'Failed to fetch stock details' });
        }
    }
});`;

const routeRegex = /app\.get\('\/api\/stock\/:symbol'[\s\S]*?\}\);/;
content = content.replace(routeRegex, newRoute);

fs.writeFileSync(path, content);
console.log('✅ server.js updated successfully');
