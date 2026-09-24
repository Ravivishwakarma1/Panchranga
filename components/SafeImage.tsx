'use client';

import { useState } from 'react';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackText?: string;
}

export default function SafeImage({
  src,
  alt,
  className,
  style,
  fallbackText,
}: SafeImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={className}
        style={{
          ...style,
          backgroundColor: '#E8E4DF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6B6B6B',
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 500,
          padding: '8px',
          textAlign: 'center',
        }}
      >
        {fallbackText || alt || 'No image'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}
