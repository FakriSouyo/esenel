import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProductBySlug, products } from '@/data/products';
import { formatIDR } from '@/lib/format';
import AddToBagButton from '@/components/products/AddToBagButton';

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const product = getProductBySlug(params.slug);
  return { title: product ? `${product.name} — ESENEL` : 'ESENEL' };
}

export default function ProductDetailPage({ params }) {
  const product = getProductBySlug(params.slug);
  if (!product) return notFound();

  return (
    <main className="pt-32 md:pt-40 pb-28">
      <div className="container-esenel grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
        <div className="relative aspect-[4/5] rounded-nav overflow-hidden bg-sand/30">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
        </div>

        <div className="md:pt-6">
          <p className="text-[12px] tracking-nav text-ink/50">{product.subtitle}</p>
          <h1 className="font-display text-4xl md:text-5xl mt-2">{product.name}</h1>
          <p className="text-xl mt-4">{formatIDR(product.price)}</p>
          <p className="mt-6 text-ink/65 leading-relaxed max-w-md">{product.description}</p>

          <div className="mt-8">
            <AddToBagButton product={product} />
          </div>

          <div className="mt-12 border-t border-sand pt-8">
            <p className="text-[12px] tracking-nav font-medium text-ink/50 mb-3">DETAILS</p>
            <ul className="text-sm text-ink/70 space-y-1.5">
              <li>Size: {product.subtitle}</li>
              <li>Composition: {product.composition.join(', ')}</li>
            </ul>
          </div>

          <div className="mt-8 border-t border-sand pt-8">
            <p className="text-[12px] tracking-nav font-medium text-ink/50 mb-3">CARE</p>
            <p className="text-sm text-ink/70 leading-relaxed">
              Trim stems at an angle, change water every two days, and keep away from direct heat
              and direct sunlight to help your bouquet last.
            </p>
          </div>

          <div className="mt-8 border-t border-sand pt-8">
            <p className="text-[12px] tracking-nav font-medium text-ink/50 mb-3">DELIVERY</p>
            <p className="text-sm text-ink/70 leading-relaxed">
              Same-week delivery is available within our service area. Delivery windows and
              coverage can be confirmed at checkout.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
