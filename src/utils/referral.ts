/**
 * Simple referral system.
 *
 * Each user gets a unique referral code (generated on first use).
 * The referral URL opens the CWS listing with a ref param that gets
 * tracked on the companion website.
 *
 * V1: Referral URL → companion website /refer?code=XXX → redirect to CWS
 * Reward tracking is manual for V1 (check referral codes on website analytics).
 * V2: Add backend endpoint to track installs per referral code and auto-reward.
 */

const BASE_URL = 'http://localhost:3000/refer';

export async function getReferralCode(): Promise<string> {
  const result = await chrome.storage.local.get('referral.code');
  if (result['referral.code']) return result['referral.code'];

  // Generate a short unique code
  const code = 'CC' + crypto.randomUUID().slice(0, 8).toUpperCase();
  await chrome.storage.local.set({ 'referral.code': code });
  return code;
}

export function getReferralUrl(code: string): string {
  return `${BASE_URL}?code=${code}`;
}

export async function getReferralCount(): Promise<number> {
  const result = await chrome.storage.local.get('referral.count');
  return result['referral.count'] ?? 0;
}
