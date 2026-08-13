'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import GradualBlur from '@/components/effects/GradualBlur';
import SmartVideo from '@/components/effects/SmartVideo';

export default function Hero() {
  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden flex items-center justify-center">
      {/* Dark backdrop behind the video while its first frame loads —
          no white flash / stuck-black-box during the initial download. */}
      <div className="absolute inset-0 bg-[#14180f]" aria-hidden="true" />
      <SmartVideo
        className="absolute inset-0 w-full h-full object-cover"
        src="/hero-section.mp4"
        srcMobile="/hero-section-mobile.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/5 to-ink/40" />

      {/* Gradual blur — blends the hero into the next section on scroll */}
      <GradualBlur
        position="bottom"
        height="4rem"
        strength={1.5}
        divCount={4}
        curve="ease-out"
        zIndex={5}
      />


      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center px-6"
      >
        <p className="text-cloud/85 text-[13px] tracking-[0.3em] font-medium mb-4 uppercase">
          Fleur Atelier
        </p>
        <h1 className="font-display text-cloud text-[15vw] leading-[0.9] sm:text-[10vw] lg:text-[7.5vw]">
          ESENEL
        </h1>
        <p className="font-body text-cloud/90 text-lg sm:text-xl mt-5 max-w-md mx-auto leading-relaxed">
          Fresh flowers, thoughtfully arranged — for every feeling, every moment.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/craft"
            className="bg-cloud text-ink px-8 py-3.5 rounded-pill text-[13px] font-medium tracking-nav hover:bg-cloud/90 transition-colors"
          >
            START CRAFTING
          </Link>
          <Link
            href="/shop"
            className="border border-cloud/60 text-cloud px-8 py-3.5 rounded-pill text-[13px] font-medium tracking-nav hover:bg-cloud/10 transition-colors"
          >
            EXPLORE
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
