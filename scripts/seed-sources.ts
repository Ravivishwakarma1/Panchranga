import WebSocket from 'ws';
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { STARTER_SOURCES } from '../lib/constants';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seed() {
  console.log('🌱 Synchronizing Panchranga sources registry...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const sourcesWithIds = STARTER_SOURCES.map((src, idx) => ({
    ...src,
    id: `source-${idx + 1}`,
    is_active: true,
    last_status: 'healthy',
    created_at: new Date().toISOString(),
  }));

  // Always save to local data/sources.json cache
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const sourcesPath = path.resolve(dataDir, 'sources.json');
  fs.writeFileSync(sourcesPath, JSON.stringify(sourcesWithIds, null, 2));
  console.log(`💾 Saved ${sourcesWithIds.length} active sources to local cache: ${sourcesPath}`);

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Upsert active modern sources
    for (const src of STARTER_SOURCES) {
      const payload: any = {
        name: src.name,
        lane: src.lane,
        type: src.type,
        feed_url: src.feed_url,
        language: src.language,
        region: src.region,
        is_active: true,
      };

      const { error } = await supabase
        .from('sources')
        .upsert(payload, { onConflict: 'feed_url' });

      if (error) {
        console.error(`❌ Failed inserting ${src.name}:`, error.message);
      } else {
        console.log(`✅ Synced source: ${src.name} [${src.lane.toUpperCase()}] (${src.language})`);
      }
    }

    // 2. Deactivate any obsolete or discontinued sources in DB
    const activeNames = STARTER_SOURCES.map((s) => s.name);
    const { data: existingSources } = await supabase.from('sources').select('id, name, is_active');
    if (existingSources && existingSources.length > 0) {
      const toDeactivate = existingSources.filter((s) => !activeNames.includes(s.name) && s.is_active);
      if (toDeactivate.length > 0) {
        console.log(`🧹 Deactivating ${toDeactivate.length} discontinued/dead sources...`);
        for (const dead of toDeactivate) {
          await supabase.from('sources').update({ is_active: false }).eq('id', dead.id);
          console.log(`  ↪ Deactivated: ${dead.name}`);
        }
      }
    }
  }

  console.log('🎉 Seeding and source synchronization completed successfully!');
}

seed().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
