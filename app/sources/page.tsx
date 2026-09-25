import fs from 'fs';
import path from 'path';
import { STARTER_SOURCES } from '@/lib/constants';
import { supabase } from '@/lib/supabase/client';

export const revalidate = 60;

interface SourceItem {
  id?: string;
  name: string;
  lane: string;
  language: string;
  region?: string | null;
  feed_url: string;
  type?: string;
  is_active?: boolean;
  last_status?: string | null;
  article_count?: number;
}

async function getSources(): Promise<SourceItem[]> {
  let sources: SourceItem[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('id, name, lane, language, region, feed_url, is_active')
        .eq('is_active', true)
        .order('lane')
        .order('name');

      if (!error && data && data.length > 0) {
        sources = data as SourceItem[];

        // Try getting article counts per source
        try {
          const { data: items } = await supabase.from('raw_items').select('source_id').limit(10000);
          if (items && items.length > 0) {
            const countMap: Record<string, number> = {};
            for (const it of items) {
              if (it.source_id) {
                countMap[it.source_id] = (countMap[it.source_id] || 0) + 1;
              }
            }
            sources = sources.map((s) => ({
              ...s,
              article_count: s.id ? countMap[s.id] || 0 : 0,
            }));
          }
        } catch {
          // Ignore count error
        }

        return sources;
      }
      if (error) {
        console.warn('Supabase sources query error:', error);
      }
    } catch (err) {
      console.warn('Failed to query sources from Supabase, falling back:', err);
    }
  }

  // Fallback to data/sources.json
  try {
    const sourcesPath = path.resolve(process.cwd(), 'data', 'sources.json');
    if (fs.existsSync(sourcesPath)) {
      const parsed: SourceItem[] = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
      const active = parsed.filter((s) => s.is_active !== false);
      if (active.length > 0) {
        return active;
      }
    }
  } catch (err) {
    console.error('Error reading fallback sources.json:', err);
  }

  return STARTER_SOURCES.map((s) => ({ ...s, is_active: true })) as SourceItem[];
}

export default async function SourcesPage() {
  const sources = await getSources();

  const mainstreamCount = sources.filter((s) => s.lane === 'mainstream').length;
  const grassrootsCount = sources.filter((s) => s.lane === 'grassroots').length;
  const discourseCount = sources.filter((s) => s.lane === 'discourse').length;

  return (
    <div className="max-w-[1320px] mx-auto space-y-8 py-6 font-sans text-[#1A1A1A]">
      {/* Header */}
      <div className="space-y-3 border-b border-[#E5E5E0] pb-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-[#F5F5F3] border border-[#E5E5E0] text-xs font-mono font-semibold uppercase text-[#6B6B6B] tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <span>Verified Sources Registry</span>
        </div>
        <h1 className="font-serif-title text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">
          Active Feeds Directory
        </h1>
        <p className="text-sm text-[#4A4A4A] max-w-2xl leading-relaxed">
          Panchranga operates with 100% algorithmic and source transparency. Below is the complete directory of our <strong>{sources.length} active and healthy sources</strong> across national mainstream media, independent grassroots publications, and civic discourse channels.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
          <span className="px-3 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
            Mainstream ({mainstreamCount})
          </span>
          <span className="px-3 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
            Grassroots ({grassrootsCount})
          </span>
          <span className="px-3 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
            Discourse ({discourseCount})
          </span>
        </div>
      </div>

      {/* Sources Table Card */}
      <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#FBFBF9] border-b border-[#E5E5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-mono font-bold uppercase text-[#1A1A1A] tracking-wider">
            {sources.length} active sources verified
          </span>
          <span className="text-xs text-[#6B6B6B]">
            Automated polling interval: 15–30 minutes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1A1A1A]">
            <thead className="bg-[#F5F5F3] text-[#6B6B6B] uppercase text-[10px] font-mono border-b border-[#E5E5E0]">
              <tr>
                <th className="py-3 px-4 font-semibold">Source Name</th>
                <th className="py-3 px-4 font-semibold">Lane</th>
                <th className="py-3 px-4 font-semibold">Language</th>
                <th className="py-3 px-4 font-semibold">Region</th>
                <th className="py-3 px-4 font-semibold">Articles Ingested</th>
                <th className="py-3 px-4 font-semibold text-right">Feed Endpoint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E0]">
              {sources.map((source, idx) => {
                const laneBadge =
                  source.lane === 'mainstream'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : source.lane === 'grassroots'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#1A1A1A]">
                      <div className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{source.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${laneBadge}`}>
                        {source.lane}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono uppercase text-[11px] text-[#4A4A4A]">
                      {source.language || 'en'}
                    </td>
                    <td className="py-3 px-4 capitalize text-[#4A4A4A]">
                      {source.region || 'national'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] font-medium text-[#1A1A1A]">
                      {typeof source.article_count === 'number' ? (
                        <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                          {source.article_count} items
                        </span>
                      ) : (
                        <span className="text-[#888]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={source.feed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#C0392B] hover:underline font-mono text-[11px] truncate max-w-xs inline-block"
                        title={source.feed_url}
                      >
                        {source.feed_url.replace(/^https?:\/\//, '')}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
