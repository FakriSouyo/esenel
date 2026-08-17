'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLenis } from 'lenis/react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RotateCcw, ShoppingBag } from 'lucide-react';
import { products } from '@/data/products';
import { normalizeName } from '@/lib/nameNormalize';
import ProductCard from '@/components/products/ProductCard';

/** Kunci sessionStorage untuk buket nama yang diteruskan langsung ke checkout
 *  (TIDAK masuk cart). Dibaca di app/checkout/page.js dan dibersihkan setelah
 *  pesanan terkirim atau saat mulai alur nama baru. */
const DIRECT_ITEM_KEY = 'esenel.directItem.v1';
import ScrambleText, { SCRAMBLE_MS } from '@/components/craft/ScrambleText';
import GeneratedImage from '@/components/craft/GeneratedImage';

const EASE = [0.16, 1, 0.3, 1];

// Irama pelan & jelas — reveal blur per kata harus sempat terlihat sebelum
// scroll pindah ke section berikutnya.
const WORD_MS = 110; // per kata
const SECTION_HOLD = 3000; // jeda setelah teks selesai sebelum pindah
const SCROLL_DELAY = 1200; // jeda sebelum mulai scroll
const SCROLL_DURATION = 3.2; // durasi scroll halus (detik)
const NAME_REVEAL_HOLD = 2600; // jeda setelah nama settle sebelum generate

/** Kata per kata dengan efek blur masuk (gaya magicui text-animate).
 *  `delay` = offset awal per item supaya item berurutan, bukan serentak. */
function BlurWords({ text, active, delay = 0, className }) {
  const words = useMemo(() => text.split(' '), [text]);
  return (
    <p
      className={
        className ||
        'font-display text-2xl leading-[1.35] tracking-[-0.01em] text-ink md:text-4xl'
      }
    >
      {words.map((w, i) =>
        active ? (
          <motion.span
            key={i}
            initial={{ opacity: 0, filter: 'blur(10px)', y: 12 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={{ duration: 0.5, delay: delay + i * (WORD_MS / 1000), ease: EASE }}
            className="mr-[0.3em] inline-block"
          >
            {w}
          </motion.span>
        ) : (
          <span key={i} className="mr-[0.3em] inline-block">
            {w}
          </span>
        )
      )}
    </p>
  );
}

/**
 * Cari produk katalog yang "hampir sama": skor kecocokan bunga pada
 * composition produk terhadap nama bunga dari cerita. Kalau tidak ada
 * kecocokan, fallback ke pilihan unggulan.
 */
function pickSimilar(story, count) {
  const tokens = (story.bunga || [])
    .map((b) => String(b.nama || '').toLowerCase())
    .flatMap((n) => n.split(/\s+/))
    .filter(
      (w) =>
        w &&
        !['putih', 'merah', 'marun', 'lavender', 'kuning', 'pink', 'biru', 'kecil', 'besar'].includes(w)
    )
    .map((w) => w.replace(/[^a-z0-9]/g, ''));

  const scored = products
    .map((p) => {
      const comp = (p.composition || []).join(' ').toLowerCase();
      const score = tokens.reduce((acc, t) => acc + (t && comp.includes(t) ? 1 : 0), 0);
      return { p, score };
    })
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name));

  const top = [];
  const seen = new Set();
  for (const { p, score } of scored) {
    if (score > 0 && !seen.has(p.slug)) {
      top.push(p);
      seen.add(p.slug);
    }
    if (top.length >= count) break;
  }
  if (top.length < count) {
    for (const slug of ['alba', 'bali', 'santorini', 'amsterdam', 'colmar', 'kyoto']) {
      const p = products.find((x) => x.slug === slug);
      if (p && !seen.has(p.slug)) {
        top.push(p);
        seen.add(p.slug);
      }
      if (top.length >= count) break;
    }
  }
  return top.slice(0, count);
}

