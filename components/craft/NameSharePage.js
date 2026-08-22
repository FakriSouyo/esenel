'use client';

/**
 * Halaman share link bouquet (/craft/name/<nameKey>) — bare (tanpa navbar /
 * footer, diatur via Chrome BARE_ROUTES). Menampilkan hasil generate nama
 * secara interaktif & menarik:
 *   - hero: nama + nama buket + foto buket (parallax),
 *   - sections: ARTI NAMA, MAKNA NAMA, CERITA, BUNGA YANG COCOK (kartu
 *     interaktif),
 *   - CTA "Coba namamu" → /craft/name.
 * Ditambah scroll-progress, scroll-spy dots, dan reveal-on-scroll.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  Flower2,
  Heart,
  Link2,
  Sparkles,
} from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];

const SECTIONS = [
  { id: 'arti', label: 'Arti Nama' },
  { id: 'makna', label: 'Makna Nama' },
  { id: 'cerita', label: 'Cerita' },
  { id: 'bunga', label: 'Bunga' },
];

const SWATCHES = [
  '#C96F4A',
  '#E8C4A0',
  '#B6C5A8',
  '#A9C9D8',
  '#D9A7B0',
  '#8B8087',
  '#E0D2A6',
  '#C2B0D6',
];

/** Reveal blur-to-sharp saat masuk viewport. */
function Reveal({ children, delay = 0, y = 24, className }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Label section kecil (eyebrow). */
function SectionEyebrow({ children }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-earth">
      <span className="inline-block size-1.5 rounded-full bg-earth" />
      {children}
    </div>
  );
}

