'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Flower2,
  Sparkles,
  Leaf,
  CalendarClock,
  MessageCircle,
  Shuffle,
  Droplets,
} from 'lucide-react';

/**
 * BouncyAccordion
 * Spring-animated accordion where the open item pops out of the column with
 * a bouncy gap, and its two neighbours round the adjacent corners — the
 * "bouncy accordion" interaction from Skiper UI (skiper103,
 * https://skiper-ui.com/v1/skiper103).
 *
 * Adapted to ESENEL's design system (light background, ink/earth palette,
 * lucide icons instead of the original Nucleo glass SVGs). Free to use with
 * attribution to Skiper UI.
 */

const ICONS = {
  flower: <Flower2 size={20} strokeWidth={1.75} />,
  sparkles: <Sparkles size={20} strokeWidth={1.75} />,
  leaf: <Leaf size={20} strokeWidth={1.75} />,
  calendar: <CalendarClock size={20} strokeWidth={1.75} />,
  message: <MessageCircle size={20} strokeWidth={1.75} />,
  shuffle: <Shuffle size={20} strokeWidth={1.75} />,
  droplets: <Droplets size={20} strokeWidth={1.75} />,
};

const spring = { type: 'spring', stiffness: 300, damping: 20 };

export default function BouncyAccordion({ items, defaultOpen = 0, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      onClick={() => setOpen(null)}
      className={`flex w-full select-none flex-col items-center ${className}`}
    >
      <div className="mb-8 grid content-start justify-items-center gap-4 text-center">
        <span className="relative max-w-[16ch] text-[11px] uppercase leading-tight tracking-[0.2em] text-earth/60 after:absolute after:left-1/2 after:top-full after:h-8 after:w-px after:bg-gradient-to-b after:from-earth/50 after:to-transparent after:content-['']">
          Click on items to expand
        </span>
      </div>

      <ul className="w-full">
        {items.map((item, i) => {
          const isOpen = open === i;
          const last = i === items.length - 1;
          return (
            <motion.li
              key={item.q}
              initial={false}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(isOpen ? null : i);
              }}
              animate={{
                marginBlock: isOpen ? '12px' : '0px',
                height: isOpen ? 'auto' : '76px',
                borderTopLeftRadius:
                  i === 0 || isOpen || (open !== null && i === open + 1) ? 20 : 0,
                borderTopRightRadius:
                  i === 0 || isOpen || (open !== null && i === open + 1) ? 20 : 0,
                borderBottomRightRadius:
                  last || isOpen || (open !== null && i === open - 1) ? 20 : 0,
                borderBottomLeftRadius:
                  last || isOpen || (open !== null && i === open - 1) ? 20 : 0,
              }}
              transition={spring}
              className="relative cursor-pointer overflow-hidden border border-sand/70 bg-white hover:bg-white/70"
            >
              <div className="flex h-fit items-center gap-3 pl-5 pr-12 pt-4">
                {item.icon && <span className="text-earth">{ICONS[item.icon]}</span>}
                <span className="font-display text-lg leading-snug tracking-tight text-ink/85">
                  {item.q}
                </span>
                <ChevronDown
                  size={18}
                  className={`absolute right-5 text-ink/40 transition-all ease-in-out ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.p
                    initial={{ opacity: 0, filter: 'blur(2px)' }}
                    animate={{ opacity: 0.65, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(2px)' }}
                    className="px-5 pb-5 pt-2 text-sm leading-relaxed text-ink/70 md:text-[15px]"
                  >
                    {item.a}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
