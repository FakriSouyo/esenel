'use client';

/**
 * Daftar rincian harga bunga — port animasi UI "Citations" (beui.dev/
 * components/agents/citations) ke framer-motion (proyek tidak pakai
 * motion/react):
 *  - header collapsible: ikon + judul + badge jumlah + chevron spring;
 *  - baris MASUK SATU-SATU lewat state `visible` (bukan stagger delay statis):
 *    tiap baris baru di-mount, memantul masuk (spring) dan baris yang sudah
 *    ada meluncur turun dengan layout spring (SPRING_LAYOUT);
 *  - tiap baris bunga bisa DIKLIK → detail harga per tangkai dari database
 *    (nama, nama Inggris, harga) muncul sebagai popover kecil inline;
 *  - body collapse direveal dengan clipPath (gaya AgentDisclosure).
 * Dipakai di section akhir /craft/name.
 */

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BookOpenText, ChevronDown, Flower2 } from 'lucide-react';
import { flowerBreakdown, formatIDR, getFlowerPrice } from '@/lib/flowerPrices';

const EASE_OUT = [0.16, 1, 0.3, 1];
const SPRING_SWAP = { type: 'spring', stiffness: 460, damping: 30, mass: 0.55 };
const SPRING_LAYOUT = { type: 'spring', stiffness: 360, damping: 32, mass: 0.6 };

/** Satu baris daftar — masuk dengan spring + layout glide. */
function PriceRow({ children, delay, reduce }) {
  return (
    <motion.div
      layout="position"
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduce
          ? { duration: 0 }
          : {
              opacity: { duration: 0.18, ease: EASE_OUT, delay },
              y: SPRING_LAYOUT,
              layout: SPRING_LAYOUT,
            }
      }
    >
      {children}
    </motion.div>
  );
}

/** Popover kecil detail harga per tangkai dari database bunga. */
function FlowerDetail({ row, reduce }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.22, ease: EASE_OUT }}
      className="overflow-hidden"
    >
      <div className="mb-1.5 ml-7 mr-1.5 mt-1 rounded-lg border border-ink/10 bg-cloud/80 px-3 py-2.5 shadow-[0_10px_30px_-18px_rgba(32,34,30,0.4)]">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[12px] font-medium text-ink">{row.detail.nama}</p>
          <p className="shrink-0 font-display text-sm tracking-[-0.01em] text-earth">
            {formatIDR(row.detail.harga)}
            <span className="ml-1 text-[9px] font-sans font-medium uppercase tracking-[0.14em] text-ink/40">
              / tangkai
            </span>
          </p>
        </div>
        {row.detail.namaEn && (
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-ink/40">
            {row.detail.namaEn}
          </p>
        )}
        <p className="mt-1.5 text-[10px] leading-relaxed text-ink/45">
          {row.detail.matched
            ? 'Perkiraan harga pasar retail florist Indonesia.'
            : 'Belum ada di database — memakai harga pasar default.'}
        </p>
      </div>
    </motion.div>
  );
}

/** Baris-baris rincian + total — muncul satu-satu saat dibuka/di-mount. */
function PriceRows({ breakdown, reduce }) {
  const rows = useMemo(() => {
    const flowerRows = breakdown.items.map((it, i) => {
      const entry = it.matched ? getFlowerPrice(it.nama) : null;
      return {
        key: `flower-${i}`,
        kind: 'flower',
        iconBg: 'bg-meadow/25',
        title: it.namaResolved || it.nama,
        sub: 'per tangkai · pasar bunga Indonesia',
        price: formatIDR(it.harga),
        detail: {
          nama: it.namaResolved || it.nama,
          namaEn: entry?.namaEn || null,
          harga: it.harga,
          matched: it.matched,
        },
      };
    });
    return [
      ...flowerRows,
      {
        key: 'wrap-fee',
        kind: 'wrap',
        iconBg: 'bg-sand/50',
        title: 'Kertas & jasa rangkai',
        sub: 'biaya tetap',
        price: formatIDR(breakdown.wrapFee),
      },
    ];
  }, [breakdown]);

  const [visible, setVisible] = useState(reduce ? rows.length : 0);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (reduce) return;
    const timers = rows.map((_, index) =>
      window.setTimeout(() => setVisible(index + 1), 300 + index * 240),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [reduce, rows]);

  return (
    <div className="grid gap-0.5">
      {rows.slice(0, visible).map((row, i) => {
        const open = openId === row.key;
        const toggle = () => setOpenId(open ? null : row.key);
        const chevron = (
          <motion.span
            aria-hidden="true"
            animate={{ rotate: open ? 180 : 0 }}
            transition={reduce ? { duration: 0 } : SPRING_SWAP}
            className="shrink-0 text-ink/25 transition-colors group-hover/row:text-ink/50"
          >
            <ChevronDown className="size-3.5" />
          </motion.span>
        );
        return (
          <PriceRow key={row.key} delay={0.02 + i * 0.02} reduce={reduce}>
            <div className="w-full">
              {row.kind === 'flower' ? (
                <button
                  type="button"
                  onClick={toggle}
                  aria-expanded={open}
                  className="group/row flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left outline-none transition-colors hover:bg-ink/[0.04] focus-visible:ring-2 focus-visible:ring-earth"
                >
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-md text-ink/60 ${row.iconBg}`}
                  >
                    <Flower2 className="size-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink/85">
                      {row.title}
                    </span>
                    <span className="block text-[10px] uppercase tracking-wide text-ink/40">
                      {row.sub}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">
                    {row.price}
                  </span>
                  {chevron}
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-md px-1.5 py-1.5">
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-md text-ink/60 ${row.iconBg}`}
                  >
                    <Flower2 className="size-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink/85">
                      {row.title}
                    </span>
                    <span className="block text-[10px] uppercase tracking-wide text-ink/40">
                      {row.sub}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">
                    {row.price}
                  </span>
                </div>
              )}
              <AnimatePresence initial={false}>
                {open && <FlowerDetail row={row} reduce={reduce} />}
              </AnimatePresence>
            </div>
          </PriceRow>
        );
      })}

      {/* total — muncul terakhir, ikut layout glide */}
      {visible === rows.length && (
        <PriceRow delay={0.02 + rows.length * 0.02} reduce={reduce}>
          <div className="flex w-full items-center justify-between border-t border-ink/10 px-1.5 pt-2.5">
            <span className="text-[12px] font-medium text-ink/55">Total perkiraan</span>
            <span className="font-display text-lg tracking-[-0.01em] text-earth">
              {formatIDR(breakdown.total)}
            </span>
          </div>
        </PriceRow>
      )}
    </div>
  );
}

export default function FlowerPriceList({ story, open, onOpenChange }) {
  const reduce = useReducedMotion() ?? false;
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
          transition={reduce ? { duration: 0 } : SPRING_SWAP}
          className="ml-auto text-ink/40"
        >
          <ChevronDown className="size-3.5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="price-list"
            initial={{ height: 0, opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ height: 'auto', opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ height: 0, opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            transition={reduce ? { duration: 0 } : { duration: 0.3, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="mt-1">
              <PriceRows breakdown={breakdown} reduce={reduce} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
