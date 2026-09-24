export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Hero */}
      <div className="space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span>Mission & Editorial Principles</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          What is Panchranga?
        </h1>
        <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
          Panchranga is an open-source, independent news intelligence platform for Indian news. We bring together coverage from mainstream national media, grassroots independent reporters, and public discourse — side by side on one screen.
        </p>
        <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
          The name Panchranga means &apos;many colors&apos; — because every news story has more than one color to it. We believe you deserve to see them all.
        </p>
        <p className="text-gray-300 text-base sm:text-lg leading-relaxed font-medium">
          No editors. No paywalls. No bias labels. Just every color of the story.
        </p>
      </div>

      {/* The 3 Lanes */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">The Three-Lane Structure</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-5 border-l-4 border-l-blue-500">
            <h3 className="font-bold text-blue-400 mb-2">1. Mainstream</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              National English & Hindi daily newspapers and official press releases (e.g., Indian Express, Times of India, NDTV, PIB). Provides institutional and official framing.
            </p>
          </div>
          <div className="glass-card rounded-xl p-5 border-l-4 border-l-emerald-500">
            <h3 className="font-bold text-emerald-400 mb-2">2. Grassroots</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Independent outlets, investigative journalists, and ground reporters (e.g., The Wire, Scroll.in, The News Minute, PARI). Offers field reporting and regional depth.
            </p>
          </div>
          <div className="glass-card rounded-xl p-5 border-l-4 border-l-amber-500">
            <h3 className="font-bold text-amber-400 mb-2">3. Public Discourse</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Public discussions, online community threads, and citizen reactions from active subreddits (e.g., r/india, r/IndiaSpeaks, r/indiatech).
            </p>
          </div>
        </div>
      </div>

      {/* Editorial Disclaimer & Fact Checking */}
      <div className="glass-card rounded-xl p-6 border border-amber-500/20 bg-amber-500/5 space-y-4">
        <h3 className="font-bold text-amber-400 text-lg flex items-center space-x-2">
          <span>⚠️ Important Editorial Notice</span>
        </h3>
        <div className="text-xs text-gray-300 space-y-2 leading-relaxed">
          <p>
            <strong>Panchranga does not editorialize, fact-check, or adjudicate truth.</strong>
          </p>
          <p>
            All AI-generated summaries strictly summarize <em>what is being reported and by whom</em>. We encourage readers to verify claims against original sources and independent fact-checking organizations:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <a
            href="https://www.altnews.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors text-xs font-semibold text-gray-200 flex items-center justify-between"
          >
            <span>Alt News</span>
            <span className="text-blue-400">↗</span>
          </a>
          <a
            href="https://www.boomlive.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors text-xs font-semibold text-gray-200 flex items-center justify-between"
          >
            <span>BOOM Live</span>
            <span className="text-blue-400">↗</span>
          </a>
          <a
            href="https://newschecker.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors text-xs font-semibold text-gray-200 flex items-center justify-between"
          >
            <span>Newschecker</span>
            <span className="text-blue-400">↗</span>
          </a>
        </div>
      </div>

      {/* Tech Stack Info */}
      <div className="glass-card rounded-xl p-6 space-y-3">
        <h3 className="font-bold text-white text-base">Open Technical Stack</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Built using Next.js 14 (App Router), Supabase Postgres with <code>pgvector</code> extension, GitHub Actions cron jobs, and open-source embedding models (MiniLM-L6-v2). Designed for $0 infrastructure cost.
        </p>
      </div>
    </div>
  );
}
