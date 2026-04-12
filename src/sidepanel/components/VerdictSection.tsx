import React, { useState, useCallback } from 'react';
import type { Product } from '../../types/product';
import type { VerdictResult } from '../../types/comparison';
import { encodeComparisonUrl } from '../../utils/share-link';

interface Props {
  products: Product[];
}

type VerdictState = 'idle' | 'loading' | 'done' | 'error';

const ORANGE = '#e47911';

export function VerdictSection({ products }: Props) {
  const [state, setState] = useState<VerdictState>('idle');
  const [verdict, setVerdict] = useState<VerdictResult | null>(null);
  const [error, setError] = useState('');

  const requestVerdict = useCallback(() => {
    if (products.length < 2) return;
    setState('loading');
    setError('');

    chrome.runtime.sendMessage(
      { type: 'FETCH_VERDICT', products, requestId: crypto.randomUUID() },
      (res) => {
        if (res?.error) {
          setState('error');
          setError(res.error);
        } else if (res?.verdict) {
          setVerdict(res.verdict);
          setState('done');
        }
      }
    );
  }, [products]);

  const findProduct = (asin: string) => products.find((p) => p.asin === asin);

  if (products.length < 2) return null;

  return (
    <div style={{ borderBottom: '1px solid #e5e7eb', padding: '14px 16px', background: '#fafbfc' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>
          AI Verdict
        </span>
        {state !== 'loading' && (
          <button
            onClick={requestVerdict}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#fff',
              background: ORANGE,
              border: 'none',
              borderRadius: 5,
              padding: '5px 12px',
              cursor: 'pointer',
            }}
          >
            {state === 'done' ? 'Regenerate' : 'Generate Verdict'}
          </button>
        )}
      </div>

      {/* Loading state */}
      {state === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
          <Spinner />
          <span style={{ fontSize: 12, color: '#6b7280' }}>Analyzing products with Claude...</span>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', borderRadius: 6, padding: '8px 12px' }}>
          {error.includes('AI not available') ? (
            <>AI Verdict requires Chrome 131+ with the Gemini Nano model, or an Anthropic API key in Settings.</>
          ) : (
            <>Failed to generate verdict: {error}</>
          )}
        </div>
      )}

      {/* Verdict result */}
      {state === 'done' && verdict && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Summary */}
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, margin: 0 }}>
            {verdict.summary}
          </p>

          {/* Winner badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <WinnerBadge label="Best Value" asin={verdict.bestValue} product={findProduct(verdict.bestValue)} color="#059669" />
            <WinnerBadge label="Best Specs" asin={verdict.bestSpecs} product={findProduct(verdict.bestSpecs)} color="#2563eb" />
            <WinnerBadge label="Top Rated" asin={verdict.bestRated} product={findProduct(verdict.bestRated)} color="#d97706" />
          </div>

          {/* Share nudge */}
          <ShareNudge products={products} />
        </div>
      )}

      {/* Idle hint */}
      {state === 'idle' && (
        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
          Get an AI-powered comparison summary of your products.
        </p>
      )}
    </div>
  );
}

function WinnerBadge({ label, asin, product, color }: { label: string; asin: string; product?: Product; color: string }) {
  const name = product ? product.title.split(/[,\-–]/)[0].trim().slice(0, 30) : asin;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: `${color}10`,
      border: `1px solid ${color}30`,
      borderRadius: 6,
      padding: '4px 10px',
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
      </span>
      {product?.imageUrl && (
        <img src={product.imageUrl} alt="" style={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 3 }} />
      )}
      <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>
        {name}
      </span>
    </div>
  );
}

function ShareNudge({ products }: { products: Product[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const url = encodeComparisonUrl(products);
  const names = products.map((p) => p.title.split(/[,\-–]/)[0].trim().slice(0, 25)).join(' vs ');
  const text = `Check out this comparison: ${names}`;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
      background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0',
    }}>
      <span style={{ fontSize: 12, color: '#166534', flex: 1 }}>
        Found this useful? Share with a friend
      </span>
      <button
        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank')}
        title="WhatsApp"
        style={{ background: '#25D366', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
      </button>
      <button
        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')}
        title="Post on X"
        style={{ background: '#000', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: '0 2px', lineHeight: 1 }}
        title="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="8" cy="8" r="6" fill="none" stroke="#e5e7eb" strokeWidth="2" />
      <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
