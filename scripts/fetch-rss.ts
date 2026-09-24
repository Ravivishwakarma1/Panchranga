import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { STARTER_SOURCES } from '../lib/constants';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Panchranga-News/1.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.8',
  },
  timeout: 10000,
});

interface IngestedItem {
  id?: string;
  source_id?: string;
  source_name: string;
  lane: 'mainstream' | 'grassroots' | 'discourse';
  title: string;
  url: string;
  published_at: string;
  raw_summary: string;
  og_image?: string;
  og_description?: string;
  fetched_at: string;
}

/**
 * Extract og:image and og:description meta tags from article URL with 4s timeout.
 */
async function fetchOgData(url: string): Promise<{ ogImage: string | null; ogDesc: string | null }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Panchranga-Bot/1.0 (+https://panchranga.in)',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return { ogImage: null, ogDesc: null };

    const html = await res.text();
    const ogImage =
      html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] ||
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)?.[1];

    const ogDesc =
      html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1] ||
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i)?.[1] ||
      html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)?.[1];

    return {
      ogImage: ogImage?.trim() || null,
      ogDesc: ogDesc?.replace(/<[^>]*>?/gm, '')?.trim() || null,
    };
  } catch {
    return { ogImage: null, ogDesc: null };
  }
}

async function fetchRss() {
  console.log('🚀 Starting Panchranga Ingestion Run with OG Metadata extraction...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let activeSources = STARTER_SOURCES.map((s, idx) => ({ ...s, id: `source-${idx + 1}` }));
  const isConfigured = Boolean(supabaseUrl && supabaseKey);
  let supabase: any = null;

  if (isConfigured) {
    supabase = createClient(supabaseUrl!, supabaseKey!);
    const { data: dbSources, error } = await supabase
      .from('sources')
      .select('*')
      .eq('is_active', true);

    if (!error && dbSources && dbSources.length > 0) {
      activeSources = dbSources;
    }
  }

  console.log(`📡 Ingesting from ${activeSources.length} sources...`);
  const allItems: IngestedItem[] = [];

  for (const source of activeSources) {
    try {
      console.log(`  └─ Fetching [${source.lane.toUpperCase()}] ${source.name} (${source.feed_url})...`);

      if (source.type === 'reddit' || source.feed_url.endsWith('.json')) {
        // Fetch Reddit JSON endpoint
        const response = await fetch(source.feed_url, {
          headers: {
            'User-Agent': 'web:panchranga.news:v1.0.0 (by /u/PanchrangaAggregator)',
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const json = await response.json();
          const posts = json?.data?.children || [];
          const items = posts.slice(0, 8).map((p: any) => {
            const post = p.data;
            const previewImg = post.thumbnail?.startsWith('http') ? post.thumbnail : undefined;
            return {
              source_id: source.id,
              source_name: source.name,
              lane: source.lane as any,
              title: post.title?.trim() || 'Reddit Post',
              url: post.url?.startsWith('http') ? post.url : `https://reddit.com${post.permalink}`,
              published_at: new Date(post.created_utc * 1000).toISOString(),
              raw_summary: (post.selftext || post.title || '').slice(0, 300),
              og_image: previewImg,
              og_description: `Subreddit ${post.subreddit_name_prefixed} · ${post.score || 0} upvotes · ${post.num_comments || 0} comments`,
              fetched_at: new Date().toISOString(),
            };
          });
          allItems.push(...items);
          console.log(`     └─ Captured ${items.length} Reddit items.`);
        }
      } else {
        // Fetch RSS/Atom XML feed
        const feed = await parser.parseURL(source.feed_url);

        const itemsRaw = (feed.items || []).slice(0, 8).map((item) => {
          const rawContent = item.contentSnippet || item.content || item.summary || '';
          const cleanSummary = rawContent
            .replace(/<[^>]*>?/gm, '')
            .trim()
            .slice(0, 300);

          // Extract enclosure image if present in RSS XML
          let enclosureImage: string | undefined = undefined;
          if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) {
            enclosureImage = item.enclosure.url;
          } else if ((item as any)['media:content']?.$.url) {
            enclosureImage = (item as any)['media:content'].$.url;
          }

          return {
            source_id: source.id,
            source_name: source.name,
            lane: source.lane as any,
            title: item.title?.trim() || 'Untitled Article',
            url: item.link?.trim() || item.guid?.trim() || '',
            published_at: item.isoDate || item.pubDate || new Date().toISOString(),
            raw_summary: cleanSummary,
            og_image: enclosureImage,
            fetched_at: new Date().toISOString(),
          };
        }).filter((item) => item.url.startsWith('http'));

        // Fetch OG data concurrently for items without enclosure image
        const itemsWithOg: IngestedItem[] = await Promise.all(
          itemsRaw.map(async (item) => {
            if (!item.og_image) {
              const { ogImage, ogDesc } = await fetchOgData(item.url);
              return {
                ...item,
                og_image: ogImage || undefined,
                og_description: ogDesc || undefined,
              };
            }
            return item;
          })
        );

        allItems.push(...itemsWithOg);
        console.log(`     └─ Captured ${itemsWithOg.length} RSS items.`);
      }
    } catch (err: any) {
      console.error(`  ⚠️ Error fetching ${source.name}:`, err.message || err);
    }
  }

  console.log(`\n📊 Total raw items fetched across all sources: ${allItems.length}`);

  if (isConfigured && supabase) {
    console.log('💾 Upserting raw items into Supabase...');
    for (const item of allItems) {
      await supabase.from('raw_items').upsert(
        {
          source_id: item.source_id,
          title: item.title,
          url: item.url,
          published_at: item.published_at,
          raw_summary: item.raw_summary,
          og_image: item.og_image,
          og_description: item.og_description,
          fetched_at: item.fetched_at,
        },
        { onConflict: 'url' }
      );
    }
    console.log('✅ Successfully stored items in Supabase.');
  } else {
    // Local JSON cache fallback
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const outputPath = path.resolve(dataDir, 'ingested-items.json');
    fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2));
    console.log(`💾 Saved ${allItems.length} raw items to local cache fallback: ${outputPath}`);
  }

  console.log('✨ Ingestion cycle completed successfully.');
}

fetchRss().catch((err) => {
  console.error('Fatal error during RSS ingestion:', err);
  process.exit(1);
});
