'use client';

import React, { useState, useEffect } from 'react';
import PanchrangaLoader, { PANCHRANGA_COLORS } from '@/components/PanchrangaLoader';
import PanchrangaLoaderInline from '@/components/PanchrangaLoaderInline';

export default function LoaderDemoPage() {
  const [loading, setLoading] = useState(true);
  const [renderMode, setRenderMode] = useState<'dom' | 'svg'>('dom');
  const [sizePreset, setSizePreset] = useState<'sm' | 'md' | 'lg'>('md');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showWordmark, setShowWordmark] = useState(true);
  const [fullscreenDemo, setFullscreenDemo] = useState(false);
  const [copiedTab, setCopiedTab] = useState<'react-module' | 'react-inline' | 'html-css' | null>(null);

  // Auto-cycle demo mode (optional button)
  const [isSimulatingCycle, setIsSimulatingCycle] = useState(false);
  useEffect(() => {
    if (!isSimulatingCycle) return;
    const timer = setTimeout(() => {
      setLoading(false);
      const resetTimer = setTimeout(() => {
        setLoading(true);
      }, 3000);
      return () => clearTimeout(resetTimer);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isSimulatingCycle, loading]);

  const copyCode = (type: 'react-module' | 'react-inline' | 'html-css', code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTab(type);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] py-12 px-4 sm:px-8">
      {/* Fullscreen Overlay Demo Modal */}
      {fullscreenDemo && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-6">
            <PanchrangaLoader
              loading={loading}
              renderMode={renderMode}
              size="lg"
              reducedMotion={reducedMotion}
              showWordmark={showWordmark}
            />
            <div className="pt-4 flex flex-col items-center gap-3">
              <div className="text-sm font-medium text-gray-500">
                Current state: {loading ? 'Loading wave active...' : 'Loading complete — wordmark revealed!'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLoading(!loading)}
                  className="px-4 py-2 bg-[#1a1a2e] text-white rounded-lg text-sm font-medium hover:bg-[#2e2e50] transition-colors"
                >
                  {loading ? 'Simulate Complete (Fade In Wordmark)' : 'Restart Loading Wave'}
                </button>
                <button
                  onClick={() => setFullscreenDemo(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                >
                  Exit Fullscreen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="border-b border-[#E5E5E0] pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#4A56E2] uppercase tracking-wider">
              Brand Component Spec
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1a2e] mt-1">
              Panchranga Loading Animation
            </h1>
            <p className="text-sm text-gray-600 mt-2 max-w-2xl">
              Lightweight CSS/SVG wave animation spinner with staggered dot scaling, 
              single-play wordmark fade-in on resolution, and automatic reduced-motion accessibility.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/panchranga-loader.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5E0] rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              Plain HTML Demo ↗
            </a>
            <button
              onClick={() => {
                setLoading(true);
                setFullscreenDemo(true);
              }}
              className="px-3.5 py-1.5 bg-[#1a1a2e] text-white rounded-md text-xs font-semibold hover:bg-[#2e2e50] transition-colors shadow-sm"
            >
              Fullscreen Preview
            </button>
          </div>
        </div>

        {/* Color Palette Spec Banner */}
        <div className="bg-white rounded-xl border border-[#E5E5E0] p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Brand Palette & Wave Sequence (Left-to-Right, ~120ms Stagger)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {PANCHRANGA_COLORS.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#FAFAF8] border border-[#EBEBE6]">
                <div
                  className="w-5 h-5 rounded-full shrink-0 shadow-inner"
                  style={{ backgroundColor: c.hex }}
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-800 capitalize leading-tight">
                    {i + 1}. {c.name}
                  </div>
                  <div className="text-[11px] font-mono text-gray-500">{c.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Interactive Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Live Preview Box */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E5E0] p-8 shadow-sm flex flex-col items-center justify-center min-h-[380px] relative">
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <span className="text-xs font-mono text-gray-500">
                loading = {loading ? 'true (wave loops)' : 'false (resolved)'}
              </span>
            </div>

            <div className="absolute top-4 right-4 text-xs font-mono text-gray-400">
              Mode: {renderMode.toUpperCase()} | Motion: {reducedMotion ? 'Reduced' : 'Standard'}
            </div>

            {/* The Loader Component Being Tested */}
            <div className="my-auto py-12 flex flex-col items-center justify-center">
              <PanchrangaLoader
                loading={loading}
                renderMode={renderMode}
                size={sizePreset}
                reducedMotion={reducedMotion}
                showWordmark={showWordmark}
              />
            </div>

            {/* Live Status Description */}
            <div className="w-full pt-4 border-t border-[#F0F0EC] flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
              <span>
                {loading ? (
                  reducedMotion ? (
                    '⚡ Wave active: Opacity pulse (0.4 ↔ 1.0) at 120ms stagger'
                  ) : (
                    '🌊 Wave active: Scale (1.0 ↔ 1.4) staggered at ~120ms intervals'
                  )
                ) : (
                  '✨ Loading complete: Wordmark smoothly faded in (~400ms ease, plays once)'
                )}
              </span>
              <button
                onClick={() => setLoading(!loading)}
                className="font-semibold text-[#4A56E2] hover:underline"
              >
                {loading ? 'Trigger Finish →' : '← Trigger Loading'}
              </button>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E5E0] p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
              Interactive Test Controls
            </h2>

            {/* Loading Prop Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 block">
                Loading State (`loading` prop)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLoading(true)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    loading
                      ? 'bg-[#1a1a2e] text-white border-[#1a1a2e] shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  `loading={true}` (Loop)
                </button>
                <button
                  type="button"
                  onClick={() => setLoading(false)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    !loading
                      ? 'bg-[#1a1a2e] text-white border-[#1a1a2e] shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  `loading={false}` (Fade in)
                </button>
              </div>
            </div>

            {/* Render Mode (DOM vs SVG) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 block">
                Render Technology (`renderMode` prop)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRenderMode('dom')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    renderMode === 'dom'
                      ? 'bg-[#4A56E2] text-white border-[#4A56E2]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  HTML / DOM Mode
                </button>
                <button
                  type="button"
                  onClick={() => setRenderMode('svg')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    renderMode === 'svg'
                      ? 'bg-[#4A56E2] text-white border-[#4A56E2]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  SVG Vector Mode
                </button>
              </div>
            </div>

            {/* Sizing Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 block">
                Size Presets (`size` prop)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['sm', 'md', 'lg'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSizePreset(s)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all ${
                      sizePreset === s
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {s === 'sm' ? 'Small (6px)' : s === 'md' ? 'Default (10px)' : 'Large (16px)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessibility & Features Toggles */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <label className="flex items-center justify-between text-xs font-medium text-gray-700 cursor-pointer">
                <span>Simulate `prefers-reduced-motion`</span>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="rounded text-[#4A56E2] focus:ring-[#4A56E2] h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium text-gray-700 cursor-pointer">
                <span>Display wordmark below dots</span>
                <input
                  type="checkbox"
                  checked={showWordmark}
                  onChange={(e) => setShowWordmark(e.target.checked)}
                  className="rounded text-[#4A56E2] focus:ring-[#4A56E2] h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium text-gray-700 cursor-pointer">
                <span>Auto-simulate cycle (loads then finishes)</span>
                <input
                  type="checkbox"
                  checked={isSimulatingCycle}
                  onChange={(e) => setIsSimulatingCycle(e.target.checked)}
                  className="rounded text-[#4A56E2] focus:ring-[#4A56E2] h-4 w-4"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Side-by-Side State Comparison */}
        <div className="bg-white rounded-2xl border border-[#E5E5E0] p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
            Side-by-Side State Comparison
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-[#FAFAF8] space-y-4 min-h-[180px]">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                1. Actively Loading (Wave Looping)
              </div>
              <PanchrangaLoader loading={true} size="md" />
              <div className="text-[11px] text-gray-400 text-center">
                Continuous wave scale 1.0 ↔ 1.4 · Stagger 120ms · Wordmark opacity: 0
              </div>
            </div>

            <div className="border border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-[#FAFAF8] space-y-4 min-h-[180px]">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                2. Loading Resolved (Faded In Once)
              </div>
              <PanchrangaLoader loading={false} size="md" />
              <div className="text-[11px] text-gray-400 text-center">
                Wave settled at 1.0 · Wordmark faded in over ~400ms ease
              </div>
            </div>
          </div>
        </div>

        {/* Integration Code Snippets */}
        <div className="bg-white rounded-2xl border border-[#E5E5E0] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
              Code & Integration
            </h2>
            <div className="text-xs text-gray-400">Pure CSS Keyframes — Zero JS Animation Libraries</div>
          </div>

          <div className="space-y-4">
            {/* React Usage */}
            <div className="bg-[#1a1a2e] text-white rounded-xl p-4 font-mono text-xs overflow-x-auto relative">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-gray-700 text-gray-400">
                <span>components/PanchrangaLoader.tsx</span>
                <button
                  onClick={() =>
                    copyCode(
                      'react-module',
                      `import PanchrangaLoader from '@/components/PanchrangaLoader';\n\n// Basic usage\n<PanchrangaLoader loading={isLoading} />\n\n// Options: renderMode="dom"|"svg", size="sm"|"md"|"lg"|number\n<PanchrangaLoader loading={isLoading} size="lg" renderMode="svg" />`
                    )
                  }
                  className="text-xs text-[#00B8A9] hover:underline"
                >
                  {copiedTab === 'react-module' ? '✓ Copied' : 'Copy React Code'}
                </button>
              </div>
              <pre className="text-gray-200">
{`import PanchrangaLoader from '@/components/PanchrangaLoader';

// Inside your page or route loader:
export default function MyPage() {
  const [loading, setLoading] = useState(true);

  return (
    <div>
      <PanchrangaLoader loading={loading} />
    </div>
  );
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
