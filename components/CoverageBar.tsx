'use client';

interface CoverageBarProps {
  mainstreamCount: number;
  grassrootsCount: number;
  discourseCount: number;
  showLegend?: boolean;
}

export default function CoverageBar({
  mainstreamCount,
  grassrootsCount,
  discourseCount,
  showLegend = true,
}: CoverageBarProps) {
  const total = mainstreamCount + grassrootsCount + discourseCount;

  if (total === 0) {
    return null;
  }

  const mainstreamPct = Math.round((mainstreamCount / total) * 100);
  const grassrootsPct = Math.round((grassrootsCount / total) * 100);
  const discoursePct = Math.round((discourseCount / total) * 100);

  return (
    <div className="space-y-1.5 w-full">
      {/* Proportional Split Bar */}
      <div className="w-full h-1 bg-[#E5E5E0] rounded-full overflow-hidden flex">
        {mainstreamCount > 0 && (
          <div
            style={{ width: `${mainstreamPct}%` }}
            className="bg-[#2563EB] h-full transition-all duration-300"
            title={`Mainstream: ${mainstreamCount} (${mainstreamPct}%)`}
          />
        )}
        {grassrootsCount > 0 && (
          <div
            style={{ width: `${grassrootsPct}%` }}
            className="bg-[#16A34A] h-full transition-all duration-300"
            title={`Grassroots: ${grassrootsCount} (${grassrootsPct}%)`}
          />
        )}
        {discourseCount > 0 && (
          <div
            style={{ width: `${discoursePct}%` }}
            className="bg-[#D97706] h-full transition-all duration-300"
            title={`Discourse: ${discourseCount} (${discoursePct}%)`}
          />
        )}
      </div>

      {/* Muted Legend Row */}
      {showLegend && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#6B6B6B] font-medium">
          {mainstreamCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] inline-block" />
              Mainstream {mainstreamCount}
            </span>
          )}
          {grassrootsCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block" />
              Grassroots {grassrootsCount}
            </span>
          )}
          {discourseCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] inline-block" />
              Discourse {discourseCount}
            </span>
          )}
          <span className="text-[#9CA3AF]">· {total} total sources</span>
        </div>
      )}
    </div>
  );
}
