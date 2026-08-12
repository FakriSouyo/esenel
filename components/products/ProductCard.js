'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { useCart } from '@/components/cart/CartContext';
import { categories } from '@/data/products';
import { formatIDR } from '@/lib/format';

export default function ProductCard({ product, priority = false }) {
  const { addItem } = useCart();
  const category = categories.find((c) => c.slug === product.category);

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-sand/30">
        <Image
          src={product.image}
          alt={product.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-esenel-out group-hover:scale-[1.05]"
        />

        {/* hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* category pill */}
        <span className="absolute left-3 top-3 rounded-pill bg-white/85 px-2.5 py-1 text-[10px] font-medium tracking-[0.08em] text-ink backdrop-blur-sm">
          {category?.label.toUpperCase()}
        </span>

        {/* badges */}
        {product.isNew ? (
          <span className="absolute right-3 top-3 rounded-pill bg-earth px-2.5 py-1 text-[10px] font-medium tracking-[0.08em] text-white">
            NEW
          </span>
        ) : product.bestSeller ? (
          <span className="absolute right-3 top-3 rounded-pill bg-ink px-2.5 py-1 text-[10px] font-medium tracking-[0.08em] text-cloud">
            BESTSELLER
          </span>
        ) : null}

        {/* quick add */}
        <button
          type="button"
          aria-label={`Add ${product.name} to bag`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addItem({
              id: product.slug,
              name: product.name,
              subtitle: product.subtitle,
              price: product.price,
              image: product.image,
            });
          }}
          className="absolute inset-x-3 bottom-3 flex translate-y-3 items-center justify-center gap-2 rounded-pill bg-white/90 py-3 text-[12px] font-medium tracking-nav text-ink opacity-0 backdrop-blur-md transition-all duration-300 ease-esenel-out hover:bg-white group-hover:translate-y-0 group-hover:opacity-100"
        >
          <Plus size={14} />
          ADD TO BAG
        </button>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-lg leading-tight transition-colors duration-300 group-hover:text-earth">
            {product.name}
          </p>
          <p className="mt-1 truncate text-[12px] text-ink/50">{product.subtitle}</p>
        </div>
        <p className="whitespace-nowrap pt-0.5 text-[13px] font-medium">
          {formatIDR(product.price)}
        </p>
      </div>
    </Link>
  );
}
