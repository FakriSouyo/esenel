import Link from 'next/link';
import { Sprout, ArrowRight } from 'lucide-react';
import CraftBuilder from '@/components/craft/CraftBuilder';

export const metadata = { title: 'Craft — ESENEL' };

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
          {/* Small personalisation banner — “buat bunga dari namamu” */}
          <Link
            href="/craft/name"
            className="group relative block overflow-hidden rounded-3xl border border-sand bg-[#23301F] px-6 py-7 text-cloud transition-shadow hover:shadow-[0_18px_44px_-18px_rgba(32,34,30,0.45)] md:px-9 md:py-8"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_88%_0%,rgba(182,197,168,0.28),transparent_65%)]" />
            <div className="relative z-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-meadow/35 bg-meadow/10">
                  <Sprout size={19} className="text-meadow" />
                </span>
                <div>
                  <p className="text-[11px] tracking-[0.2em] font-medium text-meadow/70">
                    PERSONAL
                  </p>
                  <p className="mt-1.5 font-display text-xl leading-tight md:text-2xl">
                    Buat bunga dari namamu.
                  </p>
                  <p className="mt-1 max-w-md text-[13px] leading-relaxed text-cloud/55">
                    Ketik satu nama — hurufnya kami ubah jadi rangkaian bunga untuk orang itu.
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-pill bg-cloud px-6 py-3.5 text-[12px] font-medium tracking-nav text-[#23301F] transition-transform duration-300 group-hover:translate-x-0.5">
                MULAI DARI NAMAMU
                <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="bg-cloud py-16 md:py-24">
        <div className="container-esenel">
          <CraftBuilder />
        </div>
      </section>
    </main>
  );
}