function swatchFor(name, index) {
  let h = 0;
  const s = String(name || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return SWATCHES[(h + index) % SWATCHES.length];
}

export default function NameSharePage({ story, nameKey, imageUrl }) {
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [activeId, setActiveId] = useState('arti');

  const name = story?.nama || 'Kamu';
  const bouquet = story?.namaBuket || 'ESENEL';
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const key = String(nameKey || '').trim();
    return key
      ? `${window.location.origin}/craft/name/${encodeURIComponent(key)}`
      : window.location.origin + '/craft/name';
  }, [nameKey]);

  const { scrollYProgress } = useScroll({ target: rootRef, offset: ['start start', 'end end'] });
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const heroTextY = useTransform(scrollYProgress, [0, 0.18], [0, 120]);
  const heroImgY = useTransform(scrollYProgress, [0, 0.2], [0, -60]);

  // Scroll-spy: tandai section yang sedang dalam viewport.
  const sectionIds = useMemo(() => SECTIONS.map((s) => s.id), []);
  useEffect(() => {
    const els = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!vis.length) return;
        const id = vis[0].target.id;
        if (SECTIONS.some((s) => s.id === id)) setActiveId(id);
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: [0, 0.2, 0.5] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sectionIds]);

  const scrollTo = useCallback(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    },
    [reduce],
  );

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* abaikan */
    }
  }, [shareUrl]);

  const flowers = Array.isArray(story?.bunga) ? story.bunga : [];

  return (
    <main ref={rootRef} className="relative bg-cloud text-ink">
      {/* progress bar */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX: progressScale }}
        className="fixed inset-x-0 top-0 z-30 h-0.5 origin-left bg-earth"
      />

      {/* tombol atas: kembali + salin link */}
      <div className="fixed left-4 top-4 z-30 flex gap-2">
        <button
          type="button"
          onClick={() => router.push('/craft')}
          aria-label="Kembali ke halaman craft"
          className="grid size-10 place-items-center rounded-full border border-ink/10 bg-cloud/85 text-ink/70 backdrop-blur transition-colors hover:border-ink/30 hover:text-ink"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          type="button"
          onClick={copyLink}
          aria-label="Salin link"
          className="flex items-center gap-2 rounded-full border border-ink/10 bg-cloud/85 px-3.5 text-[11px] font-medium tracking-nav text-ink/70 backdrop-blur transition-colors hover:border-ink/30 hover:text-ink"
        >
          {copied ? 'Link tersalin ✓' : (
            <span className="inline-flex items-center gap-1.5">
              <Link2 size={13} />
              Salin link
            </span>
          )}
        </button>
      </div>

      {/* ================= HERO ================= */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden">
        {/* latar foto buket — parallax, mask gradasi */}
        <motion.div
          aria-hidden="true"
          style={{ y: heroImgY }}
          className="absolute inset-0"
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full scale-110 object-cover opacity-70"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-meadow/30 via-sky/25 to-sand/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-cloud/70 via-cloud/40 to-cloud" />
        </motion.div>

        <motion.div
          style={{ y: heroTextY }}
          className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-20 pb-16 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="mx-auto inline-flex items-center gap-2 rounded-pill border border-ink/10 bg-cloud/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.26em] text-earth backdrop-blur"
          >
            <Sparkles size={12} />
            Buket personal · ESENEL
          </motion.p>

          <motion.h1
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.85, delay: 0.2, ease: EASE }}
            className="mt-6 font-display text-6xl leading-[0.95] tracking-[-0.01em] text-ink md:text-8xl"
          >
            {name}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
            className="mt-4 font-display text-xl text-earth md:text-2xl"
          >
            “{bouquet}”
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => router.push('/craft/name')}
              className="inline-flex items-center gap-2 rounded-pill bg-ink px-6 py-3 text-[12px] font-medium tracking-nav text-cloud transition-all hover:bg-ink/90 active:scale-[0.98]"
            >
              <Flower2 size={14} />
              Coba namamu
            </button>
            <button
              type="button"
              onClick={() => scrollTo('arti')}
              className="inline-flex items-center gap-2 rounded-pill border border-ink/15 px-6 py-3 text-[12px] font-medium tracking-nav text-ink/70 transition-colors hover:border-ink/40 hover:text-ink"
            >
              Lihat ceritamu
              <ChevronDown size={14} />
            </button>
          </motion.div>
        </motion.div>

        {/* scroll hint */}
        <motion.button
          type="button"
          onClick={() => scrollTo('arti')}
          aria-label="Gulir ke bawah"
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-ink/35 transition-colors hover:text-ink/70"
        >
          <ChevronDown size={22} />
        </motion.button>
      </section>

      {/* scroll-spy dots */}
      <nav
        aria-label="Navigasi bagian"
        className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 md:flex"
      >
        {SECTIONS.map((s, i) => {
          const active = activeId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              aria-label={s.label}
              title={s.label}
              className={`grid size-3 place-items-center rounded-full transition-all ${
                active ? 'bg-earth' : 'bg-ink/20 hover:bg-ink/40'
              }`}
              style={{ opacity: reduce ? 1 : active ? 1 : 0.7 }}
            >
              {active && <span className="sr-only">{s.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* ================= KONTEN ================= */}
      <div className="mx-auto w-full max-w-3xl px-6 pb-28">
        {/* --- ARTI NAMA --- */}
        <section id="arti" className="scroll-mt-24 border-t border-ink/10 py-20 text-center">
          <Reveal>
            <SectionEyebrow>Arti Nama</SectionEyebrow>
            <p className="mx-auto mt-6 max-w-2xl font-display text-2xl leading-[1.35] text-ink md:text-4xl">
              “{story?.artiNama || 'Cerita namamu menyimpan makna yang tenang.'}”
            </p>
          </Reveal>
        </section>

        {/* --- MAKNA NAMA --- */}
        <section id="makna" className="scroll-mt-24 border-t border-ink/10 py-20">
          <Reveal>
            <SectionEyebrow>Makna Nama</SectionEyebrow>
            <p className="mt-6 text-lg leading-[1.7] text-ink/80">
              {story?.maknaNama || 'Kamu adalah orang yang punya ketenangan yang jarang dimiliki banyak orang.'}
            </p>
          </Reveal>
        </section>

        {/* --- CERITA --- */}
        <section id="cerita" className="scroll-mt-24 border-t border-ink/10 py-20">
          <Reveal>
            <SectionEyebrow>Cerita</SectionEyebrow>
            <div className="mt-6 rounded-3xl border border-ink/10 bg-white/60 p-7 backdrop-blur md:p-9">
              <p className="text-lg leading-[1.7] text-ink/80">
                {story?.cerita || 'Di meja rangkai kami, kamu selalu terbayang sebagai buket yang tidak ramai tapi berkesan.'}
              </p>
              <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-ink/40">
                Buket untuk {name} · {bouquet}
              </p>
            </div>
          </Reveal>
        </section>

        {/* --- BUNGA YANG COCOK --- */}
        <section id="bunga" className="scroll-mt-24 border-t border-ink/10 py-20">
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <div>
                <SectionEyebrow>Bunga yang Cocok</SectionEyebrow>
                <h2 className="mt-4 font-display text-3xl md:text-4xl">{name}</h2>
              </div>
              <p className="max-w-[16rem] text-right text-[12px] leading-relaxed text-ink/50">
                Komposisi yang mencerminkan kepribadian & caramu hadir.
              </p>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {flowers.length === 0 && (
              <Reveal className="sm:col-span-2">
                <p className="text-ink/50">Belum ada komposisi bunga untuk nama ini.</p>
              </Reveal>
            )}
            {flowers.map((f, i) => {
              const sw = swatchFor(f?.namaEn || f?.nama, i);
              return (
                <Reveal key={i} delay={(i % 2) * 0.08}>
                  <motion.article
                    initial={false}
                    whileHover={reduce ? undefined : { y: -6 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="group relative overflow-hidden rounded-3xl border border-ink/10 bg-white/60 p-6 backdrop-blur"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -right-8 -top-8 size-28 rounded-full opacity-25 blur-2xl transition-opacity duration-500 group-hover:opacity-50"
                      style={{ backgroundColor: sw }}
                    />
                    <div className="flex items-start gap-4">
                      <span
                        className="grid size-12 shrink-0 place-items-center rounded-2xl text-cloud"
                        style={{ backgroundColor: sw }}
                      >
                        <Flower2 size={20} />
                      </span>
                      <div className="min-w-0 text-left">
                        <h3 className="font-display text-xl leading-none text-ink">
                          {f?.namaPuitis || f?.nama}
                        </h3>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-ink/45">
                          {f?.namaEn || f?.nama}
                        </p>
                      </div>
                      <Heart className="ml-auto mt-1 size-4 shrink-0 text-earth/50 transition-colors group-hover:text-earth" />
                    </div>
                    {f?.alasan && (
                      <p className="mt-4 text-[13px] leading-relaxed text-ink/65">{f.alasan}</p>
                    )}
                  </motion.article>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ================= CTA FINAL ================= */}
        <section className="relative mt-4 overflow-hidden rounded-[2rem] bg-ink px-6 py-16 text-center text-cloud md:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, #B6C5A8 0 12%, transparent 12.5%), radial-gradient(circle at 80% 70%, #A9C9D8 0 18%, transparent 18.5%)',
              backgroundSize: '240px 240px',
            }}
          />
          <Reveal>
            <SectionEyebrowBare />
            <h2 className="mx-auto max-w-xl font-display text-4xl leading-tight md:text-5xl">
              Sekarang, giliran namamu.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-cloud/70">
              Ketik namamu dan biarkan ESENEL merangkai bunga + cerita yang cocok untukmu.
            </p>
            <button
              type="button"
              onClick={() => router.push('/craft/name')}
              className="mt-8 inline-flex items-center gap-2 rounded-pill bg-cloud px-7 py-3.5 text-[12px] font-semibold tracking-nav text-ink transition-all hover:bg-white active:scale-[0.98]"
            >
              <Flower2 size={15} />
              Coba namamu
            </button>
          </Reveal>
        </section>

        <footer className="mx-auto mt-16 max-w-3xl text-center">
          <div className="h-px w-24 bg-earth/40" style={{ margin: '0 auto' }} />
          <p className="mt-6 font-display text-lg tracking-[-0.01em] text-ink">ESENEL</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-ink/40">
            Fleur atelier · dibuat dari namamu
          </p>
        </footer>
      </div>
    </main>
  );
}

function SectionEyebrowBare() {
  return (
    <div className="mx-auto mb-5 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-earth/90">
      <span className="inline-block size-1.5 rounded-full bg-meadow" />
      ESENEL
      <span className="inline-block size-1.5 rounded-full bg-sky" />
    </div>
  );
}