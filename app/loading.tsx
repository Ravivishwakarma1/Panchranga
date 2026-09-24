export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse max-w-7xl mx-auto">
      {/* Hero Skeleton */}
      <div className="glass-card rounded-2xl p-8 border border-gray-800 space-y-4">
        <div className="w-48 h-6 bg-gray-800/80 rounded-full"></div>
        <div className="w-3/4 h-10 bg-gray-800/80 rounded-lg"></div>
        <div className="w-1/2 h-5 bg-gray-800/60 rounded"></div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-800/80 pt-6 mt-6">
          <div className="w-24 h-12 bg-gray-800/60 rounded"></div>
          <div className="w-24 h-12 bg-gray-800/60 rounded"></div>
          <div className="w-24 h-12 bg-gray-800/60 rounded"></div>
          <div className="w-24 h-12 bg-gray-800/60 rounded"></div>
        </div>
      </div>

      {/* Cards Stream Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="glass-card rounded-xl p-6 space-y-4 border border-gray-800">
            <div className="flex justify-between items-center">
              <div className="w-1/3 h-6 bg-gray-800/80 rounded"></div>
              <div className="w-24 h-6 bg-gray-800/60 rounded-full"></div>
            </div>
            <div className="w-full h-12 bg-gray-800/40 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="h-20 bg-gray-900/60 rounded border border-gray-800"></div>
              <div className="h-20 bg-gray-900/60 rounded border border-gray-800"></div>
              <div className="h-20 bg-gray-900/60 rounded border border-gray-800"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
