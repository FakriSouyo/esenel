import { describe, expect, it } from 'vitest';
import { normalizeName } from '@/lib/nameNormalize';

describe('normalizeName', () => {
  it('lowercases and strips spaces', () => {
    expect(normalizeName('Fakhri Abdillah')).toBe('fakhriabdillah');
  });

  it('strips special characters', () => {
    expect(normalizeName('Carin! @Luna')).toBe('carinluna');
  });

  it('drops accents/diacritics to plain letters', () => {
    expect(normalizeName('Séléna')).toBe('selena');
  });

  it('keeps digits', () => {
    expect(normalizeName('Budi2')).toBe('budi2');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeName('')).toBe('');
    expect(normalizeName('   ')).toBe('');
    expect(normalizeName(null)).toBe('');
    expect(normalizeName(undefined)).toBe('');
  });
});
