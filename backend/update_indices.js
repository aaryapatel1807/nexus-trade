import fs from 'fs';
const path = 'server.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Define the Index Map and Expand TOP_NSE_STOCKS
const indexMapSnippet = `
// Map internal/Yahoo symbols to Google Finance symbols
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
    'EICHERMOT.NS', 'NESTLEIND.NS', 'DRREDDY.NS', 'CIPLA.NS'
];
`;

// Replace the old TOP_NSE_STOCKS or insert near the top
if (content.includes('const TOP_NSE_STOCKS = [')) {
    content = content.replace(/const TOP_NSE_STOCKS = \[[\s\S]*?\];/, indexMapSnippet);
} else {
    // Insert after imports if not found
    content = content.replace(/import yahooFinance from 'yahoo-finance2';/, \`import yahooFinance from 'yahoo-finance2';\\n\${indexMapSnippet}\`);
}

// 2. Update fetchGoogleFinanceQuote for Indices and PdOqHc scoping
const newScraper = \`// Fetch quote by scraping Google Finance (Bypasses all API limits and cloud blocks)
async function fetchGoogleFinanceQuote(sym) {
    const cleanSym = sym.replace('.NS', '').replace('.BO', '');
    
    // Check if it's an index and use the mapped symbol, otherwise try NSE/BOM
    const gfSymbol = INDEX_MAP[sym] || INDEX_MAP['^' + cleanSym] || null;
    const exchanges = gfSymbol ? [gfSymbol] : [\`\\\${cleanSym}:NSE\`, \`\\\${cleanSym}:BOM\`];
    
    let lastError = null;

    for (const target of exchanges) {
        try {
            const url = target.includes(':') 
                ? \\\`https://www.google.com/finance/quote/\\\${target}\\\`
                : \\\`https://www.google.com/finance/quote/\\\${target}:NSE\\\`;
                
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

            // Scope price and change to the MAIN instrument div (.PdOqHc)
            const mainSectionStart = html.indexOf('class="PdOqHc"');
            if (mainSectionStart === -1) continue;
            const mainHtml = html.slice(mainSectionStart, mainSectionStart + 2000);

            const priceMatch = mainHtml.match(/class="YMlKec[^"]*">([^<]+)</);
            if (!priceMatch) continue;

            const price = parseFloat(priceMatch[1].replace(/[^0-9.]/g, ''));
            if (isNaN(price)) continue;

            // Extract percentage change from the main section only
            let changePercent = 0;
            const rx = /class="[^"]*(P6uUr|Jw7Of)[^"]*">.*?([+-]?[0-9,.]+)%</s;
            const m = mainHtml.match(rx);
            if (m) changePercent = parseFloat(m[2]);

            // --- ENHANCED STATS SCRAPER ---
            const stats = {};
            const statsRx = /class="mfs7be">([^<]+)<\\\\/div><div class="P6uYm">([^<]+)<\\\\/div>/g;
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
                dividendYield: stats['DIVIDEND%20YIELD'] || null,
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
    throw lastError || new Error(\\\`Failed to scrape \\\${sym} from any exchange\\\`);
}\`;

const scraperRegex = /\\/\\/ Fetch quote by scraping Google Finance[\\s\\S]*?async function fetchGoogleFinanceQuote[\\s\\S]*?\\{[\\s\\S]*?\\n\\}/;
content = content.replace(scraperRegex, newScraper);

fs.writeFileSync(path, content);
console.log('✅ server.js updated with INDEX_MAP and robust PdOqHc scraper');
