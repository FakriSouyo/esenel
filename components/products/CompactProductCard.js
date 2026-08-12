'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatIDR } from '@/lib/format';

export default function CompactProductCard({ product }) {
  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative aspect-square rounded-nav overflow-hidden bg-sand/30">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 20vw, (min-width: 640px) 40vw, 100vw"
          className="object-cover transition-transform duration-700 ease-esenel-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-base leading-tight">{product.name}</p>
          <p className="text-[12px] text-ink/55 mt-1 leading-snug line-clamp-2">
            {product.description}
          </p>
        </div>
        <p className="text-[13px] font-medium whitespace-nowrap shrink-0">
          {formatIDR(product.price)}
        </p>
      </div>
    </Link>
  );
}
