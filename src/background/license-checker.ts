import type { LicenseRecord } from '../types/storage';
import { getLicense, setLicense } from './storage';

/**
 * License key format: PRO-{base64(email|expiry)}-{first8ofSHA}
 *
 * V1 implementation: simple format validation + expiry check.
 * V2: verify HMAC against server to prevent forgery.
 */
export async function validateAndActivate(
  licenseKey: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = licenseKey.trim();

  // Basic format check
  if (!trimmed.startsWith('PRO-')) {
    return { success: false, error: 'Invalid license key format' };
  }

  const parts = trimmed.split('-');
  if (parts.length < 3) {
    return { success: false, error: 'Invalid license key format' };
  }

  // Decode payload
  try {
    const payload = atob(parts[1]);
    const [encodedEmail, expiryStr] = payload.split('|');
    const expiresAt = expiryStr === 'lifetime' ? null : parseInt(expiryStr, 10);

    if (expiresAt && Date.now() > expiresAt) {
      return { success: false, error: 'License key has expired' };
    }

    if (encodedEmail && encodedEmail !== btoa(email.toLowerCase())) {
      return { success: false, error: 'License key does not match this email address' };
    }

    const license: LicenseRecord = {
      plan: 'pro',
      licenseKey: trimmed,
      email: email.toLowerCase(),
      activatedAt: Date.now(),
      expiresAt: expiresAt ?? null,
    };

    await setLicense(license);
    return { success: true };
  } catch {
    return { success: false, error: 'Could not decode license key' };
  }
}

export async function getLicenseStatus(): Promise<LicenseRecord> {
  const license = await getLicense();

  // Check if Pro license has expired
  if (license.plan === 'pro' && license.expiresAt && Date.now() > license.expiresAt) {
    const downgraded: LicenseRecord = { ...license, plan: 'free' };
    await setLicense(downgraded);
    return downgraded;
  }

  return license;
}

export function getMaxProducts(plan: 'free' | 'pro'): number {
  return plan === 'pro' ? 5 : 3;
}
