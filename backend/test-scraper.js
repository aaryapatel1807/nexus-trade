async function fetchGoogleFinanceQuote(sym) {
    const exchange = sym.endsWith('.BO') ? 'BOM' : 'NSE';
    const cleanSym = sym.replace('.NS', '').replace('.BO', '');
    const url = `https://www.google.com/finance/quote/${cleanSym}:${exchange}`;

    const r = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
    });

    if (!r.ok) throw new Error(`Google Finance HTTP ${r.status}`);
    const html = await r.text();

    const priceMatch = html.match(/class="YMlKec fxKbKc"[^>]*>[^0-9]*([0-9,.]+)</);
    if (!priceMatch) throw new Error(`Could not parse price for ${sym}`);

    const price = parseFloat(priceMatch[1].replace(/,/g, ''));

    let changePercent = 0;
    const changeMatch = html.match(/class="JwB6kf"[^>]*>([+-]?[0-9,.]+)%</);
    if (changeMatch) {
        changePercent = parseFloat(changeMatch[1]);
    }

    return {
        price, changePercent, name: cleanSym
    };
}

fetchGoogleFinanceQuote('RELIANCE.NS').then(console.log).catch(console.error);
