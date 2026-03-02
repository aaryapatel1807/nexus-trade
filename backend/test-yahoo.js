async function testYahoo() {
    const symbol = 'RELIANCE.NS';
    const period = '1m';
    const url = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/history`;

    const r = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        }
    });

    const html = await r.text();
    const stateMatch = html.match(/root\.App\.main\s*=\s*(\{.*?\});\s*\(function/);
    if (!stateMatch) {
        console.error("Match failed! HTML length:", html.length);
        console.log("Snippet:", html.substring(0, 500));
        return;
    }
    console.log("Match success!");
}
testYahoo();
