'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Scissors, Sparkles, HeartHandshake, Truck, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * FromTheGarden
 * Storytelling section — a sticky card deck where each chapter slides up,
 * pins itself, and earlier chapters shrink behind it as you scroll.
 *
 * Built on the pattern from Skiper UI's "Card stack scroll" (skiper16,
 * https://skiper-ui.com/v1/skiper16): framer-motion useScroll + CSS
 * position:sticky + Lenis smooth scrolling. No GSAP ScrollTrigger, no
 * pin-spacer — so it can never fight Lenis and cause layout jumps.
 * Free to use with attribution to Skiper UI.
 */

const CARDS = [
  {
    id: 1,
    icon: Scissors,
    step: '01',
    title: 'Chosen by hand.',
    body: 'Every stem is picked for shape and character — never for uniformity. The way a gardener would choose for their own table.',
    bg: 'bg-white border border-ink/10',
    text: 'text-ink',
    soft: 'text-ink/70',
    chip: 'bg-sand/50',
    rail: 'bg-ink',
  },
  {
    id: 2,
    icon: Sparkles,
    step: '02',
    title: 'Arranged with restraint.',
    body: 'We work only with what is in season, and stop while the composition still breathes. No two bouquets are ever quite the same.',
    bg: 'bg-[#23301F]',
    text: 'text-cloud',
    soft: 'text-cloud/80',
    chip: 'bg-white/10 border border-white/20',
    rail: 'bg-cloud',
  },
  {
    id: 3,
    icon: HeartHandshake,
    step: '03',
    title: 'Finished with care.',
    body: 'Cut close to delivery and wrapped gently — because the last mile is part of the flower, too.',
    bg: 'bg-white border border-ink/10',
    text: 'text-ink',
    soft: 'text-ink/70',
    chip: 'bg-sand/50',
    rail: 'bg-ink',
    image: true,
    imageSrc:
      'https://images.unsplash.com/photo-1487530811176-3780de880c2d?q=80&w=1000&auto=format&fit=crop',
    imageAlt: 'A carefully finished arrangement',
  },
  {
    id: 4,
    icon: Truck,
    step: '04',
    title: 'Arrives on your schedule.',
    body: 'Choose the window that suits you at checkout. We arrive on time, every time — fresh, and ready to be remembered.',
    bg: 'bg-black',
    text: 'text-cloud',
    soft: 'text-cloud/75',
    chip: 'bg-white/10 border border-white/20',
    rail: 'bg-cloud',
    cta: { label: 'START CRAFTING', href: '/craft' },
  },
];

function StoryCard({ card, total, isImage }) {
  return (
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden rounded-[28px] ${card.bg} ${card.text} shadow-2xl`}
    >
      {/* watermark step number */}
      <span className="pointer-events-none absolute -top-5 right-2 select-none font-display text-[110px] leading-none opacity-10 md:text-[140px]">
        {card.step}
      </span>

      <div className={`flex h-full flex-col ${isImage ? 'md:grid md:grid-cols-2' : ''}`}>
        <div className="relative flex h-full flex-col justify-between gap-8 p-7 md:p-10 lg:p-12">
          {/* backstory rail — chapter progress */}
          <div className="absolute left-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 md:left-6">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i + 1 <= card.id ? `${card.rail} opacity-90` : `${card.rail} opacity-25`
                }`}
              />
            ))}
          </div>

          <div className="pl-8 md:pl-10">
            {/* animated icon + step */}
            <div className="flex items-center justify-between">
              <motion.span
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className={`grid size-14 place-items-center rounded-full backdrop-blur-sm md:size-16 ${card.chip}`}
              >
                <card.icon size={26} strokeWidth={1.5} />
              </motion.span>
              <span className={`text-[11px] font-medium tracking-[0.2em] ${card.soft}`}>
                STEP {card.step} / 0{total}
              </span>
            </div>
          </div>

          {/* the story */}
          <div className="pl-8 md:pl-10">
            <h3 className={`font-display text-2xl leading-[1.1] md:text-4xl lg:text-[2.6rem] ${card.text}`}>
              {card.title}
            </h3>
            <p className={`mt-3 max-w-md text-sm leading-relaxed md:text-base ${card.soft}`}>
              {card.body}
            </p>
            {card.cta && (
              <Link
                href={card.cta.href}
                className="mt-6 inline-flex items-center gap-2 rounded-pill bg-cloud px-6 py-3 text-[13px] font-medium tracking-nav text-ink transition-colors hover:bg-cloud/90"
              >
                {card.cta.label}
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {isImage && card.imageSrc && (
          <div className="relative h-48 md:h-full">
            <Image
              src={card.imageSrc}
              alt={card.imageAlt || card.title}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CardStackItem({ i, total, card, progress }) {
  const targetScale = Math.max(0.5, 1 - (total - i - 1) * 0.1);
  const scale = useTransform(progress, [0.25 * i, 1], [1, targetScale]);

  return (
    <div
      className="sticky top-[10vh] flex w-full justify-center px-4 sm:px-6 lg:px-10"
      style={{ zIndex: i }}
    >
      <motion.div
        style={{ scale }}
        className="relative h-[58vh] w-full max-w-2xl origin-top md:h-[64vh] lg:max-w-3xl"
      >
        <StoryCard card={card} total={total} isImage={!!card.image} />
      </motion.div>
    </div>
  );
}

export default function FromTheGarden() {
  const deckRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: deckRef, offset: ['start start', 'end end'] });

  return (
    <section className="bg-white">
      <div className="container-esenel">
        <p className="text-[12px] tracking-[0.2em] font-medium text-earth mb-4">FROM THE GARDEN</p>
        <h2 className="max-w-2xl font-display text-3xl leading-[1.08] md:text-5xl">
          Some flowers are meant to be remembered.
        </h2>
        <p className="mt-5 max-w-lg leading-relaxed text-ink/60">
          Every ESENEL arrangement follows the same quiet path — from the garden to your door.
          Scroll to walk it with us.
        </p>
      </div>

      <div ref={deckRef} style={{ position: 'relative' }} className="flex flex-col items-center pt-[10vh] pb-[70vh]">
        {CARDS.map((card, i) => (
          <CardStackItem key={card.id} i={i} total={CARDS.length} card={card} progress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
