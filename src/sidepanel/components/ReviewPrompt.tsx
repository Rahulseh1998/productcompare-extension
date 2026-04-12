import React, { useEffect, useState } from 'react';

const CWS_REVIEW_URL = 'https://chromewebstore.google.com'; // TODO: Replace with actual CWS review URL

const COMPARE_THRESHOLD = 3;

export function ReviewPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['stats.compareCount', 'stats.reviewDismissed'], (result) => {
      const count = result['stats.compareCount'] ?? 0;
      const dismissed = result['stats.reviewDismissed'] ?? false;
      if (count >= COMPARE_THRESHOLD && !dismissed) {
        setShow(true);
      }
    });
  }, []);

  const dismiss = () => {
    setShow(false);
    chrome.storage.local.set({ 'stats.reviewDismissed': true });
  };

  const openReview = () => {
    window.open(CWS_REVIEW_URL, '_blank');
    dismiss();
  };

  if (!show) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: '#fffbeb', borderBottom: '1px solid #fde68a',
    }}>
      <span style={{ fontSize: 18 }}>⭐</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#92400e', margin: 0 }}>
          Enjoying CompareCart?
        </p>
        <p style={{ fontSize: 11, color: '#a16207', margin: '2px 0 0' }}>
          A quick rating helps other shoppers find us
        </p>
      </div>
      <button
        onClick={openReview}
        style={{
          fontSize: 11, fontWeight: 700, color: '#fff', background: '#e47911',
          border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Rate Us
      </button>
      <button
        onClick={dismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: 16, lineHeight: 1, padding: 0 }}
      >
        ×
      </button>
    </div>
  );
}
