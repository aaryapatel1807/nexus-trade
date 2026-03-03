import yf from 'yahoo-finance2';
import fetch from 'node-fetch';

const NSE_EXPECTED_MIN = {
    'RELIANCE': 2000,
    'HDFCBANK': 1400,
    'TCS': 3000,
    'INFY': 1400,
};

const NSE_REASONABLE_MAX = {
    'RELIANCE': 10000, 'TCS': 25000, 'HDFCBANK': 11000, 'INFY': 15000, 'SBIN': 10000, 'MRF': 250000,
};

const validatePrice = (price, shortName, expectedSym) => {
    if (!price || price <= 0) return false;
    const name = (shortName || '').toUpperCase();

    const whitelist = ['MRF', 'PAGEIND', 'HONAUT', 'SHREECEM', 'ABBOTINDIA', 'NESTLEIND'];
    const isWhitelisted = whitelist.some(w => expectedSym.includes(w));
    const max = NSE_REASONABLE_MAX[expectedSym] || (isWhitelisted ? 500000 : 15000);

    if (price > max) {
        console.warn(`[VALIDATION] Blocked ${expectedSym}: Price ${price} exceeds ceiling ${max}`);
        return false;
    }
    if (name.includes('INDEX') || name.includes('DOW') || name.includes('S&P') || name.includes('AVERAGE')) {
        console.warn(`[VALIDATION] Index name detected for ${expectedSym}: ${name}`);
        return false;
    }
    const min = NSE_EXPECTED_MIN[expectedSym];
    if (min && price < min) {
        console.warn(`[VALIDATION] Blocked ${expectedSym}: Price ${price} is below expected floor ${min}`);
        return false;
    }
    return true;
};

async function test_final(sym) {
    const cleanSym = sym.replace('.NS', '');
    console.log(`--- FINAL VERIFY: ${sym} ---`);

    // Yahoo Simulation
    try {
        const q = await yf.quote(sym);
        if (validatePrice(q.regularMarketPrice, q.shortName, cleanSym)) {
            console.log(`[YAHOO] Valid: ${q.regularMarketPrice}`);
        } else {
            console.log(`[YAHOO] REJECTED (Rightly so if it was fragmented). Value: ${q.regularMarketPrice}`);
        }
    } catch (e) {
        console.log(`[YAHOO] Error: ${e.message}`);
    }

    // Scraper Simulation
    try {
        const url = `https://www.google.com/finance/quote/${cleanSym}:NSE`;
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await r.text();
        const priceRegex = /jsname="ip75Cb"[^>]*>₹?([0-9,.]+)</;
        const priceMatch = html.match(priceRegex);
        if (priceMatch) {
            const price = parseFloat(priceMatch[1].replace(/,/g, ''));
            const titleMatch = html.match(/<title>([^<]+)\|/);
            const title = titleMatch ? titleMatch[1] : '';
            if (validatePrice(price, title, cleanSym)) {
                console.log(`[GOOGLE] SUCCESS: ${price} (${title})`);
            } else {
                console.log(`[GOOGLE] REJECTED. Price: ${price}, Title: ${title}`);
            }
        }
    } catch (e) {
        console.log(`[GOOGLE] Error: ${e.message}`);
    }
}

test_final('RELIANCE.NS');
test_final('HDFCBANK.NS');
