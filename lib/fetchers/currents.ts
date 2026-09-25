import * as fs from 'fs';
import * as path from 'path';
import { getCategoryAndRegion } from '../topics';

const QUOTA_FILE = path.resolve(process.cwd(), 'data', 'currents-quota.json');
const MAX_REQUESTS_PER_DAY = 250;

interface QuotaState {
  date: string;
  requestsToday: number;
  maxLimit: number;
  lastUpdated: string;
}

/**
 * Checks and updates the daily rate-limit quota counter.
 * Returns true if request is permitted under 250/day limit, false if quota exceeded.
 */
function checkAndUpdateQuota(): boolean {
  try {
    const today = new Date().toISOString().slice(0, 10);
    let state: QuotaState = {
      date: today,
      requestsToday: 0,
      maxLimit: MAX_REQUESTS_PER_DAY,
      lastUpdated: new Date().toISOString(),
    };

    if (fs.existsSync(QUOTA_FILE)) {
      try {
        const raw = fs.readFileSync(QUOTA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.date === today) {
          state = parsed;
        }
      } catch {
        // If file corrupted, proceed with new day state
      }
    }

    if (state.requestsToday >= state.maxLimit) {
      console.warn(
        `⚠️ [Currents API] Daily request quota reached (${state.requestsToday}/${state.maxLimit} requests used on ${state.date}). Skipping to avoid quota breach.`
      );
      return false;
    }

    state.requestsToday += 1;
    state.lastUpdated = new Date().toISOString();

    const dataDir = path.dirname(QUOTA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(QUOTA_FILE, JSON.stringify(state, null, 2));
    console.log(
      `📊 [Currents API] Quota check passed: Request #${state.requestsToday}/${state.maxLimit} for ${state.date}`
    );
    return true;
  } catch (err: any) {
    console.warn('[Currents API] Error updating quota cache:', err.message);
    return true;
  }
}

export interface IngestedItem {
  id?: string;
  source_id?: string;
  source_name: string;
  lane: 'mainstream' | 'grassroots' | 'discourse' | 'aggregator';
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
 * Fetches India-relevant news stories from Currents API with quota enforcement and defensive backoff.
 */
export async function fetchCurrentsApi(sourceId?: string): Promise<IngestedItem[]> {
  const apiKey = process.env.CURRENTS_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your-')) {
    console.log(
      'ℹ️  [Currents API] CURRENTS_API_KEY is not configured in .env.local. Skipping Currents API fetch gracefully.'
    );
    return [];
  }

  const allowed = checkAndUpdateQuota();
  if (!allowed) {
    return [];
  }

  const endpoint = `https://api.currentsapi.services/v1/latest-news?country=IN&apiKey=${encodeURIComponent(
    apiKey.trim()
  )}`;

  try {
    console.log('📡 [Currents API] Querying India news endpoint...');
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (response.status === 429) {
      console.warn('⚠️ [Currents API] HTTP 429 Rate Limit exceeded from API gateway. Backing off gracefully.');
      return [];
    }

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`⚠️ [Currents API] HTTP ${response.status} ${response.statusText}: ${errText.slice(0, 150)}`);
      return [];
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.news)) {
      console.warn('⚠️ [Currents API] Unexpected payload format from Currents API:', data);
      return [];
    }

    const items: IngestedItem[] = data.news.map((item: any) => {
      const cleanTitle = (item.title || 'Untitled Article').trim();
      const rawSummary = (item.description || item.snippet || '').slice(0, 300);
      const { topic } = getCategoryAndRegion(cleanTitle, 'national', 'aggregator', 'Currents API');

      let imageUrl: string | undefined = undefined;
      if (item.image && typeof item.image === 'string' && item.image.startsWith('http') && item.image !== 'None') {
        imageUrl = item.image;
      }

      return {
        source_id: sourceId,
        source_name: 'Currents API',
        lane: 'aggregator' as const,
        title: cleanTitle,
        url: (item.url || '').trim(),
        published_at: item.published ? new Date(item.published).toISOString() : new Date().toISOString(),
        raw_summary: rawSummary,
        category: topic,
        og_image: imageUrl,
        fetched_at: new Date().toISOString(),
      };
    }).filter((i: IngestedItem) => i.url.startsWith('http') && i.title.length > 5);

    console.log(`✅ [Currents API] Successfully fetched ${items.length} articles.`);
    return items;
  } catch (err: any) {
    console.warn(`⚠️ [Currents API] Fetch failed gracefully: ${err.message}`);
    return [];
  }
}
