/**
 * Route OG image — next/og (satori) menghasilkan PNG 1200×630 per halaman.
 *
 *   /og?page=home|about|craft|name|journal|shop
 *
 * Desain + loader font dibagi lewat lib/ogTemplate.jsx (dipakai juga oleh
 * /og/name/[name] untuk OG halaman hasil generate nama).
 */

import { ImageResponse } from 'next/og';
import { OG_PAGES } from '@/lib/site';
import { loadOgFonts, OgCard } from '@/lib/ogTemplate';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || 'home';
  const cfg = OG_PAGES[page] || OG_PAGES.home;
  const fonts = await loadOgFonts();

  return new ImageResponse(
    <OgCard title={cfg.title} tagline={cfg.tagline} accent={cfg.accent} />,
    {
      width: 1200,
      height: 630,
      fonts,
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
    },
  );
}
