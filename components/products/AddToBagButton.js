'use client';

import { useCart } from '@/components/cart/CartContext';

export default function AddToBagButton({ product }) {
  const { addItem } = useCart();

  return (
    <button
      onClick={() =>
        addItem({
          id: product.slug,
          name: product.name,
          subtitle: product.subtitle,
          price: product.price,
          image: product.image,
        })
      }
      className="w-full bg-ink text-cloud py-4 rounded-pill text-[13px] font-medium tracking-nav hover:bg-ink/90 transition-colors"
    >
      ADD TO BAG
    </button>
  );
}
