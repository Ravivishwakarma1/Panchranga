'use client';

import React from 'react';
import styles from './PanchrangaLoader.module.css';

export interface PanchrangaLoaderProps {
  /**
   * Controls whether the dot wave loops or the wordmark has already resolved and faded in.
   * - `true`: Dots continuously loop through the wave animation. Wordmark is hidden (opacity: 0).
   * - `false`: Dots wave stops and settles. Wordmark fades in (0 to 1, ~400ms ease) once.
   * @default true
   */
  loading?: boolean;

  /**
   * Controls the rendering technology:
   * - `'dom'` (default): Clean HTML `<div>` and `<span>` elements with GPU-accelerated CSS transforms.
   * - `'svg'`: Vector `<svg>` element with animated `<circle>` and `<text>` elements.
   * @default 'dom'
   */
  renderMode?: 'dom' | 'svg';

  /**
   * Size preset ('sm' | 'md' | 'lg') or numeric dot diameter in pixels.
   * Spec default is 10px diameter ('md').
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | number;

  /**
   * Wordmark text to display below the dots.
   * Formatted in bold, dark navy (#1a1a2e), lowercase, sans-serif.
   * @default 'panchranga'
   */
  wordmark?: string;

  /**
   * Whether to display the wordmark below the dots.
   * If false, only the 5 circular dots are rendered.
   * @default true
   */
  showWordmark?: boolean;

  /**
   * Explicitly enforce reduced motion mode (replaces scaling with opacity pulse).
   * Note: The component automatically respects system `prefers-reduced-motion` media query.
   * @default false
   */
  reducedMotion?: boolean;

  /**
   * Screen reader accessibility label.
   * @default 'Loading panchranga...'
   */
  accessibilityLabel?: string;

  /**
   * Additional CSS class name for the wrapper.
   */
  className?: string;

  /**
   * Additional inline styles for the wrapper.
   */
  style?: React.CSSProperties;
}

// Brand dot colors in exact specified order
export const PANCHRANGA_COLORS = [
  { name: 'indigo', hex: '#4A56E2', class: styles.dot1 },
  { name: 'teal', hex: '#00B8A9', class: styles.dot2 },
  { name: 'amber', hex: '#F5A623', class: styles.dot3 },
  { name: 'magenta', hex: '#E84393', class: styles.dot4 },
  { name: 'coral', hex: '#FF6B6B', class: styles.dot5 },
] as const;

/**
 * PanchrangaLoader Component
 *
 * Lightweight, zero-dependency loading animation for Panchranga brand.
 * 
 * Features:
 * - 5 circular dots in a horizontal row, evenly spaced (10px diameter default)
 * - Exact brand palette: #4A56E2 (indigo), #00B8A9 (teal), #F5A623 (amber), #E84393 (magenta), #FF6B6B (coral)
 * - Wordmark "panchranga" in bold dark navy (#1a1a2e), lowercase, sans-serif
 * - Left-to-right scale wave (1.0 -> 1.4 -> 1.0) with ~120ms stagger
 * - Wordmark fades in (0 -> 1 over 400ms ease) once upon loading completion (no looping)
 * - Automatic `prefers-reduced-motion` support (smooth opacity pulse 0.4 <-> 1.0)
 * - Pure CSS keyframes only (no external animation libraries)
 */
