const fs = require('fs');
const html = fs.readFileSync('gf_sample.html', 'utf8');

// The main data array pattern: [price, change, percent, 2, 2, 2] or similar
// We look for [num, num, num, 2, 2, [23]]
const regex = /\[([0-9,.]+),([-+0-9,.]+),([-+0-9,.]+),2,2,[2-4]\]/g;

let match;
while ((match = regex.exec(html)) !== null) {
    console.log(`\nFound Data Array at ${match.index}: ${match[0]}`);
    console.log(`  Price: ${match[1]}`);
    console.log(`  Change: ${match[2]}`);
    console.log(`  Percent: ${match[3]}%`);

    // Show some context (symbol name nearby)
    const context = html.slice(Math.max(0, match.index - 500), match.index + 500);
    console.log(`  Context snippet: ${context.replace(/\s+/g, ' ').slice(-300, 300)}`);
}
