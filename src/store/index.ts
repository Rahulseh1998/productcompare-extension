import { create } from 'zustand';
import type { Product } from '../types/product';
import type { UserSettings, LicenseRecord } from '../types/storage';
import { DEFAULT_SETTINGS, DEFAULT_LICENSE } from '../types/storage';

interface CompareSlice {
  products: Product[];
  setProducts: (products: Product[]) => void;
  removeProduct: (asin: string) => void;
  clearAll: () => void;
}

interface SettingsSlice {
  settings: UserSettings;
  setSettings: (s: UserSettings) => void;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

interface LicenseSlice {
  license: LicenseRecord;
  setLicense: (l: LicenseRecord) => void;
  get maxProducts(): number;
  get isPro(): boolean;
}

type StoreState = CompareSlice & SettingsSlice & LicenseSlice;

export const useStore = create<StoreState>((set, get) => ({
  // ── Compare slice ────────────────────────────────────────────────────────────
  products: [],
  setProducts: (products) => set({ products }),
  removeProduct: (asin) => {
    const updated = get().products.filter((p) => p.asin !== asin);
    set({ products: updated });
    chrome.runtime.sendMessage({ type: 'REMOVE_PRODUCT', asin });
  },
  clearAll: () => {
    set({ products: [] });
    chrome.runtime.sendMessage({ type: 'CLEAR_ALL' });
  },

  // ── Settings slice ───────────────────────────────────────────────────────────
  settings: DEFAULT_SETTINGS,
  setSettings: (settings) => set({ settings }),
  updateSetting: (key, value) =>
    set((state) => ({ settings: { ...state.settings, [key]: value } })),

  // ── License slice ────────────────────────────────────────────────────────────
  license: DEFAULT_LICENSE,
  setLicense: (license) => set({ license }),
  get maxProducts() { return get().license.plan === 'pro' ? 5 : 3; },
  get isPro() { return get().license.plan === 'pro'; },
}));
