import Link from 'next/link';
import Image from 'next/image';
import { Sprout, Hand, Flower2, MapPin } from 'lucide-react';
import RollingWords from '@/components/about/RollingWords';
import BentoShowcase from '@/components/about/BentoShowcase';

export const metadata = { title: 'About — ESENEL' };

const values = [
  {
    icon: Sprout,
    number: '01',
    title: 'Seasonal first',
    body: 'We only work with what is in bloom now. No frozen imports, no out-of-season stems — just the garden as it is.',
  },
  {
    icon: Hand,
    number: '02',
    title: 'Hand-arranged',
    body: 'Every composition is built by hand, close to the day it is delivered. No two bouquets are ever quite the same.',
  },
  {
    icon: Flower2,
    number: '03',
    title: 'Chosen with character',
    body: 'We pick stems for shape and personality rather than uniformity. Character over perfection, always.',
  },
];

const stats = [
  { value: '01', label: 'Atelier' },
  { value: '100%', label: 'Hand-arranged' },
  { value: '7', label: 'Days in season' },
];

export default function AboutPage() {
  return (
    <main className="bg-white">
      {/* ── Hero ── */}
      <section className="container-esenel pt-36 md:pt-44">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="mb-5 text-[12px] tracking-[0.2em] font-medium text-earth">
              ABOUT ESENEL
            </p>
            <h1 className="font-display text-4xl leading-[1.06] md:text-6xl xl:text-7xl">
              A floral atelier, built around restraint.
            </h1>
          </div>
          <div className="lg:col-span-4">
            <p className="leading-relaxed text-ink/60">
              ESENEL began with a simple belief: a bouquet should feel like it was picked from a
              garden, not built in a factory. We work with what&rsquo;s in season, arrange by hand,
              and keep every composition close to how flowers actually grow.
            </p>
            <div className="mt-8 flex items-center gap-3 border-t border-sand pt-5">
              <MapPin size={15} className="text-earth" />
              <span className="text-[12px] tracking-[0.12em] text-ink/50 font-medium uppercase">
                Sleman, Yogyakarta
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hero image ── */}
      <section className="container-esenel mt-14 md:mt-20">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] md:aspect-[21/9]">
          <Image
            src="https://images.unsplash.com/photo-1487070183336-b863922373d4?q=80&w=2000&auto=format&fit=crop"
            alt="Hand-tied bouquets on the atelier table"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-pill bg-white/85 px-3.5 py-1.5 text-[11px] font-medium tracking-nav text-ink backdrop-blur-sm md:bottom-6 md:left-6">
            <span className="size-1.5 rounded-full bg-earth" />
            THE ESENEL WORKTABLE, EARLY MORNING
          </div>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="container-esenel grid gap-10 py-20 md:py-28 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="mb-4 text-[12px] tracking-[0.2em] font-medium text-earth">OUR STORY</p>
          <h2 className="font-display text-3xl leading-[1.12] md:text-5xl">
            Rooted in Sleman,
            <br />
            grown by hand.
          </h2>
        </div>
        <div className="space-y-6 text-[15px] leading-relaxed text-ink/65 lg:col-span-7 lg:pt-2">
          <p>
            Sleman sits in the cool highlands below Mount Merapi, where volcanic soil and wet
            mornings make flowers grow whether you plan for them or not. ESENEL grew out of that
            rhythm: we buy from the season, arrange the morning of delivery, and let the bouquet
            stay a little wild.
          </p>
          <p>
            We don&rsquo;t chase uniformity. Two bouquets from the same order will never be twins —
            the stems we choose each morning are the ones the garden offers us. That&rsquo;s the
            point, not a compromise.
          </p>
          <blockquote className="border-l-2 border-earth pl-6 font-display text-xl leading-snug text-ink md:text-2xl">
            &ldquo;Restraint is the most honest thing a florist can practice.&rdquo;
            <span className="mt-2 block text-[11px] tracking-[0.18em] text-ink/40 font-body font-medium">
              — THE ESENEL STUDIO
            </span>
          </blockquote>
        </div>
      </section>

      {/* ── 3D rolling words — Skiper88-style interlude ── */}
      <RollingWords />

      {/* ── Values ── */}
      <section className="bg-cloud py-20 md:py-28">
        <div className="container-esenel">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="mb-4 text-[12px] tracking-[0.2em] font-medium text-earth">
                WHAT WE BELIEVE
              </p>
              <h2 className="font-display text-3xl leading-[1.1] md:text-5xl">
                Three quiet rules.
              </h2>
            </div>
            <p className="hidden max-w-[220px] text-right text-sm leading-relaxed text-ink/50 md:block">
              Everything we make follows the same three rules — the ones that keep the work honest.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {values.map((v) => (
              <div
                key={v.number}
                className="group rounded-nav border border-sand bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(32,34,30,0.08)]"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-full bg-meadow/60 text-ink transition-colors duration-300 group-hover:bg-meadow">
                    <v.icon size={20} strokeWidth={1.6} />
                  </span>
                  <span className="font-display text-2xl text-earth/60">{v.number}</span>
                </div>
                <h3 className="mt-8 font-display text-2xl leading-tight">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cinematic bento — Siena-parallax style ── */}
      <BentoShowcase />

      {/* ── Sleman band ── */}
      <section className="relative overflow-hidden bg-[#23301F] py-20 text-cloud md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_80%_10%,rgba(182,197,168,0.2),transparent_70%)]" />
        <div className="container-esenel relative grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-5 flex items-center gap-2 text-[12px] tracking-[0.2em] font-medium text-cloud/60">
              <MapPin size={14} />
              FROM SLEMAN
            </p>
            <h2 className="font-display text-3xl leading-[1.1] md:text-5xl">
              One atelier.
              <br />
              Every arrangement, by hand.
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-cloud/70">
              From a single worktable in Sleman, Yogyakarta, we compose, wrap, and deliver every
              order ourselves — cut close to your delivery window, never ahead of time.
            </p>
            <Link
              href="/journal"
              className="mt-8 inline-block rounded-pill border border-cloud/30 px-7 py-3.5 text-[13px] font-medium tracking-nav text-cloud transition-colors hover:bg-cloud hover:text-ink"
            >
              READ THE JOURNAL →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[24px] bg-white/10">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#23301F] p-8 md:p-10">
                <p className="font-display text-4xl text-cloud md:text-5xl">{s.value}</p>
                <p className="mt-2 text-[11px] tracking-[0.16em] text-cloud/50 font-medium uppercase">
                  {s.label}
                </p>
              </div>
            ))}
            <div className="bg-[#23301F] p-8 md:p-10">
              <p className="font-display text-4xl text-cloud md:text-5xl">∞</p>
              <p className="mt-2 text-[11px] tracking-[0.16em] text-cloud/50 font-medium uppercase">
                No two alike
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="container-esenel flex flex-col items-center py-24 text-center md:py-32">
        <p className="mb-5 text-[12px] tracking-[0.2em] font-medium text-earth">COME SAY HELLO</p>
        <h2 className="max-w-xl font-display text-3xl leading-[1.15] md:text-5xl">
          Let&rsquo;s make something worth remembering.
        </h2>
        <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/craft"
            className="rounded-pill bg-ink px-8 py-3.5 text-[13px] font-medium tracking-nav text-cloud transition-colors hover:bg-ink/90"
          >
            START CRAFTING
          </Link>
          <Link
            href="/shop"
            className="rounded-pill border border-ink/20 px-8 py-3.5 text-[13px] font-medium tracking-nav text-ink transition-colors hover:bg-ink hover:text-cloud"
          >
            SEE THE SHOP
          </Link>
        </div>
      </section>
    </main>
  );
}
