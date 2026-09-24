import fs from 'fs';
import path from 'path';
import { generateNeutralSummary, cleanHeadline } from '../lib/summarizer';
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
    const { data: dbItems } = await supabase.from('raw_items').select('*, source:sources(*)');
    if (dbHubs && dbItems) {
      hubs = dbHubs.map((hub) => ({
        ...hub,
        items: dbItems.filter((i) => i.cluster_id === hub.id),
      })) as any;
    }
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

  // Filter multi-item hubs (events covered across multiple outlets)
  const multiItemHubs = hubs.filter((h) => (h.items?.length || 0) > 1);
  const singleItemHubs = hubs.filter((h) => (h.items?.length || 0) <= 1);

  console.log(`🎯 Multi-source event hubs to summarize: ${multiItemHubs.length}`);

  for (const hub of multiItemHubs) {
    const { summary, isFlagged } = await generateNeutralSummary(hub);

    if (isFlagged) {
      hub.ai_summary = undefined;
      flaggedCount++;
      console.log(`  🛡️ [Flagged Sensitive] "${hub.title.slice(0, 50)}..."`);
    } else if (summary) {
      hub.ai_summary = summary;
      summarizedCount++;
      console.log(`  ✨ [AI Summary] "${summary}"`);
    }

    // Small delay between calls to stay well within API rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  // For single-item hubs, set neutral summary directly from headline if not already set
  for (const hub of singleItemHubs) {
    if (!hub.ai_summary) {
      hub.ai_summary = cleanHeadline(hub.title);
    }
  }

  console.log(`\n🎉 AI Summarization complete!`);
  console.log(`   ├─ Clustered Multi-Item Summaries: ${summarizedCount}`);
  console.log(`   └─ Sources-Only (Flagged Sensitive): ${flaggedCount}`);

  // Save to Database and Local Cache
  if (isConfigured) {
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    console.log('💾 Updating Supabase Postgres topic hubs with AI summaries...');
    for (const hub of multiItemHubs) {
      if (hub.ai_summary) {
        await supabase
          .from('topic_hubs')
          .update({ ai_summary: hub.ai_summary })
          .eq('id', hub.id);
      }
    }
    console.log('✅ Supabase database updated with AI summaries.');
  }

  // Always update local cache for offline/instant page rendering
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(hubsPath, JSON.stringify(hubs, null, 2));
  console.log(`💾 Saved updated topic hubs to local cache: ${hubsPath}`);
}

runSummarization().catch((err) => {
  console.error('Fatal error during AI summarization:', err);
  process.exit(1);
});
