import React from 'react';

interface Props {
  /** What the user sees instead of the feature */
  featureName: string;
  isPro: boolean;
  children: React.ReactNode;
}

/**
 * Wraps a Pro-only feature. Shows the feature if Pro, or an upgrade prompt if Free.
 * The feature is rendered (not hidden) behind a blurred overlay so users can see what they're paying for.
 */
export function ProGate({ featureName, isPro, children }: Props) {
  if (isPro) return <>{children}</>;

  return (
    <div style={{ position: 'relative' }}>
      {/* Blurred preview of the feature */}
      <div style={{ filter: 'blur(3px)', opacity: 0.5, pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>

      {/* Upgrade overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.85)',
        borderRadius: 8,
        gap: 8,
        padding: 16,
      }}>
        <span style={{ fontSize: 20 }}>&#9889;</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
          {featureName} is a Pro feature
        </span>
        <a
          href="http://localhost:3000/pro"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#fff',
            background: '#7c3aed',
            padding: '6px 16px',
            borderRadius: 6,
            textDecoration: 'none',
          }}
        >
          Upgrade to Pro — $2.99/mo
        </a>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>
          Or enter a license key in Settings
        </span>
      </div>
    </div>
  );
}
