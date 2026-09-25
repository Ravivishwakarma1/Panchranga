'use client';

import React from 'react';

export interface PanchrangaLoaderInlineProps {
  /** Controls loading state: true = wave loops; false = stops wave, wordmark fades in */
  loading?: boolean;
  /** Size preset ('sm' | 'md' | 'lg') or custom diameter in px (default 10px) */
  size?: 'sm' | 'md' | 'lg' | number;
  /** Custom wordmark text (default: 'panchranga') */
  wordmark?: string;
  /** Toggle wordmark visibility */
  showWordmark?: boolean;
  /** Force reduced motion simulation (opacity pulse instead of scale) */
  reducedMotion?: boolean;
  /** Accessible label */
  accessibilityLabel?: string;
  /** Container className */
  className?: string;
  /** Container styles */
  style?: React.CSSProperties;
}

const DOT_COLORS = [
  '#4A56E2', // indigo
  '#00B8A9', // teal
  '#F5A623', // amber
  '#E84393', // magenta
  '#FF6B6B', // coral
] as const;

/**
 * PanchrangaLoaderInline
 * 
 * Standalone single-file React component with embedded scoped CSS keyframes.
 * Zero external CSS dependencies — just import and use anywhere.
 */
export default function PanchrangaLoaderInline({
  loading = true,
  size = 'md',
  wordmark = 'panchranga',
  showWordmark = true,
  reducedMotion = false,
  accessibilityLabel = 'Loading panchranga...',
  className = '',
  style = {},
}: PanchrangaLoaderInlineProps) {
  // Generate a unique ID or use deterministic class prefix
  const dotSize =
    typeof size === 'number'
      ? Math.max(4, size)
      : size === 'sm'
      ? 6
      : size === 'lg'
      ? 16
      : 10;

  const dotGap =
    typeof size === 'number'
      ? Math.max(4, Math.round(size))
      : size === 'sm'
      ? 6
      : size === 'lg'
      ? 14
      : 10;

  const fontSize =
    typeof size === 'number'
      ? Math.max(9, Math.round(size * 1.5))
      : size === 'sm'
      ? 11
      : size === 'lg'
      ? 22
      : 15;

  const wordmarkGap =
    typeof size === 'number'
      ? Math.max(6, Math.round(size * 1.2))
      : size === 'sm'
      ? 8
      : size === 'lg'
      ? 16
      : 12;

  return (
    <div
      className={`panchranga-loader-root ${loading ? 'is-loading' : 'is-resolved'} ${reducedMotion ? 'is-reduced-motion' : ''} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy={loading}
      aria-label={accessibilityLabel}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
        ...style,
      }}
    >
      <style>{`
        @keyframes pncWave {
          0%, 100% { transform: scale(1); }
          20% { transform: scale(1.4); }
          40% { transform: scale(1); }
        }

        @keyframes pncPulse {
          0%, 100% { opacity: 0.4; }
          20% { opacity: 1; }
          40% { opacity: 0.4; }
        }

        @keyframes pncFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .panchranga-loader-root .pnc-dot {
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
          transform-origin: center center;
          will-change: transform, opacity;
          transform: scale(1);
          opacity: 1;
        }

        .panchranga-loader-root.is-loading .pnc-dot {
          animation-name: pncWave;
          animation-duration: 1.2s;
          animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
          animation-iteration-count: infinite;
        }

        .panchranga-loader-root.is-loading .pnc-dot:nth-child(1) { animation-delay: 0ms; }
        .panchranga-loader-root.is-loading .pnc-dot:nth-child(2) { animation-delay: 120ms; }
        .panchranga-loader-root.is-loading .pnc-dot:nth-child(3) { animation-delay: 240ms; }
        .panchranga-loader-root.is-loading .pnc-dot:nth-child(4) { animation-delay: 360ms; }
        .panchranga-loader-root.is-loading .pnc-dot:nth-child(5) { animation-delay: 480ms; }

        .panchranga-loader-root.is-resolved .pnc-dot {
          animation: none;
          transform: scale(1);
          opacity: 1;
          transition: transform 300ms ease-out, opacity 300ms ease-out;
        }

        .panchranga-loader-root .pnc-wordmark {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.015em;
          color: #1a1a2e;
          text-transform: lowercase;
          opacity: 0;
          pointer-events: none;
        }

        .panchranga-loader-root.is-loading .pnc-wordmark {
          opacity: 0;
          pointer-events: none;
        }

        .panchranga-loader-root.is-resolved .pnc-wordmark {
          opacity: 1;
          pointer-events: auto;
          animation: pncFadeIn 400ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
          animation-iteration-count: 1;
        }

        @media (prefers-reduced-motion: reduce) {
          .panchranga-loader-root .pnc-dot {
            transition: none !important;
          }
          .panchranga-loader-root.is-loading .pnc-dot {
            animation-name: pncPulse !important;
            transform: none !important;
          }
          .panchranga-loader-root.is-resolved .pnc-wordmark {
            animation-duration: 0.01ms !important;
            opacity: 1 !important;
          }
        }

        .panchranga-loader-root.is-reduced-motion .pnc-dot {
          transition: none !important;
        }
        .panchranga-loader-root.is-reduced-motion.is-loading .pnc-dot {
          animation-name: pncPulse !important;
          transform: none !important;
        }
        .panchranga-loader-root.is-reduced-motion.is-resolved .pnc-wordmark {
          animation-duration: 0.01ms !important;
          opacity: 1 !important;
        }
      `}</style>

      {/* Five circular dots */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `${dotGap}px`,
          padding: '4px',
        }}
      >
        {DOT_COLORS.map((color, index) => (
          <span
            key={index}
            className="pnc-dot"
            aria-hidden="true"
            style={{
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              backgroundColor: color,
            }}
          />
        ))}
      </div>

      {/* Wordmark below dots */}
      {showWordmark && (
        <span
          className="pnc-wordmark"
          aria-hidden="true"
          style={{
            marginTop: `${wordmarkGap}px`,
            fontSize: `${fontSize}px`,
          }}
        >
          {wordmark}
        </span>
      )}
    </div>
  );
}
