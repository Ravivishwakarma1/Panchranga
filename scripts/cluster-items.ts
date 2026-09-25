import WebSocket from 'ws';
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

import fs from 'fs';
import path from 'path';
import { generateEmbedding } from '../lib/embeddings';
import { clusterRawItems, SIMILARITY_THRESHOLD } from '../lib/clustering';
import { RawItem, TopicHub } from '../lib/types';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runClustering() {
  console.log('⚡ Starting Panchranga Topic Hub Vector Clustering...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured = Boolean(supabaseUrl && supabaseKey);

  let rawItems: RawItem[] = [];

  const dataDir = path.resolve(process.cwd(), 'data');
  const itemsPath = path.resolve(dataDir, 'ingested-items.json');
  const hubsPath = path.resolve(dataDir, 'topic-hubs.json');

  if (isConfigured) {
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { data: dbItems } = await supabase.from('raw_items').select('*, source:sources(*)');
    if (dbItems) rawItems = dbItems as any;
  } else {
    // Local JSON cache fallback
    if (fs.existsSync(itemsPath)) {
      rawItems = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
    }
  }

  console.log(`📥 Loaded ${rawItems.length} raw items for event clustering.`);

  if (rawItems.length === 0) {
    console.log('⚠️ No raw items available to cluster. Run `npm run fetch-rss` first.');
    return;
  }

  // Generate vector embeddings for items
  console.log('🧠 Computing 384-dimensional vector embeddings...');
  for (const item of rawItems) {
    const textToEmbed = `${item.title}. ${item.raw_summary || ''}`;
    item.embedding = await generateEmbedding(textToEmbed);
  }
  console.log(`✅ Computed vector embeddings for ${rawItems.length} items.`);

  // Execute Cosine Similarity Clustering starting from fresh set
  console.log(`🔄 Clustering items into Topic Hubs (Cosine Threshold = ${SIMILARITY_THRESHOLD})...`);
  const { hubs, clusteredItems } = clusterRawItems([], rawItems, SIMILARITY_THRESHOLD);

  console.log(`\n🎉 Clustering complete! Grouped ${rawItems.length} news items into ${hubs.length} Topic Hubs.`);

  // Display top multi-item topic hubs
  const multiItemHubs = hubs.filter((h) => (h.item_count || 0) > 1);
  console.log(`\n🌟 Multi-Item Event Topic Hubs created: ${multiItemHubs.length}`);
  multiItemHubs.forEach((h, idx) => {
    console.log(`  [Hub ${idx + 1}] "${h.title}"`);
    console.log(`        └─ ${h.item_count} items (${h.mainstream_count || 0} mainstream · ${h.grassroots_count || 0} grassroots · ${h.discourse_count || 0} discourse)`);
  });

  // Save to Database and Local Cache
  if (isConfigured) {
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    console.log('💾 Syncing topic hubs and cluster IDs to Supabase Postgres...');
    
    // Batch upsert hubs in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < hubs.length; i += chunkSize) {
      const chunk = hubs.slice(i, i + chunkSize).map((hub) => ({
        id: hub.id,
        title: hub.title,
        ai_summary: hub.ai_summary,
        first_seen_at: hub.first_seen_at,
        last_updated_at: hub.last_updated_at,
        item_count: hub.item_count,
      }));
      const { error } = await supabase.from('topic_hubs').upsert(chunk);
      if (error) console.error('⚠️ Error upserting topic hubs chunk:', error);
    }

    // Update cluster_ids on raw_items
    for (const item of clusteredItems) {
      if (item.cluster_id) {
        await supabase.from('raw_items').update({ cluster_id: item.cluster_id }).eq('url', item.url);
      }
    }
    console.log('✅ Supabase database sync complete.');
  }

  // Always write local cache so app has immediate fresh data
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(hubsPath, JSON.stringify(hubs, null, 2));
  fs.writeFileSync(itemsPath, JSON.stringify(clusteredItems, null, 2));
  console.log(`💾 Saved ${hubs.length} topic hubs and ${clusteredItems.length} items to local cache.`);
}

runClustering().catch((err) => {
  console.error('Fatal error during clustering:', err);
  process.exit(1);
});
