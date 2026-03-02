import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const finnhub = require('finnhub');

const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = process.env.FINNHUB_API_KEY;
const finnhubClient = new finnhub.DefaultApi();

console.log('Searching for Reliance on Finnhub...');
finnhubClient.symbolSearch('Reliance', (error, data, response) => {
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Results:', JSON.stringify(data.result.slice(0, 5), null, 2));
    }
});
