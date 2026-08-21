'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sprout } from 'lucide-react';
import { fetchSubmittedBouquets } from '@/lib/supabase';

/**
 * Community gallery — a grid of bouquets visitors have saved on /craft.
 * Each card shows the bouquet's image + name + maker; clicking opens a
 * detail modal (bouquet name, maker, flowers, size, wrapping).
 */
export function BouquetGallery() {
  const [items, setItems] = useState(null); // null = loading
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchSubmittedBouquets({ limit: 24 })
      .then((rows) => alive && setItems(rows))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, []);

  // No data / backend not reachable → render nothing (page still works).
  if (items && items.length === 0) return null;
  if (!items) {
    return (
      <section className="bg-cloud pt-8 md:pt-10">
        <div className="container-esenel">
          <div className="mx-auto max-w-3xl animate-pulse space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-ink/[0.04]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-cloud pt-14 pb-20 md:pt-20 md:pb-24">
      <div className="container-esenel">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <p className="mb-3 text-[12px] tracking-[0.2em] font-medium text-ink/40">
              FROM OUR CUSTOMERS
            </p>
            <h2 className="font-display text-3xl md:text-4xl">Bouquets people made</h2>
            <p className="mt-3 text-sm text-ink/55">
              Saved from the craft table — name yours and it appears here too.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
            {items.map((b, i) => (
              <motion.button
                key={b.id ?? `${b.bouquet_name}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}
                onClick={() => setSelected(b)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-sand bg-white text-left shadow-[0_6px_20px_rgba(32,34,30,0.05)] transition-all hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-[0_12px_32px_rgba(32,34,30,0.1)]"
              >
                <div className="aspect-square w-full bg-cloud">
                  {b.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={b.image_url}
                      alt={b.bouquet_name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink/20">
                      <Sprout size={40} />
                    </div>
                  )}
                </div>
                <div className="px-3.5 py-3">
                  <p className="font-display text-base leading-tight text-ink">{b.bouquet_name}</p>
                  <p className="mt-0.5 text-[11px] text-ink/45">by {b.maker_name || 'Anonymous'}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {selected && <BouquetDetail item={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function BouquetDetail({ item, onClose }) {
  const flowers = Array.isArray(item.flowers) ? item.flowers : [];
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={item.bouquet_name}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(ev) => ev.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="relative aspect-square w-full bg-cloud">
          {item.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={item.image_url} alt={item.bouquet_name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink/20">
              <Sprout size={48} />
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/85 text-ink/60 shadow backdrop-blur transition-colors hover:bg-white hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <h3 className="font-display text-2xl text-ink">{item.bouquet_name}</h3>
          <p className="mt-1 text-sm text-ink/50">by {item.maker_name || 'Anonymous'}</p>

          {(item.size || item.wrapping) && (
            <p className="mt-2 text-[12px] text-ink/45">
              {item.size && <span className="mr-2">{item.size}</span>}
              {item.wrapping && <span>{item.wrapping}</span>}
            </p>
          )}

          {flowers.length > 0 && (
            <div className="mt-4 border-t border-sand/70 pt-4">
              <p className="mb-2 text-[11px] tracking-[0.16em] uppercase text-ink/40">Flowers</p>
              <div className="flex flex-wrap gap-1.5">
                {flowers.map((f) =>
                  f?.name ? (
                    <span
                      key={`${f.name}-${f.qty}`}
                      className="rounded-pill border border-ink/10 bg-cloud px-3 py-1 text-[12px] text-ink/70"
                    >
                      {f.name}
                      {f.qty > 1 ? <span className="text-ink/40"> ×{f.qty}</span> : null}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          )}

          <div className="mt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center rounded-pill bg-ink py-3 text-[13px] font-medium tracking-nav text-cloud transition-colors hover:bg-ink/90"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}