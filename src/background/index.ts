import type { ExtensionMessage } from '../types/messages';
import { routeMessage } from './message-router';

function isAmazonUrl(url?: string): boolean {
  if (!url) return false;
  return /https?:\/\/.*\.amazon\.(com|co\.uk|de|co\.jp|ca|fr)/.test(url);
}

// ── Message routing ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (msg: ExtensionMessage, sender, sendResponse) => {
    routeMessage(msg, sender, sendResponse);
    return true; // keep channel open for async response
  }
);

// ── Side panel: open when clicking extension icon on Amazon tabs ──────────────

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id && isAmazonUrl(tab.url)) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

// ── Selector override: fetch CDN hotfix JSON on startup ──────────────────────
// Allows fixing broken container selectors without CWS re-review

const SELECTOR_OVERRIDE_URL = 'https://raw.githubusercontent.com/Rahulseh1998/productcompare-extension/main/selector-overrides.json';
const OVERRIDE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchSelectorOverrides(): Promise<void> {
  try {
    const stored = await chrome.storage.local.get(['selector.overrides.fetchedAt']);
    const fetchedAt = stored['selector.overrides.fetchedAt'] ?? 0;
    if (Date.now() - fetchedAt < OVERRIDE_TTL_MS) return;

    const response = await fetch(SELECTOR_OVERRIDE_URL, { cache: 'no-cache' });
    if (!response.ok) return;

    const overrides = await response.json();
    await chrome.storage.local.set({
      'selector.overrides': overrides,
      'selector.overrides.fetchedAt': Date.now(),
    });
  } catch {
    // Non-fatal — hardcoded selectors remain active
  }
}

fetchSelectorOverrides();