export default function PanchrangaLoader({
  loading = true,
  renderMode = 'dom',
  size = 'md',
  wordmark = 'panchranga',
  showWordmark = true,
  reducedMotion = false,
  accessibilityLabel = 'Loading panchranga...',
  className = '',
  style = {},
}: PanchrangaLoaderProps) {
  // Compute sizing dimensions based on prop
  const dimensions = React.useMemo(() => {
    let dotSize = 10;
    let dotGap = 10;
    let fontSize = 15;
    let wordmarkGap = 12;

    if (typeof size === 'number') {
      dotSize = Math.max(4, size);
      dotGap = Math.max(4, Math.round(size));
      fontSize = Math.max(9, Math.round(size * 1.5));
      wordmarkGap = Math.max(6, Math.round(size * 1.2));
    } else if (size === 'sm') {
      dotSize = 6;
      dotGap = 6;
      fontSize = 11;
      wordmarkGap = 8;
    } else if (size === 'lg') {
      dotSize = 16;
      dotGap = 14;
      fontSize = 22;
      wordmarkGap = 16;
    }

    return { dotSize, dotGap, fontSize, wordmarkGap };
  }, [size]);

  // CSS custom variables passed to styled container
  const cssVariables = {
    '--panchranga-dot-size': `${dimensions.dotSize}px`,
    '--panchranga-dot-gap': `${dimensions.dotGap}px`,
    '--panchranga-font-size': `${dimensions.fontSize}px`,
    '--panchranga-wordmark-gap': `${dimensions.wordmarkGap}px`,
    ...style,
  } as React.CSSProperties;

  // Render SVG variant
  if (renderMode === 'svg') {
    const { dotSize, dotGap, fontSize, wordmarkGap } = dimensions;
    const radius = dotSize / 2;
    const paddingX = Math.ceil(dotSize * 0.4) + 4; // Buffer for 1.4x scale without clipping
    const paddingY = Math.ceil(dotSize * 0.4) + 4;

    const spacing = dotSize + dotGap;
    const cy = paddingY + radius;
    const dotCoords = [
      paddingX + radius + 0 * spacing,
      paddingX + radius + 1 * spacing,
      paddingX + radius + 2 * spacing,
      paddingX + radius + 3 * spacing,
      paddingX + radius + 4 * spacing,
    ];

    const totalWidth = dotCoords[4] + radius + paddingX;
    const totalHeight = showWordmark
      ? paddingY + dotSize + wordmarkGap + fontSize + 4
      : paddingY * 2 + dotSize;

    const textX = totalWidth / 2;
    const textY = paddingY + dotSize + wordmarkGap + fontSize * 0.85;

    return (
      <svg
        className={`
          ${styles.svgContainer}
          ${loading ? styles.loading : styles.resolved}
          ${reducedMotion ? styles.reducedMotion : ''}
          ${className}
        `.trim()}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        width={totalWidth}
        height={totalHeight}
        role="status"
        aria-live="polite"
        aria-busy={loading}
        aria-label={accessibilityLabel}
        style={cssVariables}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Five circular dots */}
        <g className={styles.dotsRow}>
          {PANCHRANGA_COLORS.map((item, index) => (
            <circle
              key={item.name}
              cx={dotCoords[index]}
              cy={cy}
              r={radius}
              className={`${styles.dot} ${item.class}`}
            />
          ))}
        </g>

        {/* Wordmark */}
        {showWordmark && (
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            className={`
              ${styles.wordmark}
              ${loading ? styles.wordmarkLoading : styles.wordmarkResolved}
            `.trim()}
          >
            {wordmark}
          </text>
        )}
      </svg>
    );
  }

  // Render DOM (HTML/CSS) variant (default)
  return (
    <div
      className={`
        ${styles.container}
        ${loading ? styles.loading : styles.resolved}
        ${reducedMotion ? styles.reducedMotion : ''}
        ${className}
      `.trim()}
      role="status"
      aria-live="polite"
      aria-busy={loading}
      aria-label={accessibilityLabel}
      style={cssVariables}
    >
      {/* Five circular dots in a horizontal row, evenly spaced */}
      <div className={styles.dotsRow}>
        {PANCHRANGA_COLORS.map((item) => (
          <span
            key={item.name}
            className={`${styles.dot} ${item.class}`}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Wordmark "panchranga" in bold, dark navy (#1a1a2e), lowercase, sans-serif */}
      {showWordmark && (
        <span
          className={`
            ${styles.wordmark}
            ${loading ? styles.wordmarkLoading : styles.wordmarkResolved}
          `.trim()}
          aria-hidden="true"
        >
          {wordmark}
        </span>
      )}
    </div>
  );
}
