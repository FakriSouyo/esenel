'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/cart/CartContext';
import { formatIDR } from '@/lib/format';

/**
 * Quantity stepper + ADD TO BAG for the product detail page.
 * Desktop gets an inline buy box; mobile gets a sticky bottom bar
 * with a live total so the price and action stay in reach.
 */
export default function ProductBuyBox({ product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  const add = () =>
    addItem({
      id: product.slug,
      name: product.name,
      subtitle: product.subtitle,
      price: product.price,
      image: product.image,
      quantity: qty,
    });

  const stepper = (
    <div className="flex items-center gap-1 rounded-pill border border-ink/15 bg-white p-1">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => setQty((q) => Math.max(1, q - 1))}
        className="flex h-7 w-7 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-sand/60 active:scale-90 md:h-9 md:w-9"
      >
        <Minus size={12} className="md:hidden" />
        <Minus size={14} className="hidden md:block" />
      </button>
      <span className="w-7 text-center text-[13px] font-medium tabular-nums md:w-8 md:text-sm">{qty}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => setQty((q) => q + 1)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-sand/60 active:scale-90 md:h-9 md:w-9"
      >
        <Plus size={12} className="md:hidden" />
        <Plus size={14} className="hidden md:block" />
      </button>
    </div>
  );

  const button = (extra = '') => (
    <button
      type="button"
      onClick={add}
      className={`flex items-center justify-center gap-2 rounded-pill bg-ink px-4 py-3 text-[12px] font-medium tracking-nav text-cloud transition-all hover:bg-ink/90 active:scale-[0.98] md:px-7 md:py-4 md:text-[13px] ${extra}`}
    >
      <ShoppingBag size={14} className="md:hidden" />
      <ShoppingBag size={15} className="hidden md:block" />
      ADD TO BAG
    </button>
  );

  return (
    <>
      {/* Desktop: inline buy box */}
      <div className="hidden items-center gap-3 md:flex">
        {stepper}
        {button('flex-1')}
      </div>

      {/* Mobile: sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand/70 bg-cloud/90 px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          <div className="shrink-0">
            <p className="text-[10px] tracking-nav text-ink/40">TOTAL</p>
            <p className="text-lg font-medium leading-tight tabular-nums">
              {formatIDR(product.price * qty)}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {stepper}
            {button('px-5')}
          </div>
        </div>
      </div>
    </>
  );
}
