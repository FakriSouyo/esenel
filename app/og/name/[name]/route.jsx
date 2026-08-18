/**
 * Route OG image hasil generate nama — PNG 1200×630 untuk link yang
 * dibagikan setelah user generate:
 *
 *   /og/name/<nameKey>
 *
 * Membaca story dari cache Supabase (kunci = normalizeName). Kalau belum
 * ada (fallback dev / nama belum pernah di-generate), pakai dummy story
 * supaya link tetap punya OG. Judul = nama buket hasil generate, tagline =
 * "Bouquet personal untuk <nama>".
 */

import { ImageResponse } from 'next/og';
import { normalizeName } from '@/lib/nameNormalize';
import { getCachedNameStory } from '@/lib/supabase';
import { getDummyStory } from '@/lib/nameStoryDummy';
import { BRAND } from '@/lib/site';
import { loadOgFonts, OgCard } from '@/lib/ogTemplate';
import { products } from '@/data/products';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const CATALOG_NAMES = Array.from(new Set(products.map((p) => p.name)));

export async function GET(request, { params }) {
  const key = normalizeName(params.name) || 'nama';
  const fonts = await loadOgFonts();

  let story = null;
  try {
    const row = await getCachedNameStory(key);
    story = row?.story || null;
  } catch {
    story = null;
  }
  if (!story) story = getDummyStory(key, CATALOG_NAMES);

  const title = story.namaBuket || story.nama || 'Bouquet';
  const tagline = `Bouquet personal untuk ${story.nama || key}`;
  const accent = BRAND.meadow;

  return new ImageResponse(
    <OgCard
      eyebrow="ESENEL · BUAT BUNGA DARI NAMAMU"
      title={String(title)}
      tagline={tagline}
      accent={accent}
    />,
    {
      width: 1200,
      height: 630,
      fonts,
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
    },
  );
}