export default function NameStory({ story, onRestart }) {
  const router = useRouter();
  const lenis = useLenis();
  const [active, setActive] = useState(0);
  const refs = useRef([]);

  // Section tanpa label — cukup isinya, satu layar per bagian:
  //   0 arti → 1 makna → 2 bunga (6-8) → 3 nama buket (scramble)
  //   → 4 generate gambar → 5 selesai
  const textSections = useMemo(
    () => [
      { key: 'arti', text: story.artiNama },
      { key: 'makna', text: story.maknaNama },
      { key: 'bunga', items: story.bunga },
    ],
    [story]
  );
  const NAME_REVEAL = textSections.length; // 3
  const GENERATE = NAME_REVEAL + 1; // 4
  const FINAL = GENERATE + 1; // 5

  const similar = useMemo(() => pickSimilar(story, 4), [story]);
  const nameKey = useMemo(() => normalizeName(story.nama) || 'nama', [story.nama]);

  const [genStatus, setGenStatus] = useState('queued');
  const [genAttempt, setGenAttempt] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [genImgLoaded, setGenImgLoaded] = useState(false);
  const locked = genStatus === 'queued' || genStatus === 'generating' || genStatus === 'refining';

  // Section yang sudah benar-benar tiba (scroll selesai). Scramble & generate
  // menunggu ini supaya animasinya terlihat saat halaman sampai, bukan
  // sudah selesai duluan sebelum user sempat melihat.
  const [arrived, setArrived] = useState(null);

  // Auto-scroll halus ke section berikutnya (lewat Lenis supaya tidak
  // bertabrakan dengan smooth scroll global) — pelan & lama.
  useEffect(() => {
    if (active === 0 || active > FINAL) return;
    const el = refs.current[active];
    if (!el) return;
    const t = setTimeout(() => {
      if (lenis) {
        lenis.scrollTo(el, {
          offset: -40,
          duration: SCROLL_DURATION,
          easing: (x) => 1 - Math.pow(1 - x, 3),
        });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, SCROLL_DELAY);
    return () => clearTimeout(t);
  }, [active, lenis, FINAL]);

  const handleDone = useCallback(
    () => setActive((a) => Math.min(a + 1, FINAL)),
    [FINAL]
  );

  // Tandai "tiba" setelah scroll ke section aktif selesai (SCROLL_DELAY +
  // durasi scroll). Dipakai section nama buket & generate.
  useEffect(() => {
    if (active === 0 || active > FINAL) return;
    const t = setTimeout(
      () => setArrived(active),
      SCROLL_DELAY + SCROLL_DURATION * 1000
    );
    return () => clearTimeout(t);
  }, [active, FINAL]);

  // Section teks (0-1) maju otomatis setelah animasinya selesai.
  useEffect(() => {
    if (active >= textSections.length || active >= 2) return;
    const s = textSections[active];
    if (!s?.text) return;
    const t = setTimeout(
      () => handleDone(),
      s.text.split(' ').length * WORD_MS + SECTION_HOLD
    );
    return () => clearTimeout(t);
  }, [active, textSections, handleDone]);

  // Section nama buket (3): tunggu scroll tiba, baru scramble dimulai dan
  // setelah settle lalu pindah ke generate.
  useEffect(() => {
    if (active !== NAME_REVEAL || arrived !== NAME_REVEAL) return;
    const t = setTimeout(() => handleDone(), SCRAMBLE_MS + NAME_REVEAL_HOLD);
    return () => clearTimeout(t);
  }, [active, arrived, NAME_REVEAL, handleDone]);

  // Section generate (4): tunggu scroll tiba dulu, baru panggil
  // /api/name-image. Status hidup, scroll ke bawah dikunci sampai selesai.
  // Pindah ke section final HANYA setelah gambar benar-benar selesai
  // dimuat (onLoad) — kalau 6 detik belum juga loaded, tetap lanjut biar
  // tidak terjebak.
  useEffect(() => {
    if (active !== GENERATE || arrived !== GENERATE) return;
    let cancelled = false;
    setGenStatus('queued');
    setImageUrl(null);
    setImgFailed(false);
    setGenImgLoaded(false);
    const t1 = setTimeout(() => !cancelled && setGenStatus('generating'), 1100);
    const t2 = setTimeout(() => !cancelled && setGenStatus('refining'), 3400);
    (async () => {
      try {
        const res = await fetch('/api/name-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nameKey, prompt: story.imagePrompt }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data?.url) {
          setImageUrl(data.url);
          setGenStatus('complete');
          // fallback: gambar tak kunjung onLoad → lanjut setelah 6 detik
          setTimeout(() => !cancelled && handleDone(), 6000);
        } else {
          setGenStatus('error');
        }
      } catch {
        if (!cancelled) setGenStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active, arrived, GENERATE, genAttempt, handleDone, nameKey, story.imagePrompt]);

  // Gambar sudah termuat → tunggu sejenak biar terlihat, baru pindah ke
  // section selesai (fallback 6 detik di atas kalau onLoad tidak pernah tiba).
  useEffect(() => {
    if (genStatus !== 'complete' || !genImgLoaded) return;
    const t = setTimeout(handleDone, 900);
    return () => clearTimeout(t);
  }, [genStatus, genImgLoaded, handleDone]);

  // Saat generate: blokir scroll KE BAWAH manual (tetap bisa ke atas untuk
  // membaca ulang). Lenis v1.3 skip event yang punya `lenisStopPropagation`,
  // jadi preventDefault + flag itu sekaligus untuk scroll bawah. Begitu
  // selesai, kunci dilepas.
  useEffect(() => {
    if (!locked) return;
    let lastY = null;
    const onWheel = (e) => {
      if (e.deltaY > 0) {
        e.preventDefault();
        e.lenisStopPropagation = true;
      }
    };
    const onTouchStart = () => {
      lastY = null;
    };
    const onTouchMove = (e) => {
      if (!e.touches.length) return;
      const y = e.touches[0].clientY;
      if (lastY !== null && y < lastY) {
        // jari naik = scroll bawah
        e.preventDefault();
        e.lenisStopPropagation = true;
      }
      lastY = y;
    };
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    return () => {
      window.removeEventListener('wheel', onWheel, { capture: true });
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove, { capture: true });
    };
  }, [locked]);

  const handleCheckout = () => {
    const ref = similar[0];
    // Buket hasil generate nama TIDAK masuk cart — langsung diteruskan ke
    // halaman checkout lewat sessionStorage (hilang saat tab ditutup).
    const item = {
      id: `nama-buket-${nameKey}`,
      name: story.namaBuket || story.nama,
      subtitle: `Bouquet personal untuk ${story.nama}`,
      price: ref?.price ?? 250000,
      image: imageUrl || ref?.image || null,
      quantity: 1,
      direct: true,
    };
    try {
      window.sessionStorage.setItem(DIRECT_ITEM_KEY, JSON.stringify(item));
    } catch {
      // private mode / storage penuh — checkout tetap jalan tanpa item
    }
    router.push('/checkout');
  };

  const setRef = (i) => (el) => {
    refs.current[i] = el;
  };

  return (
    <main className="bg-[#F8F9F5] text-ink">
      {/* 0-1: teks cerita */}
      {textSections.slice(0, 2).map((s, i) => {
        const isActive = i === active;
        const isPast = i < active;
        const dim = !isActive && !isPast;
        return (
          <section key={s.key} ref={setRef(i)} className="flex min-h-screen items-center px-6 md:px-12">
            <div
              className={`mx-auto w-full max-w-3xl py-24 transition-opacity duration-700 ${
                dim ? 'opacity-25' : 'opacity-100'
              }`}
            >
              <BlurWords text={s.text} active={isActive} />
            </div>
          </section>
        );
      })}

      {/* 2: bunga yang cocok (6-8) — reveal pelan biar blur terlihat */}
      <section ref={setRef(2)} className="flex min-h-screen items-center px-6 md:px-12">
        <div
          className={`mx-auto w-full max-w-3xl py-24 transition-opacity duration-700 ${
            active === 2 ? 'opacity-100' : active < 2 ? 'opacity-0' : 'opacity-25'
          }`}
        >
          <SectionItems items={textSections[2].items} active={active === 2} onDone={handleDone} />
        </div>
      </section>

      {/* 3: nama buket — randomize text reveal (menunggu scroll tiba) */}
      <section ref={setRef(NAME_REVEAL)} className="flex min-h-screen items-center px-6 md:px-12">
        <div
          className={`mx-auto w-full max-w-4xl py-24 text-center transition-all duration-700 ${
            active === NAME_REVEAL && arrived === NAME_REVEAL
              ? 'translate-y-0 opacity-100'
              : 'translate-y-4 opacity-25'
          }`}
        >
          <p className="text-[11px] tracking-[0.24em] font-medium uppercase text-ink/45">
            Namamu sudah jadi sebuah buket
          </p>
          <h2 className="mt-6 font-display text-6xl leading-none tracking-[-0.03em] text-earth md:text-8xl">
            <ScrambleText
              text={story.namaBuket || story.nama}
              active={arrived === NAME_REVEAL}
              className="inline-block min-h-[1em]"
            />
          </h2>
        </div>
      </section>

      {/* 4: generate gambar (beUI-style) — ringkas biar muat di layar */}
      <section ref={setRef(GENERATE)} className="flex min-h-screen items-center px-6 md:px-12">
        <div
          className={`mx-auto w-full max-w-3xl py-14 text-center transition-all duration-700 ${
            active === GENERATE ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-25'
          }`}
        >
          <p className="text-[11px] tracking-[0.24em] font-medium uppercase text-ink/45">
            Sedang kami rangkai buketnya
          </p>
          <div className="mx-auto mt-6 w-full max-w-sm">
            <GeneratedImage
              status={genStatus}
              src={imageUrl}
              prompt={story.imagePrompt}
              onRetry={() => setGenAttempt((a) => a + 1)}
              onMediaLoad={() => setGenImgLoaded(true)}
            />
          </div>
          <p className="mt-6 text-sm leading-relaxed text-ink/50">
            {locked
              ? 'Tunggu sebentar, gambar buketmu sedang dibuat. Kamu tetap bisa scroll ke atas untuk membaca lagi ceritanya.'
              : genStatus === 'error'
                ? 'Gambar gagal dibuat. Coba lagi, atau lanjut tanpa gambar.'
                : ''}
          </p>
          {genStatus === 'error' && (
            <button
              type="button"
              onClick={handleDone}
              className="mt-4 inline-flex items-center gap-2 rounded-pill border border-ink/20 px-5 py-2.5 text-[12px] font-medium tracking-nav text-ink/60 transition-colors hover:border-ink/45 hover:text-ink"
            >
              LANJUT TANPA GAMBAR
            </button>
          )}
        </div>
      </section>

      {/* 5: selesai */}
      <section ref={setRef(FINAL)} className="flex min-h-screen items-center px-6 md:px-12">
        <div
          className={`mx-auto w-full max-w-3xl py-24 text-center transition-all duration-700 ${
            active === FINAL ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-25'
          }`}
        >
          <h2 className="font-display text-2xl leading-tight text-ink/60 md:text-4xl">
            Bouquet untuk {story.nama} selesai.
          </h2>
          <p className="mt-2 font-display text-5xl leading-none tracking-[-0.02em] text-earth md:text-7xl">
            {story.namaBuket || story.nama}
          </p>

          {/* Gambar hasil generate (dari Supabase Storage) — kecil, jadi
              heading + tombol CHECKOUT terlihat tanpa scroll. */}
          <div className="relative mx-auto mt-6 aspect-square w-40 overflow-hidden rounded-2xl bg-sand/40 md:w-48">
            {imageUrl && !imgFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={`Buket ${story.namaBuket || story.nama}`}
                onError={() => setImgFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : similar[0] ? (
              <Image
                src={similar[0].image}
                alt={story.namaBuket || story.nama}
                fill
                sizes="(min-width: 768px) 28rem, 90vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-meadow via-sky to-sand">
                <span className="select-none font-display text-[8rem] leading-none text-cloud/70">✿</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleCheckout}
              className="inline-flex items-center gap-2 rounded-pill bg-ink px-9 py-4 text-[13px] font-medium tracking-nav text-cloud transition-colors hover:bg-ink/90"
            >
              <ShoppingBag size={15} />
              CHECKOUT
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-2 rounded-pill border border-ink/20 px-7 py-4 text-[13px] font-medium tracking-nav text-ink/70 transition-colors hover:border-ink/45 hover:text-ink"
            >
              <RotateCcw size={14} />
              TULIS NAMA LAIN
            </button>
          </div>

          {/* Katalog bunga yang hampir sama — boleh di bawah, tetap bisa scroll */}
          {similar.length > 0 && (
            <div className="mt-12 border-t border-ink/10 pt-10 text-left">
              <p className="text-[11px] tracking-[0.24em] font-medium uppercase text-ink/45">
                Katalog bunga yang hampir sama
              </p>
              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
                {similar.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/** Irama section bunga — alasan di-blur lebih cepat (REASON_WORD_MS) supaya
 *  item tidak menumpuk jadi puluhan detik; item di-grid 2 kolom biar muat
 *  satu layar dan semua reveal terlihat. Durasi tetap di-cap biar tidak
 *  pernah terasa stuck walau DeepSeek mengirim 8 bunga dengan alasan panjang. */
const ITEM_STAGGER = 700; // jeda antar item (ms)
const ITEM_HOLD = 600; // jeda setelah alasan satu item selesai (ms)
const REASON_WORD_MS = 55; // kata/detik untuk alasan (lebih cepat dari nama)
const FLOWERS_SECTION_MAX = 26000; // cap total durasi section bunga (ms)

function SectionItems({ items, active, onDone }) {
  const totalMs = useMemo(() => {
    let acc = 1600;
    items.forEach((it, idx) => {
      const nameMs = it.nama.split(' ').length * WORD_MS;
      const reasonMs = it.alasan.split(' ').length * REASON_WORD_MS;
      acc += Math.max(nameMs, reasonMs) + ITEM_HOLD;
      if (idx < items.length - 1) acc += ITEM_STAGGER;
    });
    return Math.min(acc, FLOWERS_SECTION_MAX);
  }, [items]);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(onDone, totalMs);
    return () => clearTimeout(t);
  }, [active, totalMs, onDone]);

  return (
    <div className="grid gap-x-12 gap-y-7 sm:grid-cols-2">
      {items.map((it, idx) => {
        const start = idx * (ITEM_STAGGER / 1000);
        return (
          <div key={it.nama} className="flex items-baseline gap-4">
            <span
              className={`shrink-0 font-display text-sm text-ink/35 transition-opacity duration-500 md:text-base ${
                active ? 'opacity-100' : 'opacity-40'
              }`}
            >
              {String(idx + 1).padStart(2, '0')}
            </span>
            <div>
              <BlurWords
                text={it.nama}
                active={active}
                delay={start}
                className="font-display text-xl leading-snug tracking-[-0.01em] text-ink md:text-2xl"
              />
              <p className="mt-1 max-w-md text-[13px] leading-relaxed text-ink/55 md:text-sm">
                {it.alasan.split(' ').map((w, i) =>
                  active ? (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      transition={{
                        duration: 0.4,
                        delay: start + 0.3 + i * (REASON_WORD_MS / 1000),
                        ease: EASE,
                      }}
                      className="mr-[0.3em] inline-block"
                    >
                      {w}
                    </motion.span>
                  ) : (
                    <span key={i} className="mr-[0.3em] inline-block">
                      {w}
                    </span>
                  )
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
