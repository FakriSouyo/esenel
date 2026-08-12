import Link from 'next/link';
import Image from 'next/image';
import ProductGrid from '@/components/products/ProductGrid';
import { categories, products } from '@/data/products';

export const metadata = { title: 'Shop — ESENEL' };

const categoryImages = {
  small: '/small.jpg',
  medium: '/medium.jpg',
  large: '/large.jpg',
  'extra-large': '/extra-large.jpg',
  vase: '/vase.jpg',
  'flower-board': '/flower-board.jpg',
};

export default function ShopPage() {
  return (
    <main className="bg-white pt-32 pb-28 md:pt-40">
      <div className="container-esenel">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-6 md:mb-20 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="mb-4 text-[12px] tracking-[0.2em] font-medium text-earth">THE CATALOG</p>
            <h1 className="font-display text-4xl leading-[1.05] md:text-6xl">
              Bouquets,
              <br />
              made to order.
            </h1>
            <p className="mt-5 max-w-md leading-relaxed text-ink/60">
              Each arrangement is composed with seasonal blooms and finished by hand. Browse by
              size or style below — or build something entirely your own.
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

        {/* Category strip */}
        <div className="mb-16 grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat.slug).length;
            return (
              <Link
                key={cat.slug}
                href={`/collections/${cat.slug}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-sand/40"
              >
                <Image
                  src={categoryImages[cat.slug]}
                  alt={cat.label}
                  fill
                  sizes="(min-width: 768px) 16vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-esenel-out group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/10 to-transparent" />
                <div className="absolute inset-x-3 bottom-3 md:inset-x-3.5 md:bottom-3.5">
                  <p className="font-display text-sm leading-none text-cloud md:text-base">
                    {cat.label}
                  </p>
                  <p className="mt-1 text-[11px] text-cloud/70">
                    {count} {count === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <ProductGrid />
      </div>
    </main>
  );
}
