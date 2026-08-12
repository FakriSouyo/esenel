import { notFound } from 'next/navigation';
import { collectionCopy } from '@/data/collections';
import { getProductsByCategory } from '@/data/products';
import ProductCard from '@/components/products/ProductCard';

export function generateStaticParams() {
  return Object.keys(collectionCopy).map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const copy = collectionCopy[params.slug];
  return { title: copy ? `${copy.title} — ESENEL` : 'ESENEL' };
}

export default function CollectionDetailPage({ params }) {
  const copy = collectionCopy[params.slug];
  if (!copy) return notFound();
  const items = getProductsByCategory(params.slug);

  return (
    <main className="pt-40 pb-28">
      <div className="container-esenel">
        <div className="max-w-xl mb-14">
          <p className="text-[12px] tracking-[0.2em] font-medium text-earth mb-4">COLLECTION</p>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.1]">{copy.title}</h1>
          <p className="mt-4 text-ink/60">{copy.tagline}</p>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
            {items.map((product) => (
              <ProductCard product={product} key={product.slug} />
            ))}
          </div>
        ) : (
          <p className="text-ink/50 text-sm">No pieces in this collection yet.</p>
        )}
      </div>
    </main>
  );
}
