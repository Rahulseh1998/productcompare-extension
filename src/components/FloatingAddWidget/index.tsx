import React, { useEffect, useState, useRef } from 'react';
import type { Product } from '../../types/product';

interface Props {
  product: Product;
}

type AddState = 'idle' | 'loading' | 'added' | 'full';

const ORANGE = '#e47911';
const GREEN = '#067D62';
const GRAY = '#6b7280';

export function FloatingAddWidget({ product }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [addState, setAddState] = useState<AddState>('idle');
  const widgetRef = useRef<HTMLDivElement>(null);

  // Sync state with current compare list
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_COMPARE_LIST' }, (res) => {
      if (res?.products?.find((p: Product) => p.asin === product.asin)) {
        setAddState('added');
      }
    });

    const handleUpdate = (e: Event) => {
      const products = (e as CustomEvent).detail?.products as Product[];
      if (products?.find((p) => p.asin === product.asin)) {
        setAddState('added');
      } else if (addState === 'added') {
        setAddState('idle');
      }
    };

    window.addEventListener('pc:compare-list-updated', handleUpdate);
    return () => window.removeEventListener('pc:compare-list-updated', handleUpdate);
  }, [product.asin]);

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded]);

  const handleAdd = () => {
    if (addState === 'added' || addState === 'loading') return;
    setAddState('loading');

    chrome.runtime.sendMessage({ type: 'ADD_PRODUCT', product }, (res) => {
      if (res?.success) {
        setAddState('added');
      } else if (res?.reason === 'limit_reached') {
        setAddState('full');
        setTimeout(() => setAddState('idle'), 3000);
      } else {
        setAddState('idle');
      }
    });
  };

  const accentColor = addState === 'added' ? GREEN : addState === 'full' ? GRAY : ORANGE;

  return (
    <div
      ref={widgetRef}
      style={{
        position: 'fixed',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 2147483646,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        filter: 'drop-shadow(-2px 2px 8px rgba(0,0,0,0.18))',
      }}
    >
      {/* Expanded panel */}
      {expanded && (
        <div style={{
          background: '#fff',
          border: `2px solid ${accentColor}`,
          borderRight: 'none',
          borderRadius: '12px 0 0 12px',
          padding: '14px',
          width: '220px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          {/* Product preview */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt=""
                style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 6, flexShrink: 0, background: '#f9fafb' }}
              />
            )}
            <div style={{ overflow: 'hidden' }}>
              <p style={{
                fontSize: 11, color: '#111827', lineHeight: 1.3, fontWeight: 500,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                margin: 0,
              }}>
                {product.title}
              </p>
              {product.price !== null && (
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '4px 0 0' }}>
                  {product.priceFormatted}
                </p>
              )}
              {product.rating !== null && (
                <p style={{ fontSize: 11, color: '#d97706', margin: 0 }}>
                  ★ {product.rating.toFixed(1)}
                  {product.reviewCount ? ` (${product.reviewCount.toLocaleString()})` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={addState === 'added' || addState === 'loading'}
            style={{
              width: '100%',
              padding: '9px 0',
              background: accentColor,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: addState === 'idle' ? 'pointer' : 'default',
              transition: 'background 0.2s',
            }}
          >
            {addState === 'loading' ? 'Adding…'
              : addState === 'added' ? '✓ Added to Compare'
              : addState === 'full' ? 'List full — Upgrade for more'
              : '+ Add to Compare'}
          </button>

          {addState === 'added' && (
            <p style={{ fontSize: 11, color: '#6b7280', margin: 0, textAlign: 'center' }}>
              Open the compare bar below to compare →
            </p>
          )}
        </div>
      )}

      {/* Tab trigger — always visible on right edge */}
      <button
        onClick={() => setExpanded((v) => !v)}
        title="Compare this product"
        style={{
          background: accentColor,
          border: 'none',
          borderRadius: expanded ? '0 8px 8px 0' : '8px 0 0 8px',
          padding: '14px 6px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          transition: 'background 0.2s, border-radius 0.15s',
          minWidth: 36,
        }}
      >
        {/* Scale icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="2" x2="12" y2="22" />
          <path d="M5 6l7-4 7 4" />
          <path d="M5 6l-3 9a5 5 0 0 0 10 0L5 6z" />
          <path d="M19 6l3 9a5 5 0 0 1-10 0l7-9z" />
        </svg>
        {/* Rotated label */}
        <span style={{
          color: '#fff',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.05em',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}>
          {addState === 'added' ? 'ADDED ✓' : 'COMPARE'}
        </span>
      </button>
    </div>
  );
}
