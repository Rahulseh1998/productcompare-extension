import type { Product } from './product';
import type { SavedComparison } from './comparison';

export interface UserSettings {
  dimIdenticalRows: boolean;
  showVerdict: boolean;
  showPriceHistory: boolean;
  anthropicApiKey: string | null;
  keepaApiKey: string | null;
}

export interface LicenseRecord {
  plan: 'free' | 'pro';
  licenseKey: string | null;
  email: string | null;
  activatedAt: number | null;
  expiresAt: number | null;
}

export interface StorageSchema {
  'compare.active': {
    products: Product[];
    updatedAt: number;
  };
  'compare.saved': SavedComparison[];
  settings: UserSettings;
  license: LicenseRecord;
  'onboarding.completed': boolean;
  'onboarding.step': number;
  'selector.overrides': Record<string, string>;
  'selector.overrides.fetchedAt': number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  dimIdenticalRows: true,
  showVerdict: true,
  showPriceHistory: true,
  anthropicApiKey: null,
  keepaApiKey: null,
};

export const DEFAULT_LICENSE: LicenseRecord = {
  plan: 'free',
  licenseKey: null,
  email: null,
  activatedAt: null,
  expiresAt: null,
};
