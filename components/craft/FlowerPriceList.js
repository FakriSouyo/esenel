'use client';

/**
 * Daftar rincian harga bunga — port UI "Citations" (beui.dev/components/agents/
 * citations) ke framer-motion (proyek tidak pakai motion/react):
 * header collapsible dengan badge jumlah + chevron, baris masuk satu-satu
 * (stagger + blur), tiap baris: ikon bunga, nama, "per tangkai", harga.
 * Dipakai di section akhir /craft/name setelah tombol CEK HARGA.
 */

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpenText, ChevronDown, Flower2 } from 'lucide-react';
import { flowerBreakdown, formatIDR } from '@/lib/flowerPrices';

const EASE = [0.16, 1, 0.3, 1];

export default function FlowerPriceList({ story, open, onOpenChange }) {
  const breakdown = useMemo(() => flowerBreakdown(story), [story]);

  return (
    <div className="w-full max-w-md text-left text-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange?.(!open)}
        className="group -ml-1 flex min-h-8 w-full items-center gap-2 rounded-lg px-1 text-left text-ink/55 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-earth"
      >
        <BookOpenText className="size-4" />
        <span className="font-medium">Rincian harga bunga</span>
        <span className="rounded-full bg-ink/5 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-ink/55">
          {breakdown.items.length}
        </span>
        <motion.span
          aria-hidden="true"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="ml-auto text-ink/40"
        >
          <ChevronDown className="size-3.5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="price-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-0.5">
              {breakdown.items.map((it, i) => (
                <motion.div
                  layout="position"
                  key={it.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: EASE, delay: 0.05 + i * 0.06 }}
                  className="flex items-center gap-2 rounded-md px-1.5 py-1.5"
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-md bg-meadow/25 text-ink/60">
                    <Flower2 className="size-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink/85">
                      {it.namaResolved || it.nama}
                    </span>
                    <span className="block text-[10px] uppercase tracking-wide text-ink/40">
                      per tangkai · pasar bunga Indonesia
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">
                    {formatIDR(it.harga)}
                  </span>
                </motion.div>
              ))}

              {/* kertas & jasa rangkai */}
              <motion.div
                layout="position"
                key="wrap-fee"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE, delay: 0.05 + breakdown.items.length * 0.06 }}
                className="flex items-center gap-2 rounded-md px-1.5 py-1.5"
              >
                <span className="grid size-5 shrink-0 place-items-center rounded-md bg-sand/50 text-ink/60">
                  <Flower2 className="size-3" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink/85">
                    Kertas &amp; jasa rangkai
                  </span>
                  <span className="block text-[10px] uppercase tracking-wide text-ink/40">
                    biaya tetap
                  </span>
                </span>
                <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">
                  {formatIDR(breakdown.wrapFee)}
                </span>
              </motion.div>

              {/* total */}
              <div className="mt-1 flex items-center justify-between border-t border-ink/10 px-1.5 pt-2.5">
                <span className="text-[12px] font-medium text-ink/55">
                  Total perkiraan
                </span>
                <span className="font-display text-lg tracking-[-0.01em] text-earth">
                  {formatIDR(breakdown.total)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
