'use client';

import { useCart } from '@/components/cart/CartContext';
import { formatIDR } from '@/lib/format';
import Link from 'next/link';

export default function CheckoutPage() {
  const { items, subtotal } = useCart();

  return (
    <main className="pt-40 pb-28">
      <div className="container-esenel max-w-2xl">
        <p className="text-[12px] tracking-[0.2em] font-medium text-earth mb-4">CHECKOUT</p>
        <h1 className="font-display text-4xl md:text-5xl leading-[1.1] mb-12">Review your order</h1>

        {items.length === 0 ? (
          <div>
            <p className="text-ink/60 mb-6">Your bag is currently empty.</p>
            <Link
              href="/shop"
              className="inline-block bg-ink text-cloud px-7 py-3.5 rounded-pill text-[13px] font-medium tracking-nav"
            >
              BROWSE THE SHOP
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-sand border-t border-b border-sand mb-8">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-5">
                  <div>
                    <p className="font-display text-lg">{item.name}</p>
                    <p className="text-[12px] text-ink/50">
                      {item.subtitle || item.craft?.size} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm">{formatIDR(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-10">
              <span className="text-ink/60">Total</span>
              <span className="font-display text-2xl">{formatIDR(subtotal)}</span>
            </div>
            <p className="text-ink/50 text-sm">
              Checkout and payment integration is not yet connected — this summary reflects what
              will be sent to fulfillment once payment is wired up.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
