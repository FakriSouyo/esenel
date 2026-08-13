'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * CollectionGallery — hover-expand gallery.
 *
 * Adapted from Skiper UI's "Hover expand" (skiper35,
 * https://skiper-ui.com/v1/skiper35): a row of slim panels whose labels are
 * rotated 90° on desktop. Hovering (desktop) or tapping (mobile) opens a
 * panel with a spring-like ease, revealing the collection photo, tagline,
 * item count and an EXPLORE link.
 *
 * Layout is driven by CSS (md: classes + width/height transitions) instead
 * of JS media queries or framer width animation — so there is no hydration
 * flash and it works reliably on every viewport.
 */

const EASE = 'ease-[cubic-bezier(0.16,1,0.3,1)]';

export default function CollectionGallery({ collections }) {
  const [active, setActive] = useState(0);

  return (
    <section className="w-full bg-[#23301F] text-cloud md:h-[72vh] md:overflow-hidden">
      <div className="flex w-full flex-col md:mx-auto md:h-full md:max-w-[1600px] md:flex-row">
        {collections.map((c, i) => {
          const expanded = active === i;

          return (
            <div
              key={c.slug}
              role="button"
              tabIndex={0}
              aria-expanded={expanded}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActive(i);
                }
              }}
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              className={`relative w-full cursor-pointer select-none overflow-hidden transition-[width,height] duration-500 ${EASE} ${
                expanded
                  ? 'h-[52vh] md:h-full md:w-[38%]'
                  : 'h-[4.5rem] md:h-full md:w-[12.4%]'
              }`}
            >
              {/* label — horizontal on mobile, rotated along the edge on desktop */}
              <div
                className={`absolute left-5 top-4 z-20 flex items-center gap-3 transition-colors duration-300 md:bottom-auto md:left-[1.2vw] md:top-1/2 md:-translate-y-1/2 md:origin-[0_50%] md:-rotate-90 ${
                  expanded ? 'text-cloud' : 'text-cloud/35'
                }`}
              >
                <p className="whitespace-nowrap font-display text-lg leading-none tracking-[-0.02em] md:text-[1.8vw]">
                  {c.copy.title}
                </p>
                <span
                  className={`text-[10px] font-medium tracking-[0.16em] text-cloud/60 transition-all duration-300 ${
                    expanded ? 'opacity-100' : 'pointer-events-none -translate-x-2 opacity-0'
                  }`}
                >
                  {c.count} {c.count === 1 ? 'PIECE' : 'PIECES'}
                </span>
              </div>

              {/* photo — fades in when the panel is open */}
              <div
                className={`absolute inset-0 transition-opacity duration-500 ${EASE} ${
                  expanded ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="absolute inset-3 top-14 md:inset-4 md:left-[4.6vw]">
                  <Image
                    src={`/${c.slug}.jpg`}
                    alt={c.copy.title}
                    fill
                    sizes="(min-width: 768px) 40vw, 100vw"
                    className="rounded-[18px] object-cover"
                  />
                </div>

                {/* info overlay */}
                <div
                  className={`absolute bottom-3 left-3 right-3 transition-all duration-500 ${EASE} ${
                    expanded
                      ? 'translate-y-0 opacity-100'
                      : 'pointer-events-none translate-y-3 opacity-0'
                  } md:bottom-4 md:left-4 md:right-4`}
                >
                  <div className="flex items-end justify-between gap-4 rounded-[18px] bg-ink/55 p-4 backdrop-blur-md md:p-5">
                    <div>
                      <p className="font-display text-xl leading-tight md:text-2xl">
                        {c.copy.title}
                      </p>
                      <p className="mt-1 text-[13px] text-cloud/70">{c.copy.tagline}</p>
                    </div>
                    <Link
                      href={`/collections/${c.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex shrink-0 items-center gap-2 rounded-pill bg-cloud px-5 py-2.5 text-[12px] font-medium tracking-nav text-ink transition-colors hover:bg-cloud/90"
                    >
                      EXPLORE
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
