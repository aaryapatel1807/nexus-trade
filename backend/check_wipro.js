import yf from 'yahoo-finance2';

async function check() {
    try {
        const q = await yf.quote('WIPRO.NS');
        console.log('WIPRO.NS:', q.regularMarketPrice, q.currency, q.shortName);
    } catch (e) {
        console.error(e.message);
    }
}
check();
