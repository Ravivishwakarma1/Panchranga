const fs = require('fs');
const path = require('path');

const hubsPath = path.resolve('data', 'topic-hubs.json');
if (fs.existsSync(hubsPath)) {
  const hubs = JSON.parse(fs.readFileSync(hubsPath, 'utf-8'));
  let updatedCount = 0;

  hubs.forEach((hub) => {
    if (
      hub.ai_summary &&
      (hub.ai_summary.toLowerCase().includes('mainstream media coverage') ||
        hub.ai_summary.toLowerCase().includes('as reported by') ||
        hub.ai_summary.toLowerCase().includes('highlights'))
    ) {
      let clean = hub.title.replace(/^["'“‘]+|["'”’]+$/g, '').trim();
      clean = clean.replace(/\s*\|\s*.*$/, '');
      clean = clean.replace(/^Mainstream media coverage highlights\s*/i, '');
      clean = clean.replace(/\s*as reported by.*$/i, '');
      hub.ai_summary = clean;
      updatedCount++;
    }
  });

  fs.writeFileSync(hubsPath, JSON.stringify(hubs, null, 2));
  console.log(`✅ Cleared bad AI summaries across ${updatedCount} hubs.`);
}
