import fetch from 'node-fetch';

async function test() {
    try {
        const res = await fetch('http://localhost:5000/api/stocks?symbols=RELIANCE.NS');
        const data = await res.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('API Test Error:', e.message);
    }
}

test();
