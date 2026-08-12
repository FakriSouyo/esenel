'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const glassIconVariants = {
  closed: { rotate: 0 },
  open: { rotate: 45 },
};

const spring = { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 };
const bounce = { type: 'spring', stiffness: 340, damping: 24, mass: 0.85 };

export default function FaqAccordion({ items }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={`rounded-2xl border transition-all duration-500 ${
              isOpen
                ? 'border-ink/15 bg-white/70 shadow-[0_10px_40px_-18px_rgba(32,34,30,0.18)]'
                : 'border-ink/8 bg-white/50 hover:bg-white/70'
            }`}
          >
            <button
              className="flex w-full items-center gap-4 px-5 py-5 text-left md:px-6"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
            >
              {/* Glassmorphism icon */}
              <motion.span
                animate={glassIconVariants[isOpen ? 'open' : 'closed']}
                transition={bounce}
                className="relative grid size-10 shrink-0 place-items-center rounded-full border border-white/60 bg-white/50 shadow-[0_2px_12px_-4px_rgba(32,34,30,0.15)] backdrop-blur-md"
              >
                <Plus
                  size={17}
                  strokeWidth={2}
                  className={`transition-colors duration-300 ${
                    isOpen ? 'text-ink' : 'text-ink/60'
                  }`}
                />
              </motion.span>

              <span
                className={`flex-1 font-display text-lg leading-snug transition-colors duration-300 md:text-xl ${
                  isOpen ? 'text-ink' : 'text-ink/80'
                }`}
              >
                {item.q}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={spring}
                  className="overflow-hidden"
                >
                  <p className="pb-6 pl-[92px] pr-6 text-[14px] leading-relaxed text-ink/65 md:pr-10">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}