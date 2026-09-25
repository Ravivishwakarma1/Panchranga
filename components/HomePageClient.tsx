'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SafeImage from './SafeImage';
import CoverageBar from '@/components/CoverageBar';
import NewsletterSignup from '@/components/NewsletterSignup';
import { timeAgo } from '@/lib/utils';

export interface Hub {
  id: string;
  title: string;
  ai_summary: string | null;
  last_updated_at: string;
  og_image?: string | null;
  mainstream_count: number;
  grassroots_count: number;
  discourse_count: number;
  first_source_name?: string;
  sources?: { name?: string; lane?: string; region?: string };
  region?: string;
  topic?: string;
}

export interface FactCheckItem {
  id: string;
  source_name: string;
  title: string;
  url: string;
  published_at: string;
}
import {
  TOPIC_SECTIONS,
  TOPIC_KEYWORDS,
  getCategoryAndRegion,
  getRegionFromHub,
} from '@/lib/topics';

export default function HomePageClient({
  hubs,
  heroHub,
  factCheckItems,
  initialSearchQuery = '',
  initialTopic = '',
}: {
  hubs: Hub[];
  heroHub: Hub | null;
  factCheckItems: FactCheckItem[];
  initialSearchQuery?: string;
  initialTopic?: string;
}) {
  const searchParams = useSearchParams();
  const [centerVisibleCount, setCenterVisibleCount] = useState(12);
  const [visibleTopicsCount, setVisibleTopicsCount] = useState(3);

  const qParam = searchParams?.get('q') ?? initialSearchQuery;
  const topicParam = searchParams?.get('topic') ?? initialTopic;
  const activeQuery = qParam.trim();
  const isFiltered = Boolean(activeQuery || (topicParam && topicParam !== 'All'));

  const baseHubs = useMemo(() => {
    return heroHub ? [heroHub, ...hubs] : hubs;
  }, [heroHub, hubs]);

  const filteredHubs = useMemo(() => {
    let result = baseHubs;

    if (activeQuery) {
      const q = activeQuery.toLowerCase();
      const isFactCheck = q === 'fact check' || q === 'fact-check' || q === 'factcheck';
      const factCheckSources = ['alt news', 'boom', 'newschecker', 'factly'];

      result = result.filter((hub) => {
        // Fact check query matches hubs with fact checking items or keywords
        if (isFactCheck) {
          const sName = (hub.first_source_name || hub.sources?.name || '').toLowerCase();
          const matchesFcSource = factCheckSources.some((fc) => sName.includes(fc));
          const matchesFcTitle =
            hub.title.toLowerCase().includes('fact check') ||
            hub.title.toLowerCase().includes('fact-check') ||
            hub.title.toLowerCase().includes('falsely') ||
            hub.title.toLowerCase().includes('viral video');
          if (matchesFcSource || matchesFcTitle) return true;
        }

        // Title and summary match
        if (hub.title.toLowerCase().includes(q)) return true;
        if (hub.ai_summary && hub.ai_summary.toLowerCase().includes(q)) return true;

        // Source name match
        const sourceName = (hub.first_source_name || hub.sources?.name || '').toLowerCase();
        if (sourceName.includes(q)) return true;

        // Topic / Category match
        const detected = getCategoryAndRegion(hub.title, hub.sources?.region);
        const topic = (hub.topic || detected.topic || '').toLowerCase();
        if (topic.includes(q) || q.includes(topic)) return true;

        // Topic keywords matching
        for (const [topicKey, keywords] of Object.entries(TOPIC_KEYWORDS)) {
          if (topicKey.toLowerCase().includes(q) || q.includes(topicKey.toLowerCase())) {
            if (keywords.some((kw) => hub.title.toLowerCase().includes(kw.toLowerCase()))) {
              return true;
            }
          }
        }

        // Region match
        const region = (hub.region || detected.region || '').toLowerCase();
        if (region.includes(q) || q.includes(region)) return true;

        return false;
      });
    }

    if (topicParam && topicParam !== 'All') {
      const t = topicParam.toLowerCase();
      result = result.filter((hub) => {
        const detected = getCategoryAndRegion(hub.title, hub.sources?.region);
        const topic = (hub.topic || detected.topic || '').toLowerCase();
        return topic.includes(t) || hub.title.toLowerCase().includes(t);
      });
    }

    return result;
  }, [baseHubs, activeQuery, topicParam]);

  const displayHeroHub = isFiltered ? (filteredHubs[0] ?? null) : heroHub;
  const displayListHubs = isFiltered
    ? (filteredHubs.length > 1 ? filteredHubs.slice(1, centerVisibleCount + 1) : filteredHubs)
    : hubs.slice(0, centerVisibleCount);

  // Sorted hubs for sidebars
  const sidebarPool = isFiltered && filteredHubs.length > 0 ? filteredHubs : baseHubs;
  const todaysBriefingHubs = [...sidebarPool]
    .sort((a, b) => {
      const aTotal = a.mainstream_count + a.grassroots_count + a.discourse_count;
      const bTotal = b.mainstream_count + b.grassroots_count + b.discourse_count;
      return bTotal - aTotal;
    })
    .slice(0, 4);

  const mostCoveredHubs = [...sidebarPool]
    .sort((a, b) => {
      const aTotal = a.mainstream_count + a.grassroots_count + a.discourse_count;
      const bTotal = b.mainstream_count + b.grassroots_count + b.discourse_count;
      return bTotal - aTotal;
    })
    .slice(0, 5);

  return (
    <div className="w-full pb-16 font-sans">
      {/* SECTION 4 — Main 3-Column Layout Grid */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-[28px]">
        {/* Active Filter Banner */}
        {isFiltered && (
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-[#C0392B] text-white text-[10px] font-mono uppercase tracking-wider rounded font-bold">
                Filter Active
              </span>
              <span className="text-[15px] font-bold text-[#1A1A1A]">
                &ldquo;{activeQuery || topicParam}&rdquo;
              </span>
              <span className="text-xs text-[#9CA3AF]">
                — {filteredHubs.length} {filteredHubs.length === 1 ? 'story hub' : 'story hubs'}
              </span>
            </div>
            <Link
              href="/"
              className="text-xs text-[#6B6B6B] hover:text-[#C0392B] font-semibold transition-colors border border-[#E5E5E0] rounded px-3 py-1.5 hover:border-[#C0392B] flex items-center gap-1 shrink-0"
            >
              <span>Clear filter</span>
              <span>✕</span>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-[28px]">
          {/* CENTER CONTENT — Hero + Story List (Order 1 on mobile, 2 on desktop) */}
          <main className="order-1 lg:order-2 space-y-6 min-w-0">
            {isFiltered && filteredHubs.length === 0 ? (
              <div className="py-16 text-center space-y-4 bg-white rounded-lg border border-[#E5E5E0] p-8">
                <div className="text-3xl">🔍</div>
                <h3 className="font-serif-title text-2xl text-[#1A1A1A] font-bold">
                  No stories match &ldquo;{activeQuery || topicParam}&rdquo;
                </h3>
                <p className="text-xs text-[#6B6B6B] max-w-md mx-auto leading-relaxed">
                  No clustered story hubs matched your filter. Try searching for broader terms like &ldquo;Politics&rdquo;, &ldquo;Courts&rdquo;, or &ldquo;National&rdquo;.
                </p>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-flex items-center px-5 py-2.5 bg-[#1A1A1A] text-white rounded text-xs font-semibold hover:bg-black transition-colors"
                  >
                    View all topic hubs →
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Hero Story (Height: 380px) */}
                {displayHeroHub && <HeroCard hub={displayHeroHub} />}

                {/* List Layout (NOT Card Grid) */}
                <div className="divide-y divide-[#E5E5E0]">
                  {displayListHubs.map((hub) => (
                    <StoryListItem key={`center-list-${hub.id}`} hub={hub} />
                  ))}
                </div>

                {/* More Stories Button */}
                {centerVisibleCount < (isFiltered ? filteredHubs.length : hubs.length) && (
                  <div className="pt-4">
                    <button
                      onClick={() => setCenterVisibleCount((prev) => prev + 12)}
                      className="w-full py-2.5 border border-[#E5E5E0] rounded text-[13px] font-semibold text-[#1A1A1A] hover:bg-gray-50 transition-colors"
                    >
                      More stories →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

          {/* LEFT SIDEBAR — "Today's Briefing" (280px) (Order 2 on mobile, 1 on desktop) */}
          <aside className="order-2 lg:order-1 space-y-4">
            <h2 className="font-sans text-[20px] font-bold text-[#1A1A1A] mb-[16px] pb-2 border-b-2 border-[#1A1A1A]">
              Today's Briefing
            </h2>
            <div className="divide-y divide-[#E5E5E0]">
              {todaysBriefingHubs.map((hub) => {
                const totalSources = hub.mainstream_count + hub.grassroots_count + hub.discourse_count;
                const detected = getCategoryAndRegion(hub.title, hub.sources?.region);
                const region = hub.region || detected.region;
                const imageUrl = hub.og_image
                  ? `/api/og-image?url=${encodeURIComponent(hub.og_image)}`
                  : null;

                return (
                  <div key={`briefing-${hub.id}`} className="py-[16px] first:pt-0">
                    <Link href={`/hub/${encodeURIComponent(hub.id)}`} className="group flex items-start gap-2.5">
                      {/* 72x52px Thumbnail */}
                      <div className="w-[72px] h-[52px] shrink-0 rounded overflow-hidden bg-[#E8E4DF]">
                        <SafeImage
                          src={imageUrl}
                          alt={hub.title}
                          className="w-[72px] h-[52px] object-cover group-hover:scale-105 transition-transform"
                          fallbackText={hub.first_source_name || 'News'}
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Meta: {region} · {source_count} sources */}
                        <div className="text-[11px] text-[#9CA3AF] font-sans">
                          {region} · {totalSources} {totalSources === 1 ? 'source' : 'sources'}
                        </div>

                        {/* Headline */}
                        <h3 className="text-[14px] font-semibold text-[#1A1A1A] leading-[1.4] line-clamp-2 group-hover:text-[#C0392B] transition-colors">
                          {hub.title}
                        </h3>

                        {/* Coverage Bar (4px tall) */}
                        <div className="pt-1">
                          <CoverageBar
                            mainstreamCount={hub.mainstream_count}
                            grassrootsCount={hub.grassroots_count}
                            discourseCount={hub.discourse_count}
                            showLegend={false}
                          />
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* More Stories Button */}
            <button
              onClick={() => setCenterVisibleCount((prev) => prev + 6)}
              className="w-full py-2 border border-[#E5E5E0] rounded text-[13px] font-semibold text-[#1A1A1A] text-center hover:bg-gray-50 transition-colors"
            >
              More stories
            </button>
          </aside>

          {/* RIGHT SIDEBAR — "Most Covered" + "Fact Check" (300px) (Order 3 on mobile, 3 on desktop) */}
          <aside className="order-3 space-y-8">
            {/* Most Covered */}
            <div className="space-y-4">
              <h2 className="font-sans text-[20px] font-bold text-[#1A1A1A] mb-[16px] pb-2 border-b-2 border-[#1A1A1A]">
                Most Covered
              </h2>

              <div className="divide-y divide-[#E5E5E0]">
                {mostCoveredHubs.map((hub) => {
                  const totalSources = hub.mainstream_count + hub.grassroots_count + hub.discourse_count;
                  const imageUrl = hub.og_image
                    ? `/api/og-image?url=${encodeURIComponent(hub.og_image)}`
                    : null;

                  return (
                    <div key={`most-covered-${hub.id}`} className="py-3 first:pt-0">
                      <Link href={`/hub/${encodeURIComponent(hub.id)}`} className="group flex items-start gap-2.5">
                        {/* 64x48px Thumbnail */}
                        <div className="w-[64px] h-[48px] shrink-0 rounded overflow-hidden bg-[#E8E4DF]">
                          <SafeImage
                            src={imageUrl}
                            alt={hub.title}
                            className="w-[64px] h-[48px] object-cover group-hover:scale-105 transition-transform"
                            fallbackText={hub.first_source_name || 'News'}
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Badge */}
                          <div className="text-[11px] text-[#9CA3AF] font-sans font-medium">
                            {totalSources} {totalSources === 1 ? 'source' : 'sources'}
                          </div>

                          {/* Headline */}
                          <h4 className="text-[13px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2 group-hover:text-[#C0392B] transition-colors">
                            {hub.title}
                          </h4>

                          {/* 3px Coverage Bar */}
                          <div className="pt-0.5">
                            <CoverageBar
                              mainstreamCount={hub.mainstream_count}
                              grassrootsCount={hub.grassroots_count}
                              discourseCount={hub.discourse_count}
                              showLegend={false}
                            />
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fact Check Section */}
            <div className="space-y-4">
              <h2 className="font-sans text-[20px] font-bold text-[#1A1A1A] mt-[24px] mb-[16px] pb-2 border-b-2 border-[#1A1A1A]">
                Fact Check
              </h2>

              <div className="divide-y divide-[#E5E5E0]">
                {factCheckItems.map((item) => (
                  <div key={`fc-${item.id}`} className="py-3 first:pt-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block space-y-1"
                    >
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#C0392B] font-bold block">
                        {item.source_name}
                      </span>
                      <h4 className="text-[13px] font-semibold text-[#1A1A1A] leading-snug group-hover:text-[#C0392B] transition-colors">
                        {item.title}
                      </h4>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div style={{ marginTop: '32px' }}>
              <NewsletterSignup />
            </div>
          </aside>
        </div>
      </div>

      {/* SECTION 5 — Topic Sections (below 3-column area) */}
      {!isFiltered && (
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-16 space-y-16">
          {TOPIC_SECTIONS.slice(0, visibleTopicsCount).map((topicName) => (
            <TopicSection key={topicName} topicName={topicName} hubs={baseHubs} />
          ))}

          {visibleTopicsCount < TOPIC_SECTIONS.length && (
            <div className="text-center pt-6">
              <button
                onClick={() => setVisibleTopicsCount((prev) => Math.min(prev + 3, TOPIC_SECTIONS.length))}
                className="px-8 py-3 bg-[#1A1A1A] text-white rounded font-sans text-sm font-semibold hover:bg-black transition-colors"
              >
                Load more topics ↓
              </button>
            </div>
          )}
        </div>
      )}

      {/* Full-width Newsletter Banner */}
      <section style={{
        background: '#1A1A1A',
        padding: '60px 32px',
        marginTop: '40px'
      }}>
        <div style={{
          maxWidth: '1320px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '32px'
        }}>
          <div>
            <h2 style={{
              fontFamily: 'Georgia, serif',
              fontSize: '32px',
              color: 'white',
              margin: '0 0 8px 0',
              fontWeight: 700
            }}>
              Every color, every morning.
            </h2>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              color: '#9CA3AF',
              margin: 0
            }}>
              Top 3 stories · Mainstream + Grassroots + Discourse · 7 AM IST daily
            </p>
          </div>
          <NewsletterSignup />
        </div>
      </section>
    </div>
  );
}

/**
 * Center Hero Component (Height: 380px)
 */
function HeroCard({ hub }: { hub: Hub }) {
  const totalSources = hub.mainstream_count + hub.grassroots_count + hub.discourse_count;
  const imageUrl = hub.og_image
    ? `/api/og-image?url=${encodeURIComponent(hub.og_image)}`
    : null;

  return (
    <article className="relative w-full h-[380px] rounded-lg overflow-hidden group mb-[24px]">
      <SafeImage
        src={imageUrl}
        alt={hub.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        fallbackText="Featured Story"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      <div className="absolute inset-0 p-6 flex flex-col justify-end z-10">
        <div className="space-y-2 max-w-3xl">
          <span className="px-2.5 py-1 bg-[#C0392B] text-white text-[10px] font-mono uppercase tracking-wider rounded font-bold inline-block">
            FEATURED STORY
          </span>

          <Link href={`/hub/${encodeURIComponent(hub.id)}`} className="block group">
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-white leading-tight group-hover:text-gray-200 transition-colors line-clamp-3">
              {hub.title}
            </h1>
          </Link>

          {hub.ai_summary && (
            <p className="text-xs sm:text-sm text-gray-300 italic line-clamp-2">
              "{hub.ai_summary}"
            </p>
          )}

          <div className="pt-2">
            <CoverageBar
              mainstreamCount={hub.mainstream_count}
              grassrootsCount={hub.grassroots_count}
              discourseCount={hub.discourse_count}
              showLegend={false}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-300 pt-1">
            <span>Updated {timeAgo(hub.last_updated_at)}</span>
            <Link
              href={`/hub/${encodeURIComponent(hub.id)}`}
              className="text-white font-semibold hover:underline"
            >
              Explore hub →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Ground News Center Story List Item Component
 */
function StoryListItem({ hub }: { hub: Hub }) {
  const totalSources = hub.mainstream_count + hub.grassroots_count + hub.discourse_count;
  const detected = getCategoryAndRegion(hub.title, hub.sources?.region);
  const topic = hub.topic || detected.topic;
  const region = hub.region || detected.region;
  const sourceName = hub.sources?.name || hub.first_source_name || 'Unknown';
  const imageUrl = hub.og_image
    ? `/api/og-image?url=${encodeURIComponent(hub.og_image)}`
    : null;

  return (
    <div className="py-[16px] flex justify-between items-start gap-4 border-b border-[#E5E5E0]">
      {/* Left side (text) */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Category label · Region · Sources */}
        <div className="text-[11px] text-[#9CA3AF] font-sans">
          {topic} · {region} · {totalSources} {totalSources === 1 ? 'source' : 'sources'}
        </div>

        {/* Source Name above headline */}
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            color: '#C0392B',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'block',
            marginBottom: '4px',
          }}
        >
          {sourceName}
        </span>

        {/* Headline */}
        <Link href={`/hub/${encodeURIComponent(hub.id)}`} className="group">
          <h2 className="font-sans text-[20px] font-bold text-[#1A1A1A] leading-[1.3] group-hover:text-[#C0392B] transition-colors line-clamp-2">
            {hub.title}
          </h2>
        </Link>

        {/* Coverage Bar (4px tall) */}
        <div className="py-0.5">
          <CoverageBar
            mainstreamCount={hub.mainstream_count}
            grassrootsCount={hub.grassroots_count}
            discourseCount={hub.discourse_count}
            showLegend={false}
          />
        </div>

        {/* Card Footer: [timestamp left] [Explore hub → right] */}
        <div className="flex items-center justify-between text-xs text-[#6B6B6B] pt-1">
          <span>Updated {timeAgo(hub.last_updated_at)}</span>
          <Link
            href={`/hub/${encodeURIComponent(hub.id)}`}
            className="text-[#C0392B] font-medium hover:underline text-xs"
          >
            Explore hub →
          </Link>
        </div>
      </div>

      {/* Right side (image 96x72px) */}
      {imageUrl && (
        <div className="w-[96px] h-[72px] shrink-0 rounded overflow-hidden bg-[#E8E4DF]">
          <SafeImage
            src={imageUrl}
            alt={hub.title}
            className="w-[96px] h-[72px] object-cover"
            fallbackText={hub.first_source_name || 'News'}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Section 5 Topic Section Component
 */
function TopicSection({ topicName, hubs }: { topicName: string; hubs: Hub[] }) {
  const keywords = TOPIC_KEYWORDS[topicName] || [topicName.toLowerCase()];
  
  // Filter hubs for this topic
  const topicHubs = hubs.filter((h) =>
    keywords.some((kw) => h.title.toLowerCase().includes(kw.toLowerCase()))
  );

  const displayHubs = (topicHubs.length >= 3 ? topicHubs : hubs).slice(0, 3);

  // Less Covered (Blindspot) hubs: hubs with coverage in only 1 lane (or fewest total sources)
  const lessCoveredHubs = [...(topicHubs.length > 0 ? topicHubs : hubs)]
    .filter((h) => {
      const activeLanes = [
        h.mainstream_count > 0,
        h.grassroots_count > 0,
        h.discourse_count > 0,
      ].filter(Boolean).length;
      return activeLanes === 1;
    })
    .slice(0, 2);

  // Fallback if lessCoveredHubs count < 2
  const finalLessCovered = lessCoveredHubs.length >= 2
    ? lessCoveredHubs
    : (topicHubs.length > 0 ? topicHubs : hubs).slice(0, 2);

  return (
    <section className="space-y-6">
      {/* Section Header Row */}
      <div className="flex items-center justify-between border-b-2 border-[#1A1A1A] pb-3">
        <h2 className="font-sans text-[24px] font-bold text-[#1A1A1A]">
          {topicName}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert(`Following ${topicName}`)}
            className="border border-[#E5E5E0] px-4 py-2 rounded text-[13px] font-semibold text-[#1A1A1A] hover:bg-gray-100 transition-colors"
          >
            Follow
          </button>
          <Link
            href={`/?q=${encodeURIComponent(topicName)}`}
            className="border border-[#E5E5E0] px-4 py-2 rounded text-[13px] font-semibold text-[#1A1A1A] hover:bg-gray-100 transition-colors"
          >
            Read More
          </Link>
        </div>
      </div>

      {/* Section Body — Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Left 65%: Latest Topic News */}
        <div className="space-y-4">
          <h3 className="font-sans text-[16px] font-semibold text-[#1A1A1A]">
            Latest {topicName} News
          </h3>

          <div className="divide-y divide-[#E5E5E0]">
            {displayHubs.map((hub) => (
              <StoryListItem key={`topic-${topicName}-${hub.id}`} hub={hub} />
            ))}
          </div>
        </div>

        {/* Right 35%: Less Covered Panel (Dark Background #1A1A1A) */}
        <div className="bg-[#1A1A1A] p-[20px] rounded-lg text-white space-y-4 h-fit">
          <div>
            <h3 className="font-sans text-[16px] font-bold text-white">
              Less Covered
            </h3>
            <p className="font-sans text-[12px] text-[#9CA3AF] mt-0.5">
              Stories with limited coverage across all lanes
            </p>
          </div>

          <div className="space-y-4 divide-y divide-[#333333]">
            {finalLessCovered.map((hub) => {
              const totalSources = hub.mainstream_count + hub.grassroots_count + hub.discourse_count;
              const imageUrl = hub.og_image
                ? `/api/og-image?url=${encodeURIComponent(hub.og_image)}`
                : null;

              return (
                <div key={`less-covered-${hub.id}`} className="pt-4 first:pt-0">
                  <Link href={`/hub/${encodeURIComponent(hub.id)}`} className="group block space-y-2">
                    <div className="w-full h-[120px] rounded-[6px] overflow-hidden bg-[#333333]">
                      <SafeImage
                        src={imageUrl}
                        alt={hub.title}
                        className="w-full h-[120px] object-cover group-hover:scale-105 transition-transform"
                        fallbackText={hub.first_source_name || 'News'}
                      />
                    </div>
                    <h4 className="font-sans text-[14px] font-semibold text-white leading-snug line-clamp-2 group-hover:text-[#C0392B] transition-colors">
                      {hub.title}
                    </h4>
                    <div className="font-sans text-[12px] text-[#9CA3AF]">
                      {totalSources} {totalSources === 1 ? 'source' : 'sources'}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
