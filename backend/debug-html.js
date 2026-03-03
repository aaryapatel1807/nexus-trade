async function debug() {
    const url = 'https://www.google.com/finance/quote/RELIANCE:NSE';
    const r = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.google.com/finance/'
        }
    });
    const html = await r.text();

    console.log('--- SCANNING NEAR zzDege ---');
    const marker = 'zzDege';
    let index = html.indexOf(marker);
    if (index !== -1) {
        console.log(html.slice(index, index + 2000));
    }
}
debug();
