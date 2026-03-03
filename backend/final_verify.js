import yf from 'yahoo-finance2';
import fetch from 'node-fetch'; // Use the same fetch if available, or native in Node 18+

const INDEX_MAP = {
    '^NSEI': 'NIFTY_50:INDEXNSE',
    '^BSESN': 'SENSEX:INDEXBOM'
};

const NSE_REASONABLE_MAX = {
    'RELIANCE': 10000,
    'TCS': 25000,
    'HDFCBANK': 11000,
    'INFY': 15000,
    'SBIN': 10000,
    'MRF': 250000,
};

const validatePrice = (price, shortName, expectedSym) => {
    if (!price || price <= 0) return false;
    const name = (shortName || '').toUpperCase();
    const whitelist = ['MRF', 'PAGEIND', 'HONAUT', 'SHREECEM', 'ABBOTINDIA', 'NESTLEIND'];
    const isWhitelisted = whitelist.some(w => expectedSym.includes(w));
    const max = NSE_REASONABLE_MAX[expectedSym] || (isWhitelisted ? 500000 : 15000);

    if (price > max) return false;
    if (name.includes('INDEX') || name.includes('DOW') || name.includes('S&P') || name.includes('AVERAGE')) return false;
    return true;
};

async function testFetch(sym) {
    const cleanSym = sym.replace('.NS', '').replace('.BO', '');
    console.log(`--- Testing ${sym} ---`);

    // Yahoo
    try {
        const yData = await yf.quote(sym);
        const isCorrectCurrency = sym.endsWith('.NS') || sym.endsWith('.BO') ? yData.currency === 'INR' : true;
        if (yData && isCorrectCurrency && validatePrice(yData.regularMarketPrice, yData.shortName, cleanSym)) {
            console.log(`[Yahoo] Success: ${yData.regularMarketPrice} ${yData.currency}`);
        } else {
            console.log(`[Yahoo] Rejected or Failed. Currency: ${yData?.currency}, Price: ${yData?.regularMarketPrice}`);
        }
    } catch (e) {
        console.log(`[Yahoo] Error: ${e.message}`);
    }

    // Google
    try {
        const target = `${cleanSym}:NSE`;
        const url = `https://www.google.com/finance/quote/${target}`;
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await r.text();
        const priceRegex = /jsname="ip75Cb"[^>]*>₹?([0-9,.]+)</;
        const priceMatch = html.match(priceRegex);
        if (priceMatch) {
            const price = parseFloat(priceMatch[1].replace(/,/g, ''));
            const titleMatch = html.match(/<title>([^<]+)\|/);
            const title = titleMatch ? titleMatch[1] : '';
            if (validatePrice(price, title, cleanSym)) {
                console.log(`[Google] Success: ${price} (Title: ${title})`);
            } else {
                console.log(`[Google] Rejected. Price: ${price}, Title: ${title}`);
            }
        } else {
            console.log(`[Google] regex failed to find price.`);
        }
    } catch (e) {
        console.log(`[Google] Error: ${e.message}`);
    }
}

async function run() {
    await testFetch('HDFCBANK.NS');
    await testFetch('WIPRO.NS');
    await testFetch('TATAMOTORS.NS');
}
run();
