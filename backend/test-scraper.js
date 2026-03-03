import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const INDEX_MAP = {
    '^NSEI': 'NIFTY_50:INDEXNSE',
    '^BSESN': 'SENSEX:INDEXBOM',
    '^NSEBANK': 'NIFTY_BANK:INDEXNSE',
    '^CNXIT': 'NIFTY_IT:INDEXNSE',
    '^VIX': 'INDIAVIX:INDEXNSE'
};

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

            const dataArrayRegex = /\[([0-9,.]+),([-+0-9,.]+),([-+0-9,.]+),2,2,[2-4]\]/;
            const dataMatch = html.match(dataArrayRegex);

            let price = 0;
            let changePercent = 0;

            if (dataMatch) {
                price = parseFloat(dataMatch[1].replace(/,/g, ''));
                changePercent = parseFloat(dataMatch[3]);
            } else {
                const priceMatch = html.match(/class="YMlKec fxKbKc">([^<]+)</);
                if (priceMatch) {
                    price = parseFloat(priceMatch[1].replace(/[^0-9.]/g, ''));
                }
                const ariaMatch = html.match(/aria-label="(Up|Down) by ([0-9,.]+)%"/);
                if (ariaMatch) {
                    changePercent = parseFloat(ariaMatch[2]) * (ariaMatch[1] === 'Down' ? -1 : 1);
                }
            }

            return {
                symbol: sym,
                price: price,
                changePercent: changePercent,
                target: target
            };
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError || new Error(`No data found for ${sym}`);
}

async function runTest() {
    const symbols = ['^NSEI', '^BSESN', 'RELIANCE.NS', 'HDFCBANK.NS', 'ITC.NS'];
    console.log('--- SCRAPER TEST START ---');

    const results = [];
    for (const sym of symbols) {
        try {
            const data = await fetchGoogleFinanceQuote(sym);
            results.push(data);
            console.log(`✅ ${sym}: Price=${data.price}, Change=${data.changePercent}% (via ${data.target})`);
        } catch (e) {
            console.log(`❌ ${sym}: Failed - ${e.message}`);
        }
    }

    const percentages = results.map(r => r.changePercent);
    const uniquePercentages = new Set(percentages);

    console.log('\n--- ANALYSIS ---');
    console.log(`Total results: ${results.length}`);
    console.log(`Unique percentages: ${uniquePercentages.size}`);

    if (uniquePercentages.size === 1 && results.length > 1) {
        console.log('🔴 FAILURE: All stocks show the same percentage change!');
    } else if (uniquePercentages.size < results.length) {
        console.log('⚠️ WARNING: Some stocks share the same percentage (could be coincidence, check carefully).');
    } else {
        console.log('🟢 SUCCESS: All stocks show distinct percentage changes.');
    }

    const zeroIndices = results.filter(r => r.symbol.startsWith('^') && r.price === 0);
    if (zeroIndices.length > 0) {
        console.log(`🔴 FAILURE: ${zeroIndices.length} indices show 0.00 price!`);
    } else {
        console.log('🟢 SUCCESS: All indices show non-zero prices.');
    }
}

runTest();
