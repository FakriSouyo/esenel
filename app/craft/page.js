import Link from 'next/link';
import { Sprout, ArrowRight } from 'lucide-react';
import CraftBuilder from '@/components/craft/CraftBuilder';
import { BouquetGallery } from '@/components/craft/BouquetGallery';

import { ogImage } from '@/lib/site';

export const metadata = {
  title: 'Craft — ESENEL',
  description: 'A bouquet from a name — your own flower story.',
  openGraph: {
    title: 'Craft — ESENEL',
    description: 'A bouquet from a name — your own flower story.',
    images: [ogImage('craft')],
  },
};

const stats = [
  { value: '03', label: 'Sizes' },
  { value: '05', label: 'Flowers' },
  { value: '04', label: 'Wrappings' },
  { value: '100%', label: 'Made by hand' },
];

export default function CraftPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[#23301F] pb-20 pt-36 text-cloud md:pb-24 md:pt-44">
        {/* soft radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_50%_0%,rgba(182,197,168,0.22),transparent_70%)]" />
        {/* oversized watermark */}
        <span className="pointer-events-none absolute -right-6 top-6 select-none font-display text-[22vw] leading-none text-cloud/[0.04] md:text-[16vw]">
          CRAFT
        </span>

        <div className="container-esenel relative">
          <p className="mb-5 text-[12px] tracking-[0.2em] font-medium text-cloud/60">
            THE CRAFT TABLE
          </p>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.08] md:text-6xl">
            Build a bouquet that feels like&nbsp;them.
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-cloud/75">
            Pick your size, your flowers, your wrapping — we compose it by hand at the atelier and
            deliver it fresh, ready to be remembered.
          </p>

          <div className="mt-12 grid max-w-xl grid-cols-2 gap-y-8 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl md:text-4xl text-cloud">{s.value}</p>
                <p className="mt-1 text-[11px] tracking-[0.14em] uppercase text-cloud/50">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cloud pt-16 md:pt-24">
        <div className="container-esenel">
          {/* Banner “a bouquet from a name” — same width as the steps below */}
          <div className="mx-auto max-w-3xl">
            <Link
              href="/craft/name"
              className="group flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white/70 px-5 py-4 transition-colors hover:border-ink/25 md:px-6"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-cloud">
                  <Sprout size={15} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">
                      A bouquet from a name
                    </p>
                    <span className="shrink-0 rounded-full border border-meadow/40 bg-meadow/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-earth/80">
                      Beta
                    </span>
                  </div>
                  <p className="mt-0.5 max-w-[46ch] text-[12px] leading-snug text-ink/50">
                    Type a name — we turn it into a bouquet for that person
                  </p>
                </div>
              </div>
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-ink/10 text-ink/60 transition-colors duration-300 group-hover:border-ink/30 group-hover:text-ink">
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Divider between the name ritual and the craft table */}
      <div className="bg-cloud">
        <div className="container-esenel">
          <div className="mx-auto flex max-w-3xl items-center gap-4 py-8 md:py-10">
            <span className="h-px flex-1 bg-ink/10" />
            <span className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-ink/40">
              or craft your own bouquet
            </span>
            <span className="h-px flex-1 bg-ink/10" />
          </div>
        </div>
      </div>

      <section className="bg-cloud pb-16 md:pb-24">
        <div className="container-esenel">
          <CraftBuilder />
        </div>
      </section>

      <BouquetGallery />
    </main>
  );
}
