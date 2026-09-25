import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { STARTER_SOURCES } from '../lib/constants';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const USER_AGENT = 'Mozilla/5.0 Panchranga-Bot/1.0 (+https://panchranga.in)';

const parser = new Parser({
  headers: {
    'User-Agent': USER_AGENT,
    'Accept': 'application/rss+xml, application/xml, text/xml, */*;q=0.9',
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

// Known syndication / resilient feed fallbacks for publishers whose primary RSS is dead or SPA-wrapped
const FEED_FALLBACKS: Record<string, string> = {
  'The Wire': 'https://news.google.com/rss/search?q=site:thewire.in&hl=en-IN&gl=IN&ceid=IN:en',
  'Scroll.in': 'https://news.google.com/rss/search?q=site:scroll.in&hl=en-IN&gl=IN&ceid=IN:en',
  'The News Minute': 'https://news.google.com/rss/search?q=site:thenewsminute.com&hl=en-IN&gl=IN&ceid=IN:en',
  'Navbharat Times': 'https://news.google.com/rss/search?q=site:navbharattimes.indiatimes.com&hl=hi&gl=IN&ceid=IN:hi',
  'ABP News': 'https://news.abplive.com/home/feed',
  'Patrika': 'https://news.google.com/rss/search?q=site:patrika.com&hl=hi&gl=IN&ceid=IN:hi',
  'Zee News Hindi': 'https://news.google.com/rss/search?q=site:zeenews.india.com/hindi&hl=hi&gl=IN&ceid=IN:hi',
  'Jansatta': 'https://news.google.com/rss/search?q=site:jansatta.com&hl=hi&gl=IN&ceid=IN:hi',
};

/**
 * Extract og:image and og:description meta tags from article URL with 3.5s timeout.
 */
async function fetchOgData(url: string): Promise<{ ogImage: string | null; ogDesc: string | null }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
      signal: AbortSignal.timeout(3500),
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

/**
 * Clean & sanitize XML strings before parsing
 */
function sanitizeXml(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;');
}

async function fetchSingleSource(source: any): Promise<IngestedItem[]> {
  const isReddit = source.type === 'reddit' || source.feed_url.endsWith('.json');

  if (isReddit) {
    const response = await fetch(source.feed_url, {
      headers: {
        'User-Agent': 'web:panchranga.news:v1.0.0 (by /u/PanchrangaBot)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const posts = json?.data?.children || [];
    return posts.slice(0, 8).map((p: any) => {
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
  }

  // RSS / Atom feed
  let targetUrl = FEED_FALLBACKS[source.name] || source.feed_url;
  let feed: any = null;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/rss+xml, application/xml, text/xml, */*;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const xmlText = await res.text();
    feed = await parser.parseString(sanitizeXml(xmlText));
  } catch (err: any) {
    // If original failed and fallback wasn't already used, try syndication fallback
    const fallbackUrl = FEED_FALLBACKS[source.name];
    if (fallbackUrl && fallbackUrl !== targetUrl) {
      feed = await parser.parseURL(fallbackUrl);
    } else {
      throw err;
    }
  }

  if (!feed || !feed.items || feed.items.length === 0) {
    return [];
  }

  const itemsRaw = feed.items.slice(0, 8).map((item: any) => {
    const rawContent = item.contentSnippet || item.content || item.summary || '';
    const cleanSummary = rawContent
      .replace(/<[^>]*>?/gm, '')
      .trim()
      .slice(0, 300);

    let enclosureImage: string | undefined = undefined;
    if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) {
      enclosureImage = item.enclosure.url;
    } else if (item['media:content']?.$.url) {
      enclosureImage = item['media:content'].$.url;
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
  }).filter((item: any) => item.url.startsWith('http'));

  // Fetch OG data concurrently for items missing thumbnail
  const itemsWithOg: IngestedItem[] = await Promise.all(
    itemsRaw.map(async (item: any) => {
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

  return itemsWithOg;
}

async function fetchRss() {
  console.log('🚀 Starting Panchranga Ingestion Pipeline...');
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

  console.log(`📡 Ingesting from ${activeSources.length} active sources...`);
  const allItems: IngestedItem[] = [];

  for (const source of activeSources) {
    try {
      const items = await fetchSingleSource(source);
      allItems.push(...items);
      console.log(`✓ Ingested ${items.length} items from ${source.name}`);
    } catch (err: any) {
      console.log(`✗ Failed ${source.name}: ${err.message || err}`);
    }
  }

  console.log(`\n📊 Total raw items successfully fetched: ${allItems.length}`);

  if (isConfigured && supabase && allItems.length > 0) {
    console.log('💾 Upserting raw items into Supabase...');
    const chunkSize = 50;
    for (let i = 0; i < allItems.length; i += chunkSize) {
      const chunk = allItems.slice(i, i + chunkSize).map((item) => ({
        source_id: item.source_id,
        title: item.title,
        url: item.url,
        published_at: item.published_at,
        raw_summary: item.raw_summary,
        og_image: item.og_image,
        og_description: item.og_description,
        fetched_at: item.fetched_at,
      }));
      await supabase.from('raw_items').upsert(chunk, { onConflict: 'url' });
    }
    console.log('✅ Successfully stored items in Supabase.');
  }

  // Always write local cache fallback
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const outputPath = path.resolve(dataDir, 'ingested-items.json');
  fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2));
  console.log(`💾 Saved ${allItems.length} raw items to local cache: ${outputPath}`);

  console.log('✨ Ingestion cycle completed.');
}

fetchRss().catch((err) => {
  console.error('Fatal error during RSS ingestion:', err);
  process.exit(1);
});
