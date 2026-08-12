'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import { useCart } from './CartContext';
import { formatIDR } from '@/lib/format';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, subtotal } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-ink/40 z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
          <motion.aside
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-cloud z-[80] flex flex-col shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-sand">
              <h2 className="font-display text-2xl">Your Bag</h2>
              <button
                aria-label="Close cart"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-nav hover:bg-sand/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {items.length === 0 && (
                <p className="text-sm text-ink/60 font-body">Your bag is empty.</p>
              )}
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div
                    className="w-20 h-20 rounded-nav bg-sand/40 bg-cover bg-center shrink-0"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-lg leading-tight">{item.name}</p>
                    {item.craft ? (
                      <div className="text-xs text-ink/60 mt-1 space-y-0.5">
                        <p>{item.craft.size}</p>
                        {item.craft.flowers.map((f) => (
                          <p key={f.name}>
                            {f.name} × {f.qty}
                          </p>
                        ))}
                        <p>Wrapping: {item.craft.wrapping}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-ink/50 mt-1">{item.subtitle}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-sand rounded-pill">
                        <button
                          className="p-1.5"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs w-6 text-center">{item.quantity}</span>
                        <button
                          className="p-1.5"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm">{formatIDR(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-ink/40 hover:text-ink text-xs self-start"
                    aria-label="Remove item"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-sand px-6 py-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink/60">Total</span>
                <span className="font-display text-xl">{formatIDR(subtotal)}</span>
              </div>
              <a
                href="/checkout"
                className="block text-center w-full bg-ink text-cloud py-3.5 rounded-pill text-[13px] tracking-nav font-medium hover:bg-ink/90 transition-colors"
              >
                CHECKOUT
              </a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
