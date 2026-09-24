import { STARTER_SOURCES } from '@/lib/constants';

export default function SourcesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <span>Source Transparency & Index</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Ingested News Directory
        </h1>
        <p className="text-gray-400 text-sm max-w-2xl">
          Panchranga is built on total editorial transparency. Below is the active index of all RSS, YouTube, and Reddit feeds ingested by our pipeline, categorized by reporting lane.
        </p>
      </div>

      {/* Sources Table Card */}
      <div className="glass-card rounded-xl overflow-hidden border border-gray-800">
        <div className="p-4 bg-gray-900/60 border-b border-gray-800 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Active Feeds Registry ({STARTER_SOURCES.length})
          </span>
          <span className="text-[11px] text-emerald-400 font-mono flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>100% Free Public Pipes</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-950/80 text-gray-400 uppercase text-[10px] font-mono border-b border-gray-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Source Outlet</th>
                <th className="py-3.5 px-4 font-semibold">Lane</th>
                <th className="py-3.5 px-4 font-semibold">Type</th>
                <th className="py-3.5 px-4 font-semibold">Language</th>
                <th className="py-3.5 px-4 font-semibold">Region Scope</th>
                <th className="py-3.5 px-4 font-semibold text-right">Feed Endpoint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {STARTER_SOURCES.map((source, idx) => {
                const laneBadge =
                  source.lane === 'mainstream'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : source.lane === 'grassroots'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30';

                return (
                  <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                      <span>{source.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${laneBadge} capitalize`}>
                        {source.lane}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-400 uppercase text-[10px]">
                      {source.type}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-300 uppercase">
                      {source.language}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 capitalize">
                      {source.region || 'national'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[10px]">
                      <a
                        href={source.feed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline truncate max-w-xs inline-block"
                      >
                        {source.feed_url}
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
