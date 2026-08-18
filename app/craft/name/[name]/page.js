import { notFound } from 'next/navigation';
import { normalizeName } from '@/lib/nameNormalize';
import { getCachedNameStory } from '@/lib/supabase';
import { getDummyStory } from '@/lib/nameStoryDummy';
import { OG_VERSION } from '@/lib/site';
import { products } from '@/data/products';
import NameSharePage from '@/components/craft/NameSharePage';

const CATALOG_NAMES = Array.from(new Set(products.map((p) => p.name)));

/** Ambil story untuk link yang dibagikan — cache Supabase dulu, fallback
 *  dummy (sama seperti alur generate biasa) supaya link selalu bisa dibuka. */
async function resolveStory(key) {
  try {
    const row = await getCachedNameStory(key);
    if (row?.story) return row.story;
  } catch {
    // lanjut fallback dummy
  }
  return getDummyStory(key, CATALOG_NAMES);
}

export async function generateMetadata({ params }) {
  const key = normalizeName(params.name) || 'nama';
  const story = await resolveStory(key);
  const title = story?.nama || 'Bouquet';
  const description = story?.namaBuket
    ? `Buket "${story.namaBuket}" — dibuat khusus dari namamu.`
    : 'Bouquet dari nama — ESENEL';
  return {
    title: `${title} — ESENEL`,
    description,
    openGraph: {
      title: `${title} — ESENEL`,
      description,
      images: [
        {
          url: `/og/name/${encodeURIComponent(key)}?v=${OG_VERSION}`,
          width: 1200,
          height: 630,
          alt: `${title} — ESENEL`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — ESENEL`,
      description,
      images: [`/og/name/${encodeURIComponent(key)}?v=${OG_VERSION}`],
    },
  };
}

export default async function NameSharedPage({ params }) {
  const key = normalizeName(params.name) || '';
  if (!key) notFound();
  const story = await resolveStory(key);
  return <NameSharePage story={story} />;
}
