'use client';

import { motion } from 'framer-motion';
import { craftWrappings } from '@/data/flowers';

// Deterministic pseudo-random layout so the preview doesn't jitter on re-render
function seededOffset(seed, i) {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function BouquetPreview({ selectedFlowers, wrappingId }) {
  const wrapping = craftWrappings.find((w) => w.id === wrappingId) || craftWrappings[0];

  const stems = [];
  selectedFlowers.forEach((f, fi) => {
    for (let i = 0; i < f.qty; i++) {
      stems.push({ ...f, key: `${f.id}-${i}`, seed: fi * 7 + i });
    }
  });

  return (
    <div className="relative aspect-square overflow-hidden rounded-[28px] border border-sand bg-[linear-gradient(180deg,#FDFDFB_0%,#F2F0E9_100%)]">
      {/* soft warm glow behind the bouquet */}
      <div className="absolute inset-0 bg-[radial-gradient(58%_46%_at_50%_44%,rgba(182,197,168,0.4),transparent_70%)]" />

      {/* wrapping cone */}
      <div className="absolute bottom-0 left-1/2 w-[74%] -translate-x-1/2" style={{ height: '46%' }}>
        <div
          className="absolute inset-0 rounded-t-[90px] rounded-b-[16px] shadow-[inset_0_-16px_28px_rgba(0,0,0,0.12)]"
          style={{ backgroundColor: wrapping.hex }}
        />
        {/* paper folds */}
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute left-[14%] top-0 h-full w-px origin-top rotate-[17deg] bg-ink/10" />
          <div className="absolute left-[38%] top-0 h-full w-px origin-top rotate-[-10deg] bg-ink/10" />
          <div className="absolute left-[62%] top-0 h-full w-px origin-top rotate-[12deg] bg-ink/10" />
          <div className="absolute left-[85%] top-0 h-full w-px origin-top rotate-[-16deg] bg-ink/10" />
        </div>
        {/* ribbon band */}
        <div className="absolute -top-1 left-[-6%] h-6 w-[112%] rounded-full bg-[#23301F]/85 shadow-sm" />
        <div className="absolute -top-1 left-[-6%] h-6 w-[112%] rounded-full bg-gradient-to-b from-white/25 to-transparent" />
        {/* ribbon bow hint */}
        <div className="absolute -top-3 right-[16%] flex items-end gap-[3px]">
          <span className="h-5 w-3 -rotate-12 rounded-sm bg-[#23301F]/80" />
          <span className="h-6 w-3 rotate-12 rounded-sm bg-[#23301F]/80" />
        </div>
      </div>

      {/* stems + flowers */}
      <div className="relative h-full w-full">
        {stems.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center text-sm text-ink/35"
          >
            Choose flowers to build your bouquet
          </motion.p>
        )}
        {stems.map((stem, i) => {
          const rand1 = seededOffset(stem.seed, 1);
          const rand2 = seededOffset(stem.seed, 2);
          const rand3 = seededOffset(stem.seed, 3);
          const left = 28 + rand1 * 44; // 28–72%
          const bottom = 26 + rand2 * 26; // 26–52%
          const rotate = -18 + rand3 * 36; // -18–18deg
          const depth = (bottom - 26) / 26; // 0–1, farther flowers are higher
          const size = 56 + Math.round(depth * 14); // px
          return (
            <motion.div
              key={stem.key}
              initial={{ opacity: 0, y: 20, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              className="absolute"
              style={{ left: `${left}%`, bottom: `${bottom}%`, zIndex: Math.round(bottom) }}
            >
              {/* stem */}
              <span
                className="absolute left-1/2 w-[2.5px] -translate-x-1/2 rounded-full bg-[#5d6b53]/55"
                style={{ bottom: '-10%', height: '150%' }}
              />
              {/* flower head */}
              <span
                className="block rounded-full border-2 border-white bg-cover bg-center shadow-md"
                style={{
                  width: size,
                  height: size,
                  backgroundImage: `url(${stem.image})`,
                  transform: `rotate(${rotate}deg)`,
                }}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
