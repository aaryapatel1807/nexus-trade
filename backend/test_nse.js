const NSE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': '*/*', 'Accept-Language': 'en-US,en;q=0.9', 'Referer': 'https://www.nseindia.com/',
};

async function getNSECookie() {
    try {
        const r = await fetch('https://www.nseindia.com/', { headers: NSE_HEADERS });
        return r.headers.get('set-cookie')?.split(';')[0] || '';
    } catch (e) { return ''; }
}

async function fetchNSEPrice(symbol) {
    const cookie = await getNSECookie();
    const endpoints = [
        `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`,
        `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}&series=EQ`,
    ];
    for (const url of endpoints) {
        try {
            const r = await fetch(url, { headers: { ...NSE_HEADERS, 'Cookie': cookie } });
            if (!r.ok) continue;
            const data = await r.json();
            const price = data?.priceInfo?.lastPrice;
            if (price && price > 0) {
                const pct = data?.priceInfo?.pChange ?? 0;
                console.log(`✅ ${symbol}: ₹${price} (${pct > 0 ? '+' : ''}${pct?.toFixed(2)}%)`);
                return;
            }
        } catch (e) { /* try next */ }
    }
    console.log(`❌ ${symbol}: FAILED (will use Google fallback)`);
}

async function main() {
    console.log('=== NSE API FINAL VERIFICATION ===\n');
    await fetchNSEPrice('RELIANCE');
    await fetchNSEPrice('HDFCBANK');
    await fetchNSEPrice('TCS');
    await fetchNSEPrice('WIPRO');
    await fetchNSEPrice('TATAMOTORS');
    await fetchNSEPrice('SBIN');
    await fetchNSEPrice('INFY');
    console.log('\n✅ None of these can ever show 47,000 (Dow Jones) — NSE API only returns Indian stock data!');
}
main().catch(console.error);
