'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import PanchrangaLoader from './PanchrangaLoader';

/**
 * SiteLoader Component
 *
 * Provides site-wide loading experience:
 * 1. Initial Page Load Reveal:
 *    On initial load, displays the Panchranga 5-dot scale wave.
 *    Once the page is ready, transitions loading to false to trigger
 *    the wordmark fade-in (400ms ease), then gracefully dissolves the overlay.
 * 
 * 2. Route Transition Indicator:
 *    When navigating between pages (e.g., clicking hubs, about, sources),
 *    displays a sleek branded loader to give immediate visual feedback.
 */
export default function SiteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initial site load animation state
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialResolved, setInitialResolved] = useState(false);
  const [showInitialOverlay, setShowInitialOverlay] = useState(true);

  // Route transition state
  const [routeTransitioning, setRouteTransitioning] = useState(false);

  // Initial mount load sequence
  useEffect(() => {
    // 1. Let the wave animate for 750ms while page assets hydrate
    const resolveTimer = setTimeout(() => {
      setInitialResolved(true); // Triggers loading={false} -> wordmark fades in once
    }, 750);

    // 2. Allow 500ms to enjoy the resolved brand wordmark fade-in, then fade out overlay
    const fadeOutTimer = setTimeout(() => {
      setInitialLoading(false);
    }, 1300);

    // 3. Remove overlay from DOM entirely
    const cleanupTimer = setTimeout(() => {
      setShowInitialOverlay(false);
    }, 1750);

    return () => {
      clearTimeout(resolveTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(cleanupTimer);
    };
  }, []);

  // Track route changes
  useEffect(() => {
    // Briefly display the route transition indicator when route or search changes
    setRouteTransitioning(true);
    const timer = setTimeout(() => {
      setRouteTransitioning(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return (
    <>
      {/* 1. Initial Site Load Overlay */}
      {showInitialOverlay && (
        <div
          id="panchranga-site-loader"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAFAF8] transition-opacity duration-400 ease-out"
          style={{
            opacity: initialLoading ? 1 : 0,
            pointerEvents: initialLoading ? 'auto' : 'none',
          }}
          aria-live="polite"
          aria-label="Loading Panchranga"
        >
          <div className="flex flex-col items-center justify-center p-6 text-center transform transition-transform duration-300">
            <PanchrangaLoader
              loading={!initialResolved}
              size="lg"
              renderMode="dom"
              accessibilityLabel="Loading Panchranga website..."
            />
          </div>
        </div>
      )}

      {/* 2. Route Transition Floating Indicator (Top-Center) */}
      {routeTransitioning && !showInitialOverlay && (
        <div
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[999] px-4 py-2 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-[#E5E5E0] flex items-center gap-3 animate-fade-in transition-all"
          role="status"
          aria-label="Updating page..."
        >
          <PanchrangaLoader
            loading={true}
            size="sm"
            showWordmark={false}
            accessibilityLabel="Loading..."
          />
          <span className="text-[11px] font-semibold text-[#1a1a2e] uppercase tracking-wider font-mono">
            Loading...
          </span>
        </div>
      )}
    </>
  );
}
