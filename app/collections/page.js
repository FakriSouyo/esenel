import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import CollectionGallery from '@/components/collections/CollectionGallery';
import { collectionCopy } from '@/data/collections';
import { getProductsByCategory } from '@/data/products';

export const metadata = { title: 'Collections — ESENEL' };

// Curated display order for the index.
const order = ['small', 'medium', 'large', 'extra-large', 'vase', 'flower-board'];

export default function CollectionsPage() {
  const collections = order
    .filter((slug) => collectionCopy[slug])
    .map((slug) => ({
      slug,
      copy: collectionCopy[slug],
      count: getProductsByCategory(slug).length,
    }));

  const total = collections.reduce((sum, c) => sum + c.count, 0);

  return (
    <main className="bg-white pb-24">
      {/* ── Editorial header ── */}
      <section className="container-esenel pb-12 pt-36 md:pb-16 md:pt-44">
        <div className="max-w-2xl">
          <p className="mb-4 text-[12px] font-medium tracking-[0.2em] text-earth">
            COLLECTIONS
          </p>
          <h1 className="font-display text-4xl leading-[1.05] md:text-6xl">
            Shop by collection.
          </h1>
          <p className="mt-6 max-w-lg leading-relaxed text-ink/60">
            Six ways to give — from a single stem&rsquo;s worth of gesture to something
            unforgettable. Hover to explore, tap on mobile.
          </p>
        </div>
        <div className="mt-10 flex items-center gap-6 text-[11px] font-medium tracking-[0.18em] text-ink/45">
          <span>{collections.length} COLLECTIONS</span>
          <span className="h-3 w-px bg-ink/15" />
          <span>{total} ARRANGEMENTS</span>
        </div>
      </section>

      {/* ── Hover-expand gallery ── */}
      <CollectionGallery collections={collections} />

      {/* ── Closing CTA ── */}
      <section className="container-esenel flex flex-col items-center pt-20 text-center">
        <p className="text-[12px] font-medium tracking-[0.2em] text-earth">
          NOT SURE WHERE TO START?
        </p>
        <h2 className="mt-4 font-display text-3xl leading-tight md:text-4xl">
          Build your own bouquet.
        </h2>
        <Link
          href="/craft"
          className="mt-8 inline-flex items-center gap-2 rounded-pill bg-ink px-8 py-3.5 text-[13px] font-medium tracking-nav text-cloud transition-colors hover:bg-ink/90"
        >
          START CRAFTING
          <ArrowRight size={14} />
        </Link>
      </section>
    </main>
  );
}
