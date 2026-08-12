'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import PixelSnow from '@/components/effects/PixelSnow';

export default function BannerSection() {
  return (
    <section className="relative h-[280px] md:h-[340px] w-full overflow-hidden bg-white">
      <div className="absolute inset-0">
        <PixelSnow
          color="#fdadef"
          pixelResolution={420}
          speed={1.25}
          density={0.35}
          farPlane={12}
          depthFade={5}
          brightness={1.2}
          variant="square"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6"
      >
        <p className="text-ink/70 text-[12px] tracking-[0.3em] font-semibold mb-3 uppercase">
          Fleur Atelier
        </p>
        <h2 className="font-display text-ink text-[7.5vw] sm:text-3xl md:text-4xl sm:whitespace-nowrap leading-[1.1]">
          Every bloom, perfectly placed.
        </h2>
        <p className="text-ink/80 mt-4 max-w-md leading-relaxed text-sm md:text-base">
          Thoughtfully arranged flowers for the moments that matter.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block bg-ink text-cloud px-8 py-3.5 rounded-pill text-[13px] font-semibold tracking-nav hover:bg-ink/90 transition-colors"
        >
          SHOP THE COLLECTION
        </Link>
      </motion.div>
    </section>
  );
}
