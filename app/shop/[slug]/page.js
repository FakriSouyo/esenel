import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Droplets, Flower2, Ruler, Truck } from 'lucide-react';
import { getProductBySlug, getProductsByCategory, categories, products } from '@/data/products';
import ProductBuyBox from '@/components/products/ProductBuyBox';
import ProductCard from '@/components/products/ProductCard';
import { ogImage } from '@/lib/site';

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: 'ESENEL' };
  return {
    title: `${product.name} — ${product.subtitle} — ESENEL`,
    description: product.subtitle,
    openGraph: {
      title: `${product.name} — ESENEL`,
      description: product.subtitle,
      images: [ogImage('shop')],
    },
  };
}

export default function ProductDetailPage({ params }) {
  const product = getProductBySlug(params.slug);
  if (!product) return notFound();

  const category = categories.find((c) => c.slug === product.category);
  const related = getProductsByCategory(product.category)
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  return (
    <main className="bg-white pb-32 md:pb-24">
      {/* ── Breadcrumb ── */}
      <nav className="container-esenel pt-28 md:pt-36">
        <ol className="flex flex-wrap items-center gap-2 text-[11px] tracking-nav text-ink/45">
          <li>
            <Link href="/" className="transition-colors hover:text-ink">
              HOME
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/shop" className="transition-colors hover:text-ink">
              SHOP
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/collections/${product.category}`}
              className="transition-colors hover:text-ink"
            >
              {category?.label.toUpperCase()}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink">{product.name.toUpperCase()}</li>
        </ol>
      </nav>

      {/* ── Hero split: image + info ── */}
      <section className="container-esenel mt-6 grid gap-8 md:mt-10 md:grid-cols-2 md:gap-14 lg:gap-20">
        {/* Image */}
        <div className="relative">
          <div className="relative overflow-hidden rounded-[28px] bg-sand/40">
            {/* soft ambience blobs */}
            <div aria-hidden="true" className="absolute -left-12 -top-12 h-56 w-56 rounded-full bg-meadow/50 blur-3xl" />
            <div aria-hidden="true" className="absolute -bottom-14 -right-10 h-64 w-64 rounded-full bg-sand/80 blur-3xl" />
            <div className="relative aspect-[4/5]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            {/* badges */}
            <div className="absolute left-4 top-4 flex gap-2">
              {product.isNew && (
                <span className="rounded-pill bg-earth px-3 py-1.5 text-[10px] font-medium tracking-[0.08em] text-white">
                  NEW
                </span>
              )}
              {product.bestSeller && (
                <span className="rounded-pill bg-ink px-3 py-1.5 text-[10px] font-medium tracking-[0.08em] text-cloud">
                  BESTSELLER
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col md:pt-4">
          <p className="text-[11px] font-medium tracking-[0.22em] text-earth">
            {category?.label.toUpperCase()} — SLEMAN, YOGYAKARTA
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] md:text-6xl">{product.name}</h1>
          <p className="mt-4 text-2xl font-medium tracking-tight text-ink md:text-3xl">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.price)}
          </p>
          <p className="mt-5 max-w-md leading-relaxed text-ink/60">{product.description}</p>

          {/* Composition chips */}
          <div className="mt-6 flex flex-wrap gap-2">
            {product.composition.map((c) => (
              <span
                key={c}
                className="flex items-center gap-1.5 rounded-pill border border-sand bg-cloud px-3.5 py-1.5 text-[12px] text-ink/70"
              >
                <Flower2 size={12} className="text-grass" />
                {c}
              </span>
            ))}
          </div>

          {/* Buy box */}
          <div className="mt-8">
            <ProductBuyBox product={product} />
          </div>

          {/* Details */}
          <dl className="mt-10 divide-y divide-sand border-y border-sand">
            <DetailRow icon={<Ruler size={15} />} label="SIZE" value={product.subtitle} />
            <DetailRow
              icon={<Flower2 size={15} />}
              label="COMPOSITION"
              value={product.composition.join(' · ')}
            />
            <DetailRow
              icon={<Droplets size={15} />}
              label="CARE"
              value="Trim stems at an angle, change the water every two days, and keep the bouquet away from direct heat and sunlight."
            />
            <DetailRow
              icon={<Truck size={15} />}
              label="DELIVERY"
              value="Same-week delivery within our service area in Sleman, Yogyakarta. Windows and coverage are confirmed at checkout."
            />
          </dl>

          <p className="mt-6 text-[12px] leading-relaxed text-ink/45">
            Arranged by hand in Sleman, Yogyakarta — cut the same day, delivered by us.
          </p>
        </div>
      </section>

      {/* ── Related ── */}
      {related.length > 0 && (
        <section className="container-esenel mt-20 md:mt-28">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-medium tracking-[0.22em] text-earth">
                KEEP EXPLORING
              </p>
              <h2 className="mt-2 font-display text-3xl md:text-4xl">
                More from {category?.label}
              </h2>
            </div>
            <Link
              href={`/collections/${product.category}`}
              className="group hidden shrink-0 items-center gap-2 text-[12px] font-medium tracking-nav text-ink/60 transition-colors hover:text-ink sm:flex"
            >
              VIEW ALL
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard product={p} key={p.slug} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 py-4">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand/50 text-grass">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[10px] font-medium tracking-[0.18em] text-ink/40">{label}</dt>
        <dd className="mt-1 leading-relaxed text-ink/75">{value}</dd>
      </div>
    </div>
  );
}
