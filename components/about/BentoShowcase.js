'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

/**
 * BentoShowcase — a Skiper29 ("Siena parallax") cinematic section.
 *
 * - A full-bleed image drifts down (y 0% → 30%) as you scroll through it.
 * - A video sits inside an ORGANIC SVG mask (clip-path). The masked block
 *   scales down (1 → 0.7) while an inner poster scales up (1 → 1.3), giving
 *   the depth motion of the reference. A play button toggles the clip.
 * - Oversized text rows + the bento grid close the section.
 *
 * Adapted from https://skiper-ui.com/v1/skiper29 (Skiper UI, Pro).
 */

// Organic mask from the reference (1836×1053 viewBox → objectBoundingBox).
const MASK_PATH =
  'M457.525 1.148c-20.789-3.198-193.979 1.16-283.854 2.496 11.104-.178 1.297-2.868-81.146-2.496-103.5.468-86 102.499-86 109.999s-7 524.5-6.5 547.5 10 59 6.5 99c-2.8 32-1.167 234.667 0 332.003.5 75 62.5 66.5 67 68.5s38.5 0 81.5 0 436 6 526 10.5 438.995-.5 505.495 0 330.01-12.5 417.51-12.5 230.99 2 270.99 0 40.5-16 51-31.5 12.5-61 12.5-105.5c0-44.503 7.01-274.504 7.01-348.004s-3.51-159.998-7.01-230.998 0-256.002 0-318.002 7.01-92.998-22.5-110.999c-18.79-11.471-81.99-9.999-133.49-9.999H853.525c-29 0-370 4-396 0Z';

const ROWS = ['Cut same day.', 'Arranged by hand.', 'Delivered by us.'];

export default function BentoShowcase() {
  const heroRef = useRef(null);
  const videoBlockRef = useRef(null);
  const videoElRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // Parallax: the top image drifts down as the section scrolls through.
  const { scrollYProgress: heroP } = useScroll({
    target: heroRef,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(heroP, [0.55, 1], ['0%', '30%']);

  // Masked video block: container scales down while the poster scales up.
  const { scrollYProgress: videoP } = useScroll({
    target: videoBlockRef,
    offset: ['start end', 'end start'],
  });
  const blockScale = useTransform(videoP, [0, 1], [1, 0.7]);
  const posterScale = useTransform(videoP, [0, 1], [1, 1.35]);

  const togglePlay = () => {
    const v = videoElRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section className="bg-white">
      {/* organic mask definition (kept once, referenced by clip-path) */}
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <clipPath id="esenel-mask" clipPathUnits="objectBoundingBox">
            <path d={MASK_PATH} transform="scale(0.0005139987561, 0.0008543065594)" />
          </clipPath>
        </defs>
      </svg>

      {/* ── 1. parallax hero image ── */}
      <div ref={heroRef} className="relative h-[62vh] overflow-hidden md:h-[75vh]">
        <motion.div style={{ y }} className="absolute inset-x-0 -top-[10%] h-[120%]">
          <Image
            src="https://images.unsplash.com/photo-1487070183336-b863922373d4?q=80&w=2000&auto=format&fit=crop"
            alt="Hand-tied bouquets on the atelier table"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <div className="absolute bottom-6 left-6 flex items-center gap-3 text-cloud md:bottom-10 md:left-10">
          <span className="size-2 rounded-full bg-earth" />
          <span className="text-[11px] uppercase tracking-[0.22em] md:text-xs">
            The atelier in motion
          </span>
        </div>
      </div>

      {/* ── 2. title ── */}
      <div className="container-esenel py-16 text-center md:py-24">
        <p className="text-[12px] font-medium tracking-[0.2em] text-earth">THE ESENEL PROCESS</p>
        <h2 className="mt-4 font-display text-4xl leading-[1.05] md:text-6xl">
          From soil to table.
        </h2>
      </div>

      {/* ── 3. masked video ── */}
      <div className="flex justify-center px-3 md:px-0">
        <motion.div
          ref={videoBlockRef}
          style={{ scale: blockScale, clipPath: 'url(#esenel-mask)' }}
          className="relative aspect-video w-full overflow-hidden lg:w-[85%]"
        >
          {/* subtle dark scrim */}
          <div className="absolute inset-0 z-20 bg-ink/10" />

          {/* poster — scales up (Ken Burns) for depth while the block shrinks */}
          <motion.div style={{ scale: posterScale }} className="absolute inset-0 z-10">
            <Image
              src="/vase.jpg"
              alt="An ESENEL arrangement"
              fill
              sizes="(min-width: 1024px) 85vw, 100vw"
              className="object-cover"
            />
          </motion.div>

          {/* video — plays on demand, sits above the poster */}
          <video
            ref={videoElRef}
            src="/banner.mp4"
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 z-30 h-full w-full object-cover"
          />

          {/* play / pause */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Pause video' : 'Play video'}
            className="absolute left-1/2 top-1/2 z-40 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cloud/90 text-ink shadow-[0_12px_32px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-transform hover:scale-105 md:size-20"
          >
            {playing ? (
              <Pause size={22} strokeWidth={1.8} className="translate-x-px" />
            ) : (
              <Play size={22} strokeWidth={1.8} className="translate-x-0.5" />
            )}
          </button>
        </motion.div>
      </div>

      {/* ── 4. oversized text rows ── */}
      <div className="mx-auto mt-20 w-full max-w-[1240px] px-6 md:mt-28">
        {ROWS.map((row, i) => (
          <div
            key={row}
            className={`flex items-center justify-center gap-4 py-5 md:py-7 ${
              i === ROWS.length - 1 ? 'border-b' : 'border-b'
            } border-ink/10`}
          >
            <span className="text-[10px] tracking-[0.2em] text-earth/70">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="font-display text-3xl leading-none tracking-tight md:text-6xl">
              {row}
            </h3>
          </div>
        ))}
      </div>

    </section>
  );
}
