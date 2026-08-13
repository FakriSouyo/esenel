'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * RollingWords — a Skiper88-style 3D word roller.
 *
 * The atelier's principles are arranged in a ring (each word rotated
 * `-180/n * i` around the X axis, pushed forward with translateZ). The whole
 * ring is sticky in a 300vh section and rolls around the X axis as you
 * scroll (-73° → 242°), so phrases pass through the front of the circle.
 *
 * Adapted from https://skiper-ui.com/v1/skiper88 (Skiper UI, Pro).
 */
const WORDS = [
  'Grown in Sleman.',
  'Picked in season.',
  'Arranged by hand.',
  'Cut the same day.',
  'Kept a little wild.',
  'Never twice alike.',
  'One worktable.',
  'Restraint, always.',
  'Delivered by us.',
  'Bloom as it is.',
  'Rooted, not rushed.',
  "That's the point.",
];

export default function RollingWords() {
  const ref = useRef(null);

  // Scroll progress through the whole 300vh section drives the ring.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [-73, 242]);

  return (
    <section ref={ref} className="relative h-[300vh] bg-[#23301F] text-cloud">
      {/* hint */}
      <div className="absolute left-1/2 top-[8%] z-10 -translate-x-1/2 text-center">
        <span className="text-[11px] uppercase tracking-[0.22em] text-cloud/45">
          Scroll — the quiet rules
        </span>
      </div>

      <div
        className="sticky top-0 flex h-screen items-center justify-center"
        style={{ perspective: '500px' }}
      >
        <motion.ul
          className="relative w-full"
          style={{ transformStyle: 'preserve-3d', rotateX }}
        >
          {WORDS.map((w, i) => (
            <li
              key={w}
              className="absolute left-1/2 top-1/2 flex items-center justify-center whitespace-nowrap px-4 text-center font-display text-3xl tracking-tight text-cloud sm:text-4xl md:text-5xl"
              style={{
                // translate(-50%, -50%) keeps every word centered on the ring;
                // backface-visibility hides the words on the far side.
                transform: `translate(-50%, -50%) rotateX(${(-180 / WORDS.length) * i}deg) translateZ(150px)`,
                transformStyle: 'preserve-3d',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
              }}
            >
              {w}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
