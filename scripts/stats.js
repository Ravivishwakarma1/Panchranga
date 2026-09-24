const fs = require('fs');
const path = require('path');

const sources = JSON.parse(fs.readFileSync(path.resolve('data', 'sources.json'), 'utf-8'));
const items = JSON.parse(fs.readFileSync(path.resolve('data', 'ingested-items.json'), 'utf-8'));
const hubs = JSON.parse(fs.readFileSync(path.resolve('data', 'topic-hubs.json'), 'utf-8'));

console.log('--- PANCHRANGA PIPELINE METRICS ---');
console.log('Active Sources:', sources.length);
console.log('Raw Items Ingested:', items.length);
console.log('Total Topic Hubs:', hubs.length);
console.log('Multi-source Hubs (2+ items):', hubs.filter(h => h.items && h.items.length >= 2).length);
console.log('Hubs with 3+ items:', hubs.filter(h => h.items && h.items.length >= 3).length);
