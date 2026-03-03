const NSE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': '*/*', 'Accept-Language': 'en-US,en;q=0.9', 'Referer': 'https://www.nseindia.com/',
};

async function getNSECookie() {
    const r = await fetch('https://www.nseindia.com/', { headers: NSE_HEADERS });
    return r.headers.get('set-cookie')?.split(';')[0] || '';
}

async function inspectFull(symbol) {
    const cookie = await getNSECookie();
    const url = `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`;
    const r = await fetch(url, { headers: { ...NSE_HEADERS, 'Cookie': cookie } });
    const data = await r.json();
    console.log(`\n=== ${symbol} (keys) ===`);
    console.log('Top level keys:', Object.keys(data));
    if (data.priceInfo) {
        console.log('priceInfo.lastPrice:', data.priceInfo.lastPrice);
    } else {
        // Try full object
        console.log(JSON.stringify(data).slice(0, 800));
    }
}

async function main() {
    await inspectFull('TATAMOTORS');
}
main().catch(console.error);
