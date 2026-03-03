const fs = require('fs');
const html = fs.readFileSync('gf_sample.html', 'utf8');

const matches = [...html.matchAll(/aria-label="(Up|Down) by ([0-9,.]+)%"/g)];
console.log(`Total aria-matches: ${matches.length}`);

for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const index = m.index;

    // Check if this match is inside an <a> tag
    // We look for the last <a or </a> before this match
    const before = html.slice(Math.max(0, index - 1000), index);
    const lastA = before.lastIndexOf('<a');
    const lastCloseA = before.lastIndexOf('</a>');
    const isInsideA = lastA > lastCloseA;

    console.log(`Match #${i + 1}: ${m[0]} (Inside <A>: ${isInsideA})`);
    if (!isInsideA) {
        console.log(`  >>> POTENTIAL MAIN INSTRUMENT (at ${index})`);
    }
}
