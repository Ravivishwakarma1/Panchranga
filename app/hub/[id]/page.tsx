import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { TopicHub, RawItem } from '@/lib/types';
import { checkSensitiveBypass } from '@/lib/summarizer';
import CoverageBar from '@/components/CoverageBar';
import SafeImage from '@/components/SafeImage';
import { timeAgo } from '@/lib/utils';
import MobileHubTabs from './MobileHubTabs';

interface PageProps {
  params: {
    id: string;
  };
}

function getHubData(id: string): TopicHub | null {
  try {
    const hubsPath = path.resolve(process.cwd(), 'data', 'topic-hubs.json');
    if (fs.existsSync(hubsPath)) {
      const hubs: TopicHub[] = JSON.parse(fs.readFileSync(hubsPath, 'utf-8'));
      const hub = hubs.find((h) => h.id === id || encodeURIComponent(h.id) === id);
      if (hub) return hub;
    }
  } catch (e) {
    console.error('Error fetching hub data:', e);
  }
  return null;
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function HubDetailPage({ params }: PageProps) {
  const hub = getHubData(params.id);

  if (!hub) {
    redirect('/');
  }

  const safeItems: RawItem[] = hub.items ?? [];
  const mainstreamItems = safeItems.filter((i) => i.lane === 'mainstream');
  const grassrootsItems = safeItems.filter((i) => i.lane === 'grassroots');
  const discourseItems = safeItems.filter((i) => i.lane === 'discourse');

  const isSensitive = checkSensitiveBypass(hub);
  const showAiSummary = safeItems.length >= 2 && !isSensitive && Boolean(hub.ai_summary);

  // First article with og_image for hero background
  const heroOgImage = safeItems.find((i) => i.og_image)?.og_image;
  const heroImageUrl = heroOgImage
    ? `/api/og-image?url=${encodeURIComponent(heroOgImage)}`
    : null;

  return (
    <div className="max-w-[1320px] mx-auto space-y-6 pb-12">
      {/* Top Back Navigation Link */}
      <Link
        href="/"
        className="inline-flex items-center space-x-1.5 text-xs text-[#6B6B6B] hover:text-[#C0392B] transition-colors"
      >
        <span>←</span>
        <span>Back to Topic Hubs</span>
      </Link>

      {/* Hero Banner with SafeImage */}
      <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-[#3A3835] shadow-sm group">
        <SafeImage
          src={heroImageUrl}
          alt={hub.title ?? 'Topic Hub'}
          className="w-full h-full object-cover"
          fallbackText="Panchranga Hub"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

        <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end text-white z-10 space-y-2 pointer-events-none">
          <div className="text-[11px] font-mono tracking-wider uppercase text-gray-300">
            Topic Hub · {safeItems.length} {safeItems.length === 1 ? 'Source' : 'Sources'} · First seen {timeAgo(hub.first_seen_at)}
          </div>
          <h1 className="font-serif-title text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
            {hub.title ?? 'Untitled Topic Hub'}
          </h1>
        </div>
      </div>

      {/* Prominent Coverage Bar below Hero */}
      <div className="bg-white p-4 rounded-lg border border-[#E5E5E0] shadow-xs space-y-2">
        <div className="text-xs font-mono uppercase tracking-wider text-[#6B6B6B] font-semibold">
          CROSS-MEDIA COVERAGE SPLIT
        </div>
        <CoverageBar
          mainstreamCount={mainstreamItems.length}
          grassrootsCount={grassrootsItems.length}
          discourseCount={discourseItems.length}
        />
      </div>

      {/* AI Overview Banner */}
      {showAiSummary && (
        <div className="p-5 bg-[#F5F5F3] border-l-4 border-l-[#C0392B] space-y-2 text-xs rounded-r-lg">
          <div className="text-[11px] font-mono tracking-wider uppercase text-[#6B6B6B] font-semibold">
            AI OVERVIEW
          </div>
          <p className="font-serif-title text-base sm:text-lg italic text-[#1A1A1A] leading-relaxed">
            "{hub.ai_summary}"
          </p>
          <p className="text-[11px] text-[#6B6B6B] pt-1">
            This is AI-generated from public headlines only. Read original sources to verify.
          </p>
        </div>
      )}

      {isSensitive && (
        <div className="p-4 bg-[#F5F5F3] border-l-4 border-l-[#C0392B] text-xs text-[#1A1A1A] space-y-1 rounded-r-lg">
          <p className="font-semibold text-[#C0392B] uppercase text-[11px] font-mono">
            Sources-Only Mode Active
          </p>
          <p className="text-[#6B6B6B]">
            AI overview is bypassed for high-stakes sensitive topics. Displaying publisher reports directly below.
          </p>
        </div>
      )}

      {/* Mobile Stacked Tabs Switcher */}
      <div className="block lg:hidden">
        <MobileHubTabs
          mainstream={mainstreamItems}
          grassroots={grassrootsItems}
          discourse={discourseItems}
        />
      </div>

      {/* Desktop & Tablet Multi-Column Layout */}
      <div className="hidden lg:grid grid-cols-3 gap-8 divide-x divide-[#E5E5E0]">
        {/* Mainstream Column */}
        <div className="space-y-6 pr-4">
          <div className="text-xs font-mono tracking-wider uppercase text-[#6B6B6B] font-semibold border-b border-[#E5E5E0] pb-2">
            MAINSTREAM ({mainstreamItems.length})
          </div>

          <div className="space-y-6 divide-y divide-[#E5E5E0]">
            {mainstreamItems.length === 0 ? (
              <p className="text-xs text-[#6B6B6B] italic py-4">
                No mainstream reports in this hub.
              </p>
            ) : (
              mainstreamItems.map((item, idx) => (
                <ArticleCard key={item.id || idx} item={item} />
              ))
            )}
          </div>
        </div>

        {/* Grassroots Column */}
        <div className="space-y-6 pl-4 pr-4">
          <div className="text-xs font-mono tracking-wider uppercase text-[#6B6B6B] font-semibold border-b border-[#E5E5E0] pb-2">
            GRASSROOTS ({grassrootsItems.length})
          </div>

          <div className="space-y-6 divide-y divide-[#E5E5E0]">
            {grassrootsItems.length === 0 ? (
              <p className="text-xs text-[#6B6B6B] italic py-4">
                No grassroots reports in this hub.
              </p>
            ) : (
              grassrootsItems.map((item, idx) => (
                <ArticleCard key={item.id || idx} item={item} />
              ))
            )}
          </div>
        </div>

        {/* Public Discourse Column */}
        <div className="space-y-6 pl-4">
          <div className="text-xs font-mono tracking-wider uppercase text-[#6B6B6B] font-semibold border-b border-[#E5E5E0] pb-2">
            PUBLIC DISCOURSE ({discourseItems.length})
          </div>

          <div className="space-y-6 divide-y divide-[#E5E5E0]">
            {discourseItems.length === 0 ? (
              <p className="text-xs text-[#6B6B6B] italic py-4">
                No discourse threads in this hub.
              </p>
            ) : (
              discourseItems.map((item, idx) => (
                <ArticleCard key={item.id || idx} item={item} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Article Item Renderer with SafeImage 80x80 Thumbnail
 */
function ArticleCard({ item }: { item: RawItem }) {
  const ytEmbedUrl = getYouTubeEmbedUrl(item.url);
  const isReddit = item.lane === 'discourse' || item.url?.includes('reddit.com');

  const imageUrl = item.og_image
    ? `/api/og-image?url=${encodeURIComponent(item.og_image)}`
    : null;

  // YouTube Video Embed (Full embed player)
  if (ytEmbedUrl) {
    return (
      <div className="pt-6 first:pt-0 space-y-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-[4px] bg-[#E5E5E0]">
          <iframe
            src={ytEmbedUrl}
            title={item.title ?? 'Video'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="text-[11px] font-mono uppercase text-[#6B6B6B]">
          {item.source_name || 'YouTube Video'} · {timeAgo(item.published_at)}
        </div>
        <h4 className="font-serif-title text-[15px] font-bold text-[#1A1A1A] leading-snug">
          {item.title ?? 'Untitled Video'}
        </h4>
      </div>
    );
  }

  // Reddit Thread Card
  if (isReddit) {
    return (
      <div className="pt-6 first:pt-0 space-y-2">
        <div className="text-[11px] font-mono uppercase text-[#6B6B6B]">
          {item.source_name || 'Reddit Discussion'} · {timeAgo(item.published_at)}
        </div>
        <h4 className="font-serif-title text-[15px] font-bold text-[#1A1A1A] leading-snug">
          {item.title ?? 'Untitled Thread'}
        </h4>
        {item.og_description && (
          <p className="text-[13px] text-[#6B6B6B] line-clamp-2 leading-relaxed">
            {item.og_description}
          </p>
        )}
        <div className="pt-1">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#C0392B] hover:underline font-medium"
          >
            Read at {item.source_name || 'Reddit'} →
          </a>
        </div>
      </div>
    );
  }

  // Standard Publisher Article Preview with 80x80 SafeImage Thumbnail
  return (
    <div className="pt-6 first:pt-0">
      <div className="flex gap-3 items-start">
        <div className="w-20 h-20 shrink-0 rounded overflow-hidden">
          <SafeImage
            src={imageUrl}
            alt={item.title ?? 'Article image'}
            className="w-20 h-20 object-cover rounded"
            fallbackText={item.source_name || 'News'}
          />
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="text-[11px] font-mono uppercase text-[#6B6B6B]">
            {item.source_name || 'Publisher'} · {timeAgo(item.published_at)}
          </div>

          <h4 className="font-serif-title text-[15px] font-bold text-[#1A1A1A] leading-snug">
            {item.title ?? 'Untitled Article'}
          </h4>

          {(item.og_description || item.raw_summary) && (
            <p className="text-[13px] text-[#6B6B6B] line-clamp-2 leading-relaxed">
              {item.og_description || item.raw_summary}
            </p>
          )}

          <div className="pt-0.5">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#C0392B] hover:underline font-medium"
            >
              Read at {item.source_name || 'Source'} →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
