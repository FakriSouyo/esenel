/**
 * Konfigurasi situs + OG image per halaman utama.
 *
 * OG image di-generate dinamis oleh route /og (app/og/route.jsx) memakai
 * next/og (satori) dengan font Geist Pixel + Plus Jakarta Sans dan palet
 * ESENEL. Metadata tiap halaman merujuk image itu lewat ogImage(page).
 */

/** URL absolut situs — crawler sosial (WhatsApp/Facebook/IG) butuh URL absolut. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

/** Warna brand ESENEL — dipakai OG generator (hardcode, bukan CSS var). */
export const BRAND = {
  ink: '#20221E',
  inkSoft: '#6B6B60',
  earth: '#A58F78',
  meadow: '#B6C5A8',
  sand: '#DED4C2',
  cloud: '#F8F9F5',
  sky: '#A9C9D8',
};

/**
 * Judul + tagline + aksen per halaman utama. `accent` mewarnai rule,
 * titik dekoratif, dan bunga pixel di OG image — dari palet ESENEL.
 * Tiap halaman punya teks OG yang berbeda (home = ESENEL, halaman
 * generate nama = "Buat Bunga dari Namamu", about, faq, dst).
 */
export const OG_PAGES = {
  home: {
    title: 'ESENEL',
    tagline: 'Fresh flowers, thoughtfully arranged.',
    accent: BRAND.meadow,
  },
  about: {
    title: 'About',
    tagline: 'The atelier and the hands behind the blooms.',
    accent: BRAND.earth,
  },
  craft: {
    title: 'Craft',
    tagline: 'A bouquet from a name — your own flower story.',
    accent: BRAND.sky,
  },
  name: {
    title: 'Buat Bunga dari Namamu',
    tagline: 'Ubah namamu menjadi buket — arti nama, cerita, dan bunga yang cocok untukmu.',
    accent: BRAND.meadow,
  },
  journal: {
    title: 'Journal',
    tagline: 'Notes on flowers, craft, and quiet living.',
    accent: BRAND.earth,
  },
  shop: {
    title: 'Collection',
    tagline: 'Arrangements and collections, gathered by season.',
    accent: BRAND.sky,
  },
  faq: {
    title: 'FAQ',
    tagline: 'Pertanyaan seputar pesanan, pengiriman, dan buket ESENEL.',
    accent: BRAND.sand,
  },
  checkout: {
    title: 'Checkout',
    tagline: 'Selesaikan pesanan bunga ESENEL dengan mudah.',
    accent: BRAND.earth,
  },
};

/** Objek gambar untuk metadata openGraph — path relatif, di-resolve ke
 *  absolut oleh metadataBase di root layout. */
export function ogImage(page) {
  const cfg = OG_PAGES[page] || OG_PAGES.home;
  return {
    url: `/og?page=${page}`,
    width: 1200,
    height: 630,
    alt: `${cfg.title} — ESENEL`,
  };
}
