'use client';

import { useState, useMemo } from 'react';
import { products, categories } from '@/data/products';
import ProductCard from './ProductCard';

export default function ProductGrid() {
  const [active, setActive] = useState('all');

  const filtered = useMemo(() => {
    if (active === 'all') return products;
    return products.filter((p) => p.category === active);
  }, [active]);

  const pills = [{ slug: 'all', label: 'All' }, ...categories];
  const countOf = (slug) =>
    slug === 'all' ? products.length : products.filter((p) => p.category === slug).length;

  return (
    <div>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {pills.map((pill) => {
            const isActive = active === pill.slug;
            const count = countOf(pill.slug);
            return (
              <button
                key={pill.slug}
                onClick={() => setActive(pill.slug)}
                className={`h-[36px] rounded-pill border px-4 text-[12.5px] tracking-nav font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-ink border-ink text-cloud shadow-[0_6px_16px_rgba(32,34,30,0.18)]'
                    : 'bg-transparent border-ink/15 text-ink hover:border-ink/45 hover:bg-ink/[0.03]'
                }`}
              >
                {pill.label.toUpperCase()}
                <span className={`ml-1.5 ${isActive ? 'text-cloud/60' : 'text-ink/40'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <p className="shrink-0 text-[12px] tracking-nav text-ink/45">
          {filtered.length} OF {products.length} ARRANGEMENTS
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
        {filtered.map((product, i) => (
          <ProductCard product={product} key={product.slug} priority={i < 4} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-ink/50">
          No products in this category yet.
        </p>
      )}
    </div>
  );
}
