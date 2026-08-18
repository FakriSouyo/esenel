import Link from 'next/link';
import ProductGrid from '@/components/products/ProductGrid';
import CollectionGallery from '@/components/collections/CollectionGallery';
import { collectionCopy } from '@/data/collections';
import { getProductsByCategory } from '@/data/products';

import { ogImage } from '@/lib/site';

export const metadata = {
  title: 'Collection — ESENEL',
  description: 'Arrangements and collections, gathered by season.',
  openGraph: {
    title: 'Collection — ESENEL',
    description: 'Arrangements and collections, gathered by season.',
    images: [ogImage('shop')],
  },
};

const order = ['small', 'medium', 'large', 'extra-large', 'vase', 'flower-board', 'custom'];

export default function ShopPage() {
  const collections = order
    .filter((slug) => collectionCopy[slug])
    .map((slug) => ({
      slug,
      copy: collectionCopy[slug],
      count: getProductsByCategory(slug).length,
    }));

  return (
    <main className="bg-white pb-28">
      {/* Header */}
      <div className="container-esenel pt-32 md:pt-40">
        <div className="mb-14 flex flex-col gap-6 md:mb-20 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="mb-4 text-[12px] tracking-[0.2em] font-medium text-earth">THE COLLECTION</p>
            <h1 className="font-display text-4xl leading-[1.05] md:text-6xl">
              Bouquets,
              <br />
              made to order.
            </h1>
            <p className="mt-5 max-w-md leading-relaxed text-ink/60">
              Each arrangement is composed with seasonal blooms and finished by hand in Sleman,
              Yogyakarta. Browse by size or style below — or build something entirely your own.
            </p>
          </div>
          <Link
            href="/craft"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-pill bg-ink px-7 py-3.5 text-[13px] font-medium tracking-nav text-cloud transition-colors hover:bg-ink/90 md:self-auto"
          >
            BUILD YOUR OWN
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Hover-expand collection gallery */}
      <CollectionGallery collections={collections} />

      {/* All arrangements */}
      <div className="container-esenel pt-20 md:pt-24">
        <ProductGrid />
      </div>
    </main>
  );
}
