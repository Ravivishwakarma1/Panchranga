import fs from 'fs';
import path from 'path';
import { generateNeutralSummary } from '../lib/summarizer';
import { TopicHub } from '../lib/types';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runSummarization() {
  console.log('🤖 Starting Panchranga Guardrailed AI Neutral Summarizer Pipeline...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured = Boolean(supabaseUrl && supabaseKey);

  const dataDir = path.resolve(process.cwd(), 'data');
  const hubsPath = path.resolve(dataDir, 'topic-hubs.json');

  let hubs: TopicHub[] = [];

  if (isConfigured) {
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { data: dbHubs } = await supabase.from('topic_hubs').select('*');
    if (dbHubs) hubs = dbHubs as any;
  } else if (fs.existsSync(hubsPath)) {
    hubs = JSON.parse(fs.readFileSync(hubsPath, 'utf-8'));
  }

  console.log(`📥 Loaded ${hubs.length} Topic Hubs for AI summarization.`);

  if (hubs.length === 0) {
    console.log('⚠️ No Topic Hubs found. Run `npm run cluster` first.');
    return;
  }

  let summarizedCount = 0;
  let flaggedCount = 0;

  for (const hub of hubs) {
    const { summary, isFlagged } = await generateNeutralSummary(hub);

    if (isFlagged) {
      hub.ai_summary = undefined;
      flaggedCount++;
    } else if (summary) {
      hub.ai_summary = summary;
      summarizedCount++;
    }
  }

  console.log(`\n🎉 AI Summarization complete!`);
  console.log(`   ├─ Summarized Hubs: ${summarizedCount}`);
  console.log(`   └─ Sources-Only (Flagged Sensitive): ${flaggedCount}`);

  // Save to Database or Local Cache
  if (isConfigured) {
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    for (const hub of hubs) {
      await supabase
        .from('topic_hubs')
        .update({ ai_summary: hub.ai_summary })
        .eq('id', hub.id);
    }
    console.log('💾 Supabase database updated with AI summaries.');
  } else {
    fs.writeFileSync(hubsPath, JSON.stringify(hubs, null, 2));
    console.log(`💾 Saved AI summaries to local cache: ${hubsPath}`);
  }
}

runSummarization().catch((err) => {
  console.error('Fatal error during AI summarization:', err);
  process.exit(1);
});
