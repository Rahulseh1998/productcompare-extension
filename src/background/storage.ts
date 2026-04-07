import type { Product } from '../types/product';
import type { LicenseRecord, UserSettings } from '../types/storage';
import { DEFAULT_LICENSE, DEFAULT_SETTINGS } from '../types/storage';

// ── Active comparison (session storage — clears on browser close) ─────────────

export async function getActiveProducts(): Promise<Product[]> {
  const result = await chrome.storage.session.get('compare.active');
  return result['compare.active']?.products ?? [];
}

export async function setActiveProducts(products: Product[]): Promise<void> {
  await chrome.storage.session.set({
    'compare.active': { products, updatedAt: Date.now() },
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  const result = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...result['settings'] };
}

export async function updateSettings(partial: Partial<UserSettings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({ settings: { ...current, ...partial } });
}

// ── License ───────────────────────────────────────────────────────────────────

export async function getLicense(): Promise<LicenseRecord> {
  const result = await chrome.storage.local.get('license');
  return { ...DEFAULT_LICENSE, ...result['license'] };
}

export async function setLicense(license: LicenseRecord): Promise<void> {
  await chrome.storage.local.set({ license });
}

// ── Broadcast to all extension contexts ──────────────────────────────────────

export async function broadcastToAllTabs(message: object): Promise<void> {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {
        // Tab may not have content script — ignore
      });
    }
  }
}
