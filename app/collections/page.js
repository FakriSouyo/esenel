import Link from 'next/link';
import { collectionCopy } from '@/data/collections';
import { getProductsByCategory } from '@/data/products';

export const metadata = { title: 'Collections — ESENEL' };

export default function CollectionsPage() {
  return (
    <main className="pt-40 pb-28">
      <div className="container-esenel">
        <div className="max-w-xl mb-14">
          <p className="text-[12px] tracking-[0.2em] font-medium text-earth mb-4">COLLECTIONS</p>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.1]">
            Shop by collection
          </h1>
        </div>

        <div className="space-y-4">
          {Object.entries(collectionCopy).map(([slug, copy]) => {
            const count = getProductsByCategory(slug).length;
            return (
              <Link
                key={slug}
                href={`/collections/${slug}`}
                className="group flex items-center justify-between border-b border-sand py-6"
              >
                <div>
                  <h2 className="font-display text-3xl md:text-4xl group-hover:text-earth transition-colors">
                    {copy.title}
                  </h2>
                  <p className="text-ink/50 text-sm mt-1">{copy.tagline}</p>
                </div>
                <span className="text-[12px] tracking-nav text-ink/40">
                  {count} {count === 1 ? 'PIECE' : 'PIECES'} →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
