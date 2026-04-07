import React from 'react';
import type { Product } from '../../types/product';

interface Props {
  products: Product[];
  onRemove: (asin: string) => void;
}

export function ComparisonHeader({ products, onRemove }: Props) {
  return (
    <thead>
      <tr>
        {/* Sticky label column */}
        <th style={{
          background: '#f3f4f6',
          borderRight: '1px solid #e5e7eb',
          borderBottom: '2px solid #e5e7eb',
          padding: '12px',
          position: 'sticky',
          left: 0,
          top: 0,
          zIndex: 10,
          minWidth: '120px',
          fontSize: '11px',
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Attribute
        </th>

        {products.map((p) => (
          <th key={p.asin} style={{
            background: '#fff',
            borderRight: '1px solid #e5e7eb',
            borderBottom: '2px solid #e47911',
            padding: '12px 8px',
            position: 'sticky',
            top: 0,
            zIndex: 5,
            minWidth: '160px',
            verticalAlign: 'top',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              {/* Remove button */}
              <button
                onClick={() => onRemove(p.asin)}
                style={{ alignSelf: 'flex-end', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px', lineHeight: 1, padding: 0 }}
                title={`Remove ${p.title}`}
              >
                ×
              </button>

              {/* Product image */}
              {p.imageUrl && (
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  style={{ width: 70, height: 70, objectFit: 'contain', borderRadius: '6px' }}
                />
              )}

              {/* Product title */}
              <a
                href={p.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '11px', color: '#1a56db', textDecoration: 'none', textAlign: 'center', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {p.title}
              </a>

              {/* Price */}
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                {p.priceFormatted}
              </span>

              {/* Rating + Prime */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {p.rating && (
                  <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>
                    ★ {p.rating.toFixed(1)}
                  </span>
                )}
                {p.isPrime && (
                  <span style={{ fontSize: '10px', background: '#00A8E0', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                    prime
                  </span>
                )}
              </div>
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}
