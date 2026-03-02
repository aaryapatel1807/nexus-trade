import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function updateNseStocks() {
    console.log('Fetching NSE Equity list...');
    try {
        const response = await fetch('https://archives.nseindia.com/content/equities/EQUITY_L.csv');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const csv = await response.text();
        const lines = csv.split('\n');

        // Remove header: SYMBOL,NAME OF COMPANY,...
        const stocks = lines.slice(1)
            .filter(line => line.trim().length > 0)
            .map(line => {
                const parts = line.split(',');
                return {
                    symbol: parts[0],
                    name: parts[1],
                };
            });

        const outputPath = path.join(__dirname, '..', 'nse-stocks.json');
        fs.writeFileSync(outputPath, JSON.stringify(stocks, null, 2));
        console.log(`Successfully saved ${stocks.length} stocks to ${outputPath}`);
    } catch (error) {
        console.error('Failed to update NSE stocks:', error.message);
    }
}

updateNseStocks();
