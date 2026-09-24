import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { STARTER_SOURCES } from '../lib/constants';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seed() {
  console.log('🌱 Seeding Panchranga starter sources...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const sourcesWithIds = STARTER_SOURCES.map((src, idx) => ({
    ...src,
    id: `source-${idx + 1}`,
    is_active: true,
    created_at: new Date().toISOString(),
  }));

  // Always save to local data/sources.json cache
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const sourcesPath = path.resolve(dataDir, 'sources.json');
  fs.writeFileSync(sourcesPath, JSON.stringify(sourcesWithIds, null, 2));
  console.log(`💾 Saved ${sourcesWithIds.length} sources to local cache: ${sourcesPath}`);

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    for (const src of STARTER_SOURCES) {
      const { error } = await supabase
        .from('sources')
        .upsert(src, { onConflict: 'feed_url' });

      if (error) {
        console.error(`❌ Failed inserting ${src.name}:`, error.message);
      } else {
        console.log(`✅ Seeded DB source: ${src.name} [${src.lane.toUpperCase()}]`);
      }
    }
  }

  console.log('🎉 Seeding completed successfully!');
}

seed().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
