const SLUG = 'exam-deadline-map';
const TOKEN_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `sb_license_verdict:${SLUG}`;
const API_BASE = import.meta.env.VITE_BILLING_BASE || 'https://api.sociobot.in/api/v1';

interface Verdict { valid: boolean; checkedAt: number; reason?: string }

export function checkoutUrl(): string {
  return `${API_BASE}/products/${SLUG}/checkout`;
}

export function storeReturnedLicense(): boolean {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('license');
  if (!token) return false;
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: true, checkedAt: 0 }));
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return true;
}

export function hasPaidAccess(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  try {
    const verdict = JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}') as Verdict;
    return verdict.valid !== false;
  } catch { return true; }
}

export function restoreLicense(token: string): void {
  const cleaned = token.trim();
  if (cleaned.length < 8) throw new Error('That license looks incomplete. Paste the full token from your receipt.');
  localStorage.setItem(TOKEN_KEY, cleaned);
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: true, checkedAt: 0 }));
}

export function removeLicense(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERDICT_KEY);
}

export async function verifyLicense(force = false): Promise<boolean> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  let verdict: Verdict = { valid: true, checkedAt: 0 };
  try { verdict = JSON.parse(localStorage.getItem(VERDICT_KEY) || '{}') as Verdict; } catch { /* optimistic */ }
  if (!force && Date.now() - (verdict.checkedAt || 0) < 86_400_000) return verdict.valid;
  const response = await fetch(`${API_BASE}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error('License service is temporarily unavailable.');
  const result = await response.json() as { valid: boolean; reason?: string };
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, reason: result.reason, checkedAt: Date.now() }));
  return result.valid;
}
