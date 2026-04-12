import React, { useState, useRef, useEffect } from 'react';
import type { Product } from '../../types/product';
import type { ComparedRow } from '../../types/comparison';
import { encodeComparisonUrl } from '../../utils/share-link';
import { exportToCsv } from '../../utils/export-csv';

interface Props {
  products: Product[];
  rows: ComparedRow[];
  isPro: boolean;
}

export function ExportToolbar({ products, rows, isPro }: Props) {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!showShare) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowShare(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showShare]);

  const getShareUrl = () => encodeComparisonUrl(products, rows);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    window.open(getShareUrl(), '_blank');
  };

  const productNames = products.map((p) => p.title.split(/[,\-–]/)[0].trim().slice(0, 25)).join(' vs ');
  const shareText = `Check out this comparison: ${productNames}`;

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + getShareUrl())}`, '_blank');
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getShareUrl())}`, '_blank');
  };

  const handleEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent('Product Comparison — ' + productNames)}&body=${encodeURIComponent(shareText + '\n\n' + getShareUrl())}`, '_blank');
  };

  const handleExportImage = async () => {
    if (!isPro) return;
    setExporting(true);
    try {
      const tableEl = document.querySelector('[data-testid="comparison-table"]') as HTMLElement;
      if (!tableEl) return;

      const { default: html2canvas } = await import('html2canvas');
      const scale = 2;
      const canvas = await html2canvas(tableEl, {
        backgroundColor: '#ffffff',
        scale,
        useCORS: true,
        allowTaint: true,
      });

      const stripHeight = 48 * scale;
      const newCanvas = document.createElement('canvas');
      newCanvas.width = canvas.width;
      newCanvas.height = canvas.height + stripHeight;
      const newCtx = newCanvas.getContext('2d')!;
      newCtx.drawImage(canvas, 0, 0);
      newCtx.fillStyle = '#f3f4f6';
      newCtx.fillRect(0, canvas.height, newCanvas.width, stripHeight);
      newCtx.fillStyle = '#9ca3af';
      newCtx.font = `${14 * scale}px system-ui, -apple-system, sans-serif`;
      newCtx.textAlign = 'center';
      newCtx.textBaseline = 'middle';
      newCtx.fillText(
        'Compared with CompareCart for Amazon  —  comparecart.app',
        newCanvas.width / 2,
        canvas.height + stripHeight / 2
      );

      const link = document.createElement('a');
      link.download = `comparison_${products.map((p) => p.asin).join('_vs_')}.png`;
      link.href = newCanvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('[PC] Image export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', position: 'relative' }}>
      {/* Share button */}
      <button
        onClick={() => setShowShare((v) => !v)}
        style={{
          fontSize: 11, fontWeight: 600, padding: '3px 10px',
          background: showShare ? '#f3f4f6' : '#fff',
          color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer',
        }}
      >
        Share
      </button>

      {/* Share popover */}
      {showShare && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6,
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 14,
            width: 240, zIndex: 50,
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>
            Share this comparison
          </p>

          {/* Quick share buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <ShareIcon label="WhatsApp" color="#25D366" onClick={handleWhatsApp}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
            </ShareIcon>
            <ShareIcon label="X" color="#000" onClick={handleTwitter}>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </ShareIcon>
            <ShareIcon label="Email" color="#6b7280" onClick={handleEmail}>
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </ShareIcon>
            <ShareIcon label="Open" color="#e47911" onClick={handleOpen}>
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </ShareIcon>
          </div>

          {/* Copy link */}
          <button
            onClick={handleCopy}
            style={{
              width: '100%', padding: '7px 0', fontSize: 11, fontWeight: 600,
              background: copied ? '#d1fae5' : '#f3f4f6',
              color: copied ? '#065f46' : '#374151',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {copied ? '✓ Link Copied!' : 'Copy Link'}
          </button>
        </div>
      )}

      {/* CSV */}
      <button
        onClick={() => exportToCsv(products, rows)}
        style={{ fontSize: 11, fontWeight: 500, color: '#374151', background: '#fff', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', padding: '3px 8px' }}
      >
        CSV
      </button>

      {/* Image — PRO */}
      <button
        onClick={handleExportImage}
        disabled={!isPro || exporting}
        title={isPro ? 'Export as image' : 'Pro feature — upgrade to export images'}
        style={{
          fontSize: 11, fontWeight: 500, padding: '3px 8px',
          background: isPro ? '#fff' : '#f3f4f6',
          color: isPro ? '#374151' : '#9ca3af',
          border: '1px solid #d1d5db', borderRadius: 4,
          cursor: isPro ? 'pointer' : 'not-allowed',
        }}
      >
        {exporting ? '...' : isPro ? 'Image' : 'Image ★'}
      </button>
    </div>
  );
}

function ShareIcon({ label, color, onClick, children }: { label: string; color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}12`, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = `${color}22`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = `${color}12`)}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        {children}
      </svg>
    </button>
  );
}
