import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, 'stock-cache.json');

try {
    const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    const suspicious = [];

    Object.entries(cache).forEach(([sym, data]) => {
        const price = data.price;
        // Case 1: > 10,000 (Potentially an index leak unless it's MRF etc)
        if (price > 10000 && !['MRF', 'PAGEIND', 'HONAUT', 'SHREECEM'].includes(sym)) {
            suspicious.push({ sym, price, name: data.name, reason: 'High Price / Index Leak' });
        }
        // Case 2: Stock usually > 1000 but showing around 100-200 (Unit/Currency mismatch)
        if (sym === 'WIPRO' && price < 300) {
            suspicious.push({ sym, price, name: data.name, reason: 'Wipro Underpriced' });
        }
        if (sym === 'HDFCBANK' && price < 1000) {
            suspicious.push({ sym, price, name: data.name, reason: 'HDFCBANK Underpriced' });
        }
    });

    console.log('--- SUSPICIOUS PRICES ---');
    suspicious.forEach(s => console.log(`${s.sym}: ${s.price} (${s.name}) - ${s.reason}`));

    if (suspicious.length === 0) console.log('No suspicious prices found in current cache.');

} catch (e) {
    console.error('Error reading cache:', e.message);
}
