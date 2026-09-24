'use client';

import { useState } from 'react';
import Link from 'next/link';
import SafeImage from './SafeImage';
import CoverageBar from '@/components/CoverageBar';
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
}

export interface FactCheckItem {
  id: string;
  source_name: string;
  title: string;
  url: string;
  published_at: string;
}

const TOPIC_SECTIONS = [
  'Politics',
  'Courts & Law',
  'Environment',
  'Economy',
  'UP & Bihar',
  'Maharashtra',
];

const TOPIC_KEYWORDS: Record<string, string[]> = {
  Politics: ['election', 'bjp', 'congress', 'modi', 'parliament', 'minister', 'party', 'vote', 'pm', 'cm', 'governor', 'rajniti'],
  'Courts & Law': ['court', 'supreme court', 'high court', 'judge', 'verdict', 'case', 'fir', 'arrest', 'bail', 'law', 'justice'],
  Environment: ['climate', 'flood', 'pollution', 'monsoon', 'rain', 'forest', 'river', 'drought', 'disaster', 'environment'],
  Economy: ['economy', 'gdp', 'rbi', 'inflation', 'bank', 'market', 'tax', 'rupee', 'budget', 'growth', 'finance'],
  'UP & Bihar': ['up', 'uttar pradesh', 'bihar', 'lucknow', 'patna', 'varanasi', 'prayagraj', 'kanpur'],
  Maharashtra: ['maharashtra', 'mumbai', 'pune', 'nagpur', 'thackeray', 'shinde', 'fadnavis', 'mva', 'mahayuti'],
};

function getCategoryAndRegion(title: string): { topic: string; region: string } {
  const lower = title.toLowerCase();
  let topic = 'General';
  let region = 'India';

  for (const [top, kws] of Object.entries(TOPIC_KEYWORDS)) {
    if (kws.some((kw) => lower.includes(kw))) {
      topic = top;
      break;
    }
  }

  if (lower.includes('mumbai') || lower.includes('maharashtra') || lower.includes('pune')) region = 'Maharashtra';
  else if (lower.includes('delhi') || lower.includes('supreme court') || lower.includes('parliament')) region = 'New Delhi';
  else if (lower.includes('up') || lower.includes('uttar pradesh') || lower.includes('lucknow')) region = 'Uttar Pradesh';
  else if (lower.includes('bihar') || lower.includes('patna')) region = 'Bihar';
  else if (lower.includes('bengaluru') || lower.includes('karnataka') || lower.includes('kerala') || lower.includes('tamil')) region = 'South India';

  return { topic, region };
}

export default function HomePageClient({
  hubs,
  heroHub,
  factCheckItems,
}: {
  hubs: Hub[];
  heroHub: Hub | null;
  factCheckItems: FactCheckItem[];
}) {
  const [centerVisibleCount, setCenterVisibleCount] = useState(12);
  const [visibleTopicsCount, setVisibleTopicsCount] = useState(3);

  const allHubs = heroHub ? [heroHub, ...hubs] : hubs;

  // Sorted hubs for sidebars
  const todaysBriefingHubs = [...allHubs]
    .sort((a, b) => {
      const aTotal = a.mainstream_count + a.grassroots_count + a.discourse_count;
      const bTotal = b.mainstream_count + b.grassroots_count + b.discourse_count;
      return bTotal - aTotal;
    })
    .slice(0, 4);

  const mostCoveredHubs = [...allHubs]
    .sort((a, b) => {
      const aTotal = a.mainstream_count + a.grassroots_count + a.discourse_count;
      const bTotal = b.mainstream_count + b.grassroots_count + b.discourse_count;
      return bTotal - aTotal;
    })
    .slice(0, 5);

  const centerListHubs = hubs.slice(0, centerVisibleCount);

  return (
    <div className="w-full pb-16 font-sans">
      {/* SECTION 4 — Main 3-Column Layout Grid */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-[28px]">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-[28px]">
          
          {/* CENTER CONTENT — Hero + Story List (Order 1 on mobile, 2 on desktop) */}
          <main className="order-1 lg:order-2 space-y-6 min-w-0">
            {/* Hero Story (Height: 380px) */}
            {heroHub && <HeroCard hub={heroHub} />}

            {/* List Layout (NOT Card Grid) */}
            <div className="divide-y divide-[#E5E5E0]">
              {centerListHubs.map((hub) => (
                <StoryListItem key={`center-list-${hub.id}`} hub={hub} />
              ))}
            </div>

            {/* More Stories Button */}
            {centerVisibleCount < hubs.length && (
              <div className="pt-4">
                <button
                  onClick={() => setCenterVisibleCount((prev) => prev + 12)}
                  className="w-full py-2.5 border border-[#E5E5E0] rounded text-[13px] font-semibold text-[#1A1A1A] hover:bg-gray-50 transition-colors"
                >
                  More stories →
                </button>
              </div>
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
                const { region } = getCategoryAndRegion(hub.title);
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
                            {totalSources} sources
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
          </aside>
        </div>
      </div>

      {/* SECTION 5 — Topic Sections (below 3-column area) */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 mt-16 space-y-16">
        {TOPIC_SECTIONS.slice(0, visibleTopicsCount).map((topicName) => (
          <TopicSection key={topicName} topicName={topicName} hubs={allHubs} />
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
            <span>{totalSources} {totalSources === 1 ? 'source' : 'sources'} · Updated {timeAgo(hub.last_updated_at)}</span>
            <Link
              href={`/hub/${encodeURIComponent(hub.id)}`}
              className="text-white font-semibold hover:underline"
            >
              Read full coverage →
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
  const { topic, region } = getCategoryAndRegion(hub.title);
  const imageUrl = hub.og_image
    ? `/api/og-image?url=${encodeURIComponent(hub.og_image)}`
    : null;

  return (
    <div className="py-[16px] flex justify-between items-start gap-4 border-b border-[#E5E5E0]">
      {/* Left side (text) */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Category label · Region */}
        <div className="text-[11px] text-[#9CA3AF] font-sans">
          {topic} · {region}
        </div>

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

        {/* Source count text */}
        <div className="text-[12px] text-[#6B6B6B] font-sans">
          {totalSources} {totalSources === 1 ? 'source' : 'sources'}
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
