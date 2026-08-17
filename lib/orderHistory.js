/**
 * Contact history for checkout (pemesan/penerima) — persisted in
 * localStorage so repeat customers can pick their data from a dropdown.
 *
 * No Supabase JWT needed: this is a purely client-side convenience for a
 * public shop. localStorage is not sent to the server (unlike cookies) and
 * requires no login flow.
 *
 * Entries are sanitized on save AND on read: a phone number must be digits
 * (optional leading "+") with at least 7 digits. This guards against
 * corrupted entries (e.g. a name typed into the WA field) that would
 * otherwise fill the wrong inputs when picked.
 */

const KEY = 'esenel.contactHistory.v1';
const MAX = 20;

/** Keep only digits and an optional leading "+"; strip spaces/dashes/etc. */
function normalizeWa(wa) {
  return String(wa || '').replace(/[^\d+]/g, '').trim();
}

/** Valid WA: only digits (plus optional "+"), at least 7 digits. */
function isValidWa(wa) {
  const digits = wa.replace(/\D/g, '');
  return /^[+\d]+$/.test(wa) && digits.length >= 7;
}

/** Returns a clean { nama, wa, email } or null if the entry is invalid. */
function normalizeEntry(e) {
  if (!e) return null;
  const nama = String(e.nama || '').trim();
  const wa = normalizeWa(e.wa);
  if (!nama || !isValidWa(wa)) return null;
  return { nama, wa, email: String(e.email || '').trim() };
}

/** [{ nama, wa, email? }] — sanitized, newest first. */
export function getContactHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeEntry).filter(Boolean);
  } catch {
    return [];
  }
}

/** Merge new contacts into history, dedupe by nama+wa, cap at MAX entries. */
export function saveContactHistory(entries) {
  if (typeof window === 'undefined') return;
  const existing = getContactHistory();
  const seen = new Set();
  const merged = [];
  for (const e of [...entries, ...existing]) {
    const norm = normalizeEntry(e);
    if (!norm) continue;
    const key = `${norm.nama}|${norm.wa}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(norm);
    if (merged.length >= MAX) break;
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    // Storage full / private mode — history is best-effort only.
  }
}
