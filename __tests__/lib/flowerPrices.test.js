import { describe, expect, it } from 'vitest';
import {
  estimateBouquetPrice,
  FLOWER_PRICE_DATA,
  flowerBreakdown,
  formatIDR,
  getFlowerPrice,
  normalizeFlowerName,
  WRAP_FEE,
} from '@/lib/flowerPrices';
import { getDummyStory } from '@/lib/nameStoryDummy';

describe('normalizeFlowerName', () => {
  it('lowercases, strips accents and collapses spaces', () => {
    expect(normalizeFlowerName('  Tulip Putih  ')).toBe('tulip putih');
    expect(normalizeFlowerName('Anthurium')).toBe('anthurium');
  });
});

describe('getFlowerPrice', () => {
  it('matches exact names and Indonesian aliases', () => {
    expect(getFlowerPrice('Mawar Merah').harga).toBe(25000);
    expect(getFlowerPrice('Lavender').harga).toBe(75000);
    expect(getFlowerPrice('Gypsophila').harga).toBe(15000);
    expect(getFlowerPrice('Dusty miller').harga).toBe(25000);
    expect(getFlowerPrice('Baby breath').harga).toBe(15000);
  });

  it('matches compound names by prefix ("Tulip putih" → Tulip)', () => {
    expect(getFlowerPrice('Tulip putih').nama).toBe('Tulip');
    expect(getFlowerPrice('Bunga Matahari Kecil').nama).toBe('Bunga Matahari');
    expect(getFlowerPrice('Mawar pink').nama).toBe('Mawar Pink');
  });

  it('matches English names too', () => {
    expect(getFlowerPrice('deep red roses').nama).toBe('Mawar Merah');
    expect(getFlowerPrice('sunflowers').nama).toBe('Bunga Matahari');
    expect(getFlowerPrice('peonies').harga).toBe(120000);
  });

  it('returns null for unknown flowers', () => {
    expect(getFlowerPrice('Bunga Misterius XYZ')).toBeNull();
    expect(getFlowerPrice('')).toBeNull();
  });
});

describe('flowerBreakdown', () => {
  it('sums item prices and adds the wrap fee', () => {
    const story = {
      bunga: [
        { nama: 'Mawar Merah' },
        { nama: 'Tulip putih' },
        { nama: 'Gypsophila' },
      ],
    };
    const b = flowerBreakdown(story);
    expect(b.items).toHaveLength(3);
    expect(b.subtotal).toBe(25000 + 90000 + 15000);
    expect(b.wrapFee).toBe(WRAP_FEE);
    expect(b.total).toBe(b.subtotal + WRAP_FEE);
  });

  it('gives unknown flowers a market fallback price so nothing misses', () => {
    const b = flowerBreakdown({ bunga: [{ nama: 'Bunga Misterius XYZ' }] });
    expect(b.items[0].matched).toBe(false);
    expect(b.items[0].harga).toBe(30000);
    expect(b.total).toBe(30000 + WRAP_FEE);
  });

  it('no wrap fee when there are no flowers', () => {
    expect(flowerBreakdown({}).wrapFee).toBe(0);
    expect(flowerBreakdown(null).total).toBe(0);
  });
});

describe('estimateBouquetPrice', () => {
  it('equals breakdown total with a sane minimum', () => {
    expect(estimateBouquetPrice({ bunga: [{ nama: 'Mawar Merah' }] })).toBe(
      Math.max(25000 + WRAP_FEE, 99000)
    );
    expect(estimateBouquetPrice({ bunga: [] })).toBe(99000);
  });
});

describe('formatIDR', () => {
  it('formats Indonesian rupiah', () => {
    expect(formatIDR(25000)).toBe('Rp 25.000');
    expect(formatIDR(120000)).toBe('Rp 120.000');
  });
});

describe('no-miss guarantee', () => {
  it('every dummy story flower resolves to a price in the database', () => {
    const story = getDummyStory('Carin');
    const b = flowerBreakdown(story);
    expect(b.items.length).toBeGreaterThanOrEqual(6);
    for (const it of b.items) {
      expect(it.matched, `"${it.nama}" harus ada di database harga`).toBe(true);
      expect(it.harga).toBeGreaterThan(0);
    }
  });

  it('database is large and has Indonesian market entries', () => {
    expect(FLOWER_PRICE_DATA.length).toBeGreaterThanOrEqual(30);
    for (const entry of FLOWER_PRICE_DATA) {
      expect(entry.harga).toBeGreaterThan(0);
      expect(entry.nama.length).toBeGreaterThan(0);
    }
  });
});
