'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-3xl font-bold">
        ⚠️
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold text-white tracking-tight">System Encountered an Issue</h2>
        <p className="text-xs text-gray-400">
          The aggregation pipeline or page renderer ran into a temporary hiccup.
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-blue-500/20"
        >
          Try Reloading Page
        </button>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white font-semibold text-xs transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
