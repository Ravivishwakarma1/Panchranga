import WebSocket from 'ws';
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { STARTER_SOURCES, FEED_FALLBACKS } from '../lib/constants';
import { getCategoryAndRegion } from '../lib/topics';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const parser = new Parser({
  headers: {
    'User-Agent': USER_AGENT,
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*;q=0.9',
  },
  timeout: 10000,
});

const MAX_ITEMS_PER_SOURCE = 30;
const CONCURRENCY_BATCH_SIZE = 6;

interface IngestedItem {
  id?: string;
  source_id?: string;
  source_name: string;
  lane: 'mainstream' | 'grassroots' | 'discourse';
  title: string;
  url: string;
  published_at: string;
  raw_summary: string;
  category: string;
  og_image?: string;
  og_description?: string;
  fetched_at: string;
}

/**
 * Extract og:image and og:description meta tags with 2.5s strict timeout.
 */
async function fetchOgData(url: string): Promise<{ ogImage: string | null; ogDesc: string | null }> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return { ogImage: null, ogDesc: null };

    const html = await res.text();
    const ogImage =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1];

    const ogDesc =
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)?.[1] ||
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1];

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchSingleSource(source: any): Promise<IngestedItem[]> {
  const isReddit = source.type === 'reddit' || source.feed_url.includes('reddit.com');

  // 1. Reddit feeds (using .rss with pacing)
  if (isReddit) {
    const rssUrl = source.feed_url.replace(/\/hot\.json.*$/, '/.rss').replace(/\/+$/, '') + (source.feed_url.endsWith('.rss') ? '' : '/.rss');
    // Polite pause for Reddit anti-spam
    await sleep(1500);

    const feed = await parser.parseURL(rssUrl);
    if (!feed || !feed.items || feed.items.length === 0) {
      return [];
    }

    return feed.items.slice(0, MAX_ITEMS_PER_SOURCE).map((p: any) => {
      const cleanTitle = (p.title || 'Civic Post').trim();
      const rawSummary = (p.contentSnippet || p.content || cleanTitle).replace(/<[^>]*>?/gm, '').trim().slice(0, 300);
      const { topic } = getCategoryAndRegion(cleanTitle, source.region, source.lane, source.name);

      return {
        source_id: source.id,
        source_name: source.name,
        lane: source.lane as any,
        title: cleanTitle,
        url: (p.link || p.guid || '').trim(),
        published_at: p.isoDate || p.pubDate || new Date().toISOString(),
        raw_summary: rawSummary,
        category: topic,
        og_description: `Reddit community discussion · ${source.name}`,
        fetched_at: new Date().toISOString(),
      };
    }).filter((i: any) => i.url.startsWith('http'));
  }

  // 2. RSS / Atom / Google News syndication feed
  let targetUrl = source.feed_url;
  const fallbackUrl = FEED_FALLBACKS[source.name];

  // If primary feed is known to be Cloudflare protected or syndicated, default directly to fallback
  if (fallbackUrl && (targetUrl.includes('thewire.in') || targetUrl.includes('scroll.in') || targetUrl.includes('newslaundry.com') || targetUrl.includes('jagran.com') || targetUrl.includes('eenadu.net') || targetUrl.includes('sakshi.com') || targetUrl.includes('divyabhaskar.co.in') || targetUrl.includes('gujaratsamachar.com') || targetUrl.includes('anandabazar.com') || targetUrl.includes('khabarlahariya.org') || targetUrl.includes('article-14.com') || targetUrl.includes('downtoearth.org.in') || targetUrl.includes('patrika.com') || targetUrl.includes('jansatta.com') || targetUrl.includes('abplive.com') || targetUrl.includes('zeenews.india.com') || targetUrl.includes('navbharattimes.indiatimes.com'))) {
    targetUrl = fallbackUrl;
  }

  let feed: any = null;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const xmlText = await res.text();
    feed = await parser.parseString(sanitizeXml(xmlText));
  } catch (err: any) {
    // If original failed and fallback is available, try syndication fallback
    if (fallbackUrl && fallbackUrl !== targetUrl) {
      feed = await parser.parseURL(fallbackUrl);
    } else {
      throw err;
    }
  }

  if (!feed || !feed.items || feed.items.length === 0) {
    return [];
  }

  const itemsRaw = feed.items.slice(0, MAX_ITEMS_PER_SOURCE).map((item: any) => {
    const rawContent = item.contentSnippet || item.content || item.summary || '';
    const cleanSummary = rawContent
      .replace(/<[^>]*>?/gm, '')
      .trim()
      .slice(0, 300);

    let enclosureImage: string | undefined = undefined;
    if (item.enclosure?.url && (item.enclosure.type?.startsWith('image') || item.enclosure.url.match(/\.(jpeg|jpg|png|webp)/i))) {
      enclosureImage = item.enclosure.url;
    } else if (item['media:content']?.$.url) {
      enclosureImage = item['media:content'].$.url;
    } else if (item['media:thumbnail']?.$.url) {
      enclosureImage = item['media:thumbnail'].$.url;
    }

    const cleanTitle = (item.title || 'Untitled Article').trim();
    const { topic } = getCategoryAndRegion(cleanTitle, source.region, source.lane, source.name);

    return {
      source_id: source.id,
      source_name: source.name,
      lane: source.lane as any,
      title: cleanTitle,
      url: (item.link || item.guid || '').trim(),
      published_at: item.isoDate || item.pubDate || new Date().toISOString(),
      raw_summary: cleanSummary,
      category: topic,
      og_image: enclosureImage,
      fetched_at: new Date().toISOString(),
    };
  }).filter((item: any) => item.url.startsWith('http'));

  // Enhance only the top 2 items missing thumbnails to optimize speed
  const itemsWithOg: IngestedItem[] = await Promise.all(
    itemsRaw.map(async (item: any, idx: number) => {
      if (!item.og_image && idx < 2) {
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
  console.log('🚀 Starting High-Capacity Panchranga News Ingestion Pipeline...');
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

  console.log(`📡 Ingesting up to ${MAX_ITEMS_PER_SOURCE} items from ${activeSources.length} active sources...`);
  const allItems: IngestedItem[] = [];

  const standardSources = activeSources.filter((s) => s.type !== 'reddit' && !s.feed_url.includes('reddit.com'));
  const redditSources = activeSources.filter((s) => s.type === 'reddit' || s.feed_url.includes('reddit.com'));

  // 1. Process Standard RSS Feeds with Controlled Concurrency
  for (let i = 0; i < standardSources.length; i += CONCURRENCY_BATCH_SIZE) {
    const batch = standardSources.slice(i, i + CONCURRENCY_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (source) => {
        try {
          const items = await fetchSingleSource(source);
          if (supabase && source.id && source.id.length > 10) {
            await supabase
              .from('sources')
              .update({
                last_status: 'healthy',
                last_error: null,
                last_attempted_at: new Date().toISOString(),
              })
              .eq('id', source.id);
          }
          return { source, items };
        } catch (err: any) {
          if (supabase && source.id && source.id.length > 10) {
            await supabase
              .from('sources')
              .update({
                last_status: 'error',
                last_error: (err.message || 'Unknown fetch error').slice(0, 500),
                last_attempted_at: new Date().toISOString(),
              })
              .eq('id', source.id);
          }
          throw { source, err };
        }
      })
    );

    for (const res of results) {
      if (res.status === 'fulfilled') {
        const { source, items } = res.value;
        allItems.push(...items);
        console.log(`✓ [${source.lane.toUpperCase()}] ${source.name} (${source.language}): +${items.length} items`);
      } else {
        const { source, err } = (res as PromiseRejectedResult).reason;
        console.log(`✗ [${source?.lane?.toUpperCase() || 'SRC'}] ${source?.name}: ${err?.message || err}`);
      }
    }
  }

  // 2. Process Reddit Civic Feeds Sequentially with Polite Pacing
  if (redditSources.length > 0) {
    console.log(`\n💬 Ingesting ${redditSources.length} civic discourse subreddits with pacing...`);
    for (const source of redditSources) {
      try {
        const items = await fetchSingleSource(source);
        allItems.push(...items);
        console.log(`✓ [DISCOURSE] ${source.name}: +${items.length} community posts`);
        if (supabase && source.id && source.id.length > 10) {
          await supabase
            .from('sources')
            .update({
              last_status: 'healthy',
              last_error: null,
              last_attempted_at: new Date().toISOString(),
            })
            .eq('id', source.id);
        }
      } catch (err: any) {
        console.log(`✗ [DISCOURSE] ${source.name}: ${err.message || err}`);
      }
      await sleep(2000);
    }
  }

  console.log(`\n📊 Total raw items successfully fetched: ${allItems.length}`);

  // Category breakdown report
  const categoryCounts: Record<string, number> = {};
  for (const item of allItems) {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  }
  console.log('🏷️  Category breakdown:', categoryCounts);

  if (isConfigured && supabase && allItems.length > 0) {
    // Deduplicate items by URL to prevent Postgres intra-batch ON CONFLICT errors
    const uniqueItems = Array.from(new Map(allItems.map((item) => [item.url, item])).values());
    console.log(`💾 Upserting ${uniqueItems.length} unique raw items with categories into Supabase...`);
    const chunkSize = 50;
    for (let i = 0; i < uniqueItems.length; i += chunkSize) {
      const chunk = uniqueItems.slice(i, i + chunkSize).map((item) => ({
        source_id: item.source_id,
        title: item.title,
        url: item.url,
        published_at: item.published_at,
        raw_summary: item.raw_summary,
        category: item.category,
        og_image: item.og_image,
        og_description: item.og_description,
        fetched_at: item.fetched_at,
      }));
      const { error: upsertErr } = await supabase.from('raw_items').upsert(chunk, { onConflict: 'url' });
      if (upsertErr) {
        // If Supabase complains that category column does not exist yet, fallback gracefully without category
        if (upsertErr.message?.includes('category')) {
          console.warn('⚠️ Category column not yet in Supabase schema. Retrying without category...');
          const legacyChunk = chunk.map(({ category, ...rest }) => rest);
          await supabase.from('raw_items').upsert(legacyChunk, { onConflict: 'url' });
        } else {
          console.error('Supabase upsert error:', upsertErr.message);
        }
      }
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

  console.log('✨ High-capacity ingestion cycle completed.');
}

fetchRss().catch((err) => {
  console.error('Fatal error during RSS ingestion:', err);
  process.exit(1);
});
