const fs = require('fs');
const path = require('path');

const hubsPath = path.resolve(__dirname, '../data/topic-hubs.json');

if (fs.existsSync(hubsPath)) {
  const hubs = JSON.parse(fs.readFileSync(hubsPath, 'utf-8'));
  let cleanedCount = 0;

  hubs.forEach((hub) => {
    if (hub.ai_summary) {
      const summary = hub.ai_summary.toLowerCase();
      if (
        summary.includes('mainstream media coverage') ||
        summary.includes('as reported by') ||
        summary.includes('highlights')
      ) {
        hub.ai_summary = null;
        cleanedCount++;
      }
    }
  });

  fs.writeFileSync(hubsPath, JSON.stringify(hubs, null, 2), 'utf-8');
  console.log(`Cleaned ${cleanedCount} bad summaries in topic-hubs.json`);
} else {
  console.log('topic-hubs.json not found');
}
