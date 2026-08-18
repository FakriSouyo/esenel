'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLenis } from 'lenis/react';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Link2, RotateCcw, ShoppingBag, ZoomIn } from 'lucide-react';
import { products } from '@/data/products';
import { normalizeName } from '@/lib/nameNormalize';
import { estimateBouquetPrice } from '@/lib/flowerPrices';
import ProductCard from '@/components/products/ProductCard';
import FlowerPriceList from '@/components/craft/FlowerPriceList';

/** Kunci sessionStorage untuk buket nama yang diteruskan langsung ke checkout
 *  (TIDAK masuk cart). Dibaca di app/checkout/page.js dan dibersihkan setelah
 *  pesanan terkirim atau saat mulai alur nama baru. */
const DIRECT_ITEM_KEY = 'esenel.directItem.v1';
import ScrambleText, { SCRAMBLE_MS } from '@/components/craft/ScrambleText';
import GeneratedImage from '@/components/craft/GeneratedImage';
import ShareCardDialog from '@/components/craft/ShareCardDialog';

const EASE = [0.16, 1, 0.3, 1];
const SPRING_LAYOUT = { type: 'spring', stiffness: 360, damping: 32, mass: 0.6 };

// Irama pelan & jelas — reveal blur per kata harus sempat terlihat sebelum
// scroll pindah ke section berikutnya. Nilai di bawah sudah disesuaikan
// supaya alur terasa lebih hidup: scroll ke section teks lebih cepat, teks
// baru reveal SETELAH scroll section selesai, scroll ke daftar bunga paling
// cepat, dan setelah reveal bunga ada jeda baca panjang.
const WORD_MS = 90; // per kata
const SECTION_HOLD = 2200; // jeda setelah teks selesai sebelum pindah
const SCROLL_DELAY = 700; // jeda sebelum mulai scroll
const SCROLL_DURATION = 2.4; // durasi scroll halus (detik)
const NAME_REVEAL_HOLD = 2200; // jeda setelah nama settle sebelum generate
const FLOWERS_SCROLL_DURATION = 1.6; // scroll ke daftar bunga LEBIH cepat
const FLOWERS_HOLD_MS = 3000; // jeda baca PANJANG setelah reveal bunga

/** Durasi scroll per section: daftar bunga paling cepat, sisanya standar. */
const sectionScrollDuration = (i) => (i === 2 ? FLOWERS_SCROLL_DURATION : SCROLL_DURATION);

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

  // Rincian harga langsung tampil (collapsible); dialog perbesar gambar.
  const [priceOpen, setPriceOpen] = useState(true);
  const [imgOpen, setImgOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const hasImage = Boolean((imageUrl && !imgFailed) || similar[0]);
  const priceRef = useRef(null);

  // Salin link halaman hasil generate — OG image dinamis menampilkan nama
  // buket + deskripsi, dan penerima link langsung melihat story auto-play.
  const copyLink = useCallback(async () => {
    const url = `${window.location.origin}/craft/name/${encodeURIComponent(nameKey)}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2200);
      return;
    } catch {
      // fallback input tersembunyi
    }
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2200);
    } catch {
      // clipboard tidak tersedia
    }
    ta.remove();
  }, [nameKey]);

  // Section yang sudah benar-benar tiba (scroll selesai). Scramble & generate
  // menunggu ini supaya animasinya terlihat saat halaman sampai, bukan
  // sudah selesai duluan sebelum user sempat melihat.
  const [arrived, setArrived] = useState(null);

  // Saat tiba di section selesai, scroll halus ke rincian harga — baris
  // muncul satu-satu (animasi Citations), jadi user bisa melihatnya langsung
  // tanpa harus scroll manual.
  useEffect(() => {
    if (arrived !== FINAL) return;
    const t = setTimeout(() => {
      const el = priceRef.current;
      if (!el) return;
      if (lenis) {
        lenis.scrollTo(el, {
          offset: -100,
          duration: 1.3,
          easing: (x) => 1 - Math.pow(1 - x, 3),
        });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 500);
    return () => clearTimeout(t);
  }, [arrived, FINAL, lenis]);

  // Auto-scroll halus ke section berikutnya (lewat Lenis supaya tidak
  // bertabrakan dengan smooth scroll global) — scroll ke daftar bunga
  // (section 2) paling cepat, sisanya standar.
  useEffect(() => {
    if (active === 0 || active > FINAL) return;
    const el = refs.current[active];
    if (!el) return;
    const t = setTimeout(() => {
      if (lenis) {
        lenis.scrollTo(el, {
          offset: -40,
          duration: sectionScrollDuration(active),
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

  // Tandai "tiba" setelah scroll ke section aktif SELESAI (SCROLL_DELAY +
  // durasi scroll per section). Reveal teks/bunga baru mulai setelah ini —
  // jadi urutannya: scroll section dulu, baru teks reveal perlahan.
  useEffect(() => {
    if (active === 0 || active > FINAL) return;
    const t = setTimeout(
      () => setArrived(active),
      SCROLL_DELAY + sectionScrollDuration(active) * 1000
    );
    return () => clearTimeout(t);
  }, [active, FINAL]);

  // IKUTI REVEAL (streaming): selama teks / daftar bunga sedang di-reveal,
  // halaman ikut scroll pelan supaya baris yang baru muncul selalu terbaca —
  // di mobile, section yang lebih tinggi dari layar tidak lagi terpotong saat
  // pindah ke section berikutnya. Mulai hanya SETELAH scroll section selesai
  // (arrived) — teks baru reveal perlahan saat halaman sudah berhenti.
  // Untuk daftar bunga, lama scroll di-cap (FLOWERS_SCROLL_MS) supaya
  // halaman tidak berjalan terlalu lambat di section yang tinggi.
  const revealVisible = active === 0 || arrived === active;
  useEffect(() => {
    if (active >= textSections.length) return; // hanya section 0..2
    if (!revealVisible) return; // tunggu scroll section selesai dulu
    const el = refs.current[active];
    if (!el) return;
    const s = textSections[active];
    const revealTotal = s?.text
      ? s.text.split(' ').length * WORD_MS
      : flowersSectionMs(s?.items || []);
    const total = s?.text ? revealTotal : Math.min(revealTotal, FLOWERS_SCROLL_MS);
    if (total <= 0) return;
    const startY = window.scrollY;
    const step = 340; // interval langkah scroll (ms)
    const started = performance.now();
    let timer;
    const tick = () => {
      const p = Math.min(1, (performance.now() - started) / total);
      const viewportH = window.innerHeight || 1;
      const contentH = el.offsetHeight;
      const finalY = el.offsetTop + Math.max(0, contentH - viewportH);
      const target = startY + (finalY - startY) * p;
      if (lenis) {
        lenis.scrollTo(target, { duration: step / 1000, easing: (x) => x });
      } else {
        window.scrollTo({ top: target, behavior: 'smooth' });
      }
      if (p >= 1) clearInterval(timer);
    };
    tick();
    timer = setInterval(tick, step);
    return () => clearInterval(timer);
  }, [active, revealVisible, textSections, lenis]);

  // Section teks (0-1) maju otomatis SETELAH reveal selesai. Timer mulai
  // hanya setelah scroll section selesai (arrived) — durasinya
  // words × WORD_MS + SECTION_HOLD, jadi teks panjang diberi waktu baca
  // yang proporsional dan tidak pernah kepotong saat scroll belum sampai.
  // Depends on boolean `textVisible` supaya timer tidak ter-reset saat
  // section LAIN masuk/keluar viewport.
  const textVisible = active === 0 || arrived === active;
  useEffect(() => {
    if (active >= textSections.length || active >= 2) return;
    const s = textSections[active];
    if (!s?.text) return;
    if (!textVisible) return; // tunggu scroll section selesai dulu
    const t = setTimeout(
      () => handleDone(),
      s.text.split(' ').length * WORD_MS + SECTION_HOLD
    );
    return () => clearTimeout(t);
  }, [active, textSections, textVisible, handleDone]);

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

  // Dialog perbesar gambar: Escape menutup dialog. Saat dialog terbuka,
  // tandai <body> supaya Escape halaman /craft (kembali ke /craft) tidak
  // ikut jalan — tutup gambarnya dulu, baru keluar halaman.
  useEffect(() => {
    try {
      if (imgOpen) document.body.dataset.esenelDialog = 'open';
      else delete document.body.dataset.esenelDialog;
    } catch {
      // abaikan
    }
    if (!imgOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setImgOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [imgOpen]);

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
    // Harga buket dihitung dari daftar bunga (harga per tangkai Indonesia)
    // + kertas/jasa rangkai — bukan harga produk katalog.
    const price = estimateBouquetPrice(story);
    // Buket hasil generate nama TIDAK masuk cart — langsung diteruskan ke
    // halaman checkout lewat sessionStorage (hilang saat tab ditutup).
    const item = {
      id: `nama-buket-${nameKey}`,
      name: story.namaBuket || story.nama,
      subtitle: `Bouquet personal untuk ${story.nama}`,
      price,
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
      {/* 0-1: teks cerita — items-start biar teks panjang mulai dari atas
          (dengan items-center baris atas malah keluar dari viewport di
          mobile). Teks DISEMBUNYIKAN dulu selama scroll section berjalan,
          baru muncul (blur reveal) SETELAH scroll selesai (arrived). */}
      {textSections.slice(0, 2).map((s, i) => {
        const isActive = i === active;
        const isPast = i < active;
        const dim = !isActive && !isPast;
        const revealed = i === 0 || arrived === i;
        return (
          <section key={s.key} ref={setRef(i)} className="flex min-h-screen items-start px-6 pt-[16vh] pb-24 md:px-12">
            <div
              className={`mx-auto w-full max-w-3xl transition-opacity duration-700 ${
                dim ? 'opacity-25' : isActive && !revealed ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <BlurWords text={s.text} active={isActive && revealed} />
            </div>
          </section>
        );
      })}

      {/* 2: bunga yang cocok (6-8) — reveal pelan biar blur terlihat.
          Timer maju baru mulai SETELAH scroll section selesai (arrived),
          dan setelah reveal selesai ada jeda baca panjang (FLOWERS_HOLD_MS).
          items-start biar item atas terbaca. */}
      <section ref={setRef(2)} className="flex min-h-screen items-start px-6 pt-[16vh] pb-24 md:px-12">
        <div
          className={`mx-auto w-full max-w-3xl transition-opacity duration-700 ${
            active === 2 ? 'opacity-100' : active < 2 ? 'opacity-0' : 'opacity-25'
          }`}
        >
          <SectionItems
            items={textSections[2].items}
            active={active === 2 && arrived === 2}
            onDone={handleDone}
          />
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
              heading + tombol CHECKOUT terlihat tanpa scroll. Klik untuk
              membuka dialog perbesar. */}
          {hasImage ? (
            <button
              type="button"
              onClick={() => setImgOpen(true)}
              aria-label="Perbesar gambar buket"
              className="group relative mx-auto mt-6 block aspect-square w-40 overflow-hidden rounded-2xl bg-sand/40 md:w-48"
            >
              {imageUrl && !imgFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={`Buket ${story.namaBuket || story.nama}`}
                  onError={() => setImgFailed(true)}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <Image
                  src={similar[0].image}
                  alt={story.namaBuket || story.nama}
                  fill
                  sizes="(min-width: 768px) 28rem, 90vw"
                  className="object-cover"
                />
              )}
              <span className="absolute bottom-2 right-2 grid size-7 place-items-center rounded-full bg-ink/55 text-cloud opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
                <ZoomIn size={14} />
              </span>
            </button>
          ) : (
            <div className="relative mx-auto mt-6 aspect-square w-40 overflow-hidden rounded-2xl bg-sand/40 md:w-48">
              <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-meadow via-sky to-sand">
                <span className="select-none font-display text-[8rem] leading-none text-cloud/70">✿</span>
              </div>
            </div>
          )}

          {/* Rincian harga bunga — langsung tampil (bisa di-collapse lewat
              header), item muncul satu-satu saat user tiba di section selesai
              (arrived === FINAL). Saat mulai, halaman auto-scroll ke sini
              supaya animasi satu-satu terlihat. */}
          <div ref={priceRef} className="mt-6 flex w-full flex-col items-center scroll-mt-24">
            {arrived === FINAL && (
              <FlowerPriceList story={story} open={priceOpen} onOpenChange={setPriceOpen} />
            )}
          </div>

          {/* Tombol kecil — muat sejajar di satu baris */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleCheckout}
              className="inline-flex items-center gap-1.5 rounded-pill bg-ink px-4 py-2 text-[11px] font-medium tracking-nav text-cloud transition-colors hover:bg-ink/90"
            >
              <ShoppingBag size={13} />
              CHECKOUT
            </button>
            <ShareCardDialog
              story={story}
              imageSrc={hasImage ? (imageUrl && !imgFailed ? imageUrl : similar[0]?.image) : null}
              imageAlt={`Buket ${story.namaBuket || story.nama}`}
              nameKey={nameKey}
            />
            <button
              type="button"
              onClick={copyLink}
              aria-label="Salin link hasil generate"
              className="inline-flex items-center gap-1.5 rounded-pill border border-ink/20 px-4 py-2 text-[11px] font-medium tracking-nav text-ink/70 transition-colors hover:border-ink/45 hover:text-ink"
            >
              <Link2 size={13} />
              {linkCopied ? 'LINK DISALIN!' : 'SALIN LINK'}
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 rounded-pill border border-ink/20 px-4 py-2 text-[11px] font-medium tracking-nav text-ink/70 transition-colors hover:border-ink/45 hover:text-ink"
            >
              <RotateCcw size={12} />
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

      {/* Dialog perbesar gambar buket — klik thumbnail untuk membuka,
          tutup lewat ✕, klik di luar, atau Escape. */}
      {imgOpen && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
          onClick={() => setImgOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Buket ${story.namaBuket || story.nama}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-cloud p-3 shadow-2xl"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-sand/40">
              {imageUrl && !imgFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={`Buket ${story.namaBuket || story.nama}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={similar[0].image}
                  alt={story.namaBuket || story.nama}
                  fill
                  sizes="(min-width: 768px) 32rem, 92vw"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex items-center justify-between gap-3 px-1 pt-3">
              <div className="min-w-0 text-left">
                <p className="truncate font-display text-lg tracking-[-0.01em] text-ink">
                  {story.namaBuket || story.nama}
                </p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-ink/40">
                  ESENEL · buket personal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImgOpen(false)}
                aria-label="Tutup"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-ink/5 text-ink/60 transition-colors hover:bg-ink/10 hover:text-ink"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/** Irama section bunga — gaya "Citations" (beui): baris MASUK SATU-SATU lewat
 *  state `visible` (bukan stagger delay statis), tiap baris memantul masuk
 *  dengan spring dan baris di bawahnya meluncur turun (layout spring) —
 *  konsisten dengan rincian harga di section selesai. */
const MOUNT_BASE = 240; // ms sebelum baris pertama masuk
const MOUNT_STEP = 360; // jeda antar baris (baris baru muncul satu-satu)
const ROW_REVEAL_MS = 650; // waktu blur nama + alasan dalam satu baris setelah muncul
const ITEM_HOLD = 120; // jeda setelah reveal terakhir sebelum pindah
const REASON_WORD_MS = 12; // kata/detik untuk alasan (blur cepat, tidak menahan section)
const FLOWERS_SCROLL_MS = 15000; // follow-scroll bunga sinkron penuh dengan reveal
const FLOWERS_SECTION_MAX = 11500; // cap total durasi section bunga (ms)

/** Durasi reveal total section bunga (ms) — dipakai timer maju SectionItems
 *  DAN follow-scroll reveal supaya keduanya selalu sinkron (scroll selesai
 *  tepat saat reveal selesai). Diambil dari jadwal mount: baris terakhir
 *  muncul di MOUNT_BASE + (n-1)*MOUNT_STEP, lalu isi barisnya di-blur selama
 *  ROW_REVEAL_MS, ditutup jeda baca ITEM_HOLD. */
function flowersSectionMs(items) {
  if (!items.length) return 0;
  const lastMount = MOUNT_BASE + (items.length - 1) * MOUNT_STEP;
  return Math.min(lastMount + ROW_REVEAL_MS + ITEM_HOLD, FLOWERS_SECTION_MAX);
}

function SectionItems({ items, active, onDone }) {
  const reduce = useReducedMotion() ?? false;
  const totalMs = useMemo(() => flowersSectionMs(items), [items]);
  const [visible, setVisible] = useState(0);

  // Baris muncul satu-satu saat section tiba (active). Kalau user kembali ke
  // section, baris tetap utuh — tidak vanish di tengah layar.
  useEffect(() => {
    if (!active) return;
    const timers = items.map((_, idx) =>
      setTimeout(() => setVisible(idx + 1), MOUNT_BASE + idx * MOUNT_STEP)
    );
    return () => timers.forEach(clearTimeout);
  }, [active, items]);

  useEffect(() => {
    if (!active) return;
    // Jeda baca PANJANG (FLOWERS_HOLD_MS) setelah reveal selesai, supaya
    // daftar bunga masih sempat dibaca sebelum pindah ke section berikutnya.
    const t = setTimeout(onDone, totalMs + FLOWERS_HOLD_MS);
    return () => clearTimeout(t);
  }, [active, totalMs, onDone]);

  return (
    <div className="grid gap-x-12 gap-y-7 sm:grid-cols-2">
      {items.slice(0, visible).map((it, idx) => (
        <motion.div
          layout="position"
          key={it.nama}
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  opacity: { duration: 0.25, ease: EASE },
                  y: SPRING_LAYOUT,
                  layout: SPRING_LAYOUT,
                }
          }
          className="flex items-baseline gap-4"
        >
          <span
            className={`shrink-0 font-display text-sm text-ink/35 transition-opacity duration-500 md:text-base ${
              active ? 'opacity-100' : 'opacity-40'
            }`}
          >
            {String(idx + 1).padStart(2, '0')}
          </span>
          <div>
            {/* Nama puitis (1 kata dari 5 bahasa, makna bunga) tampil besar;
                nama bunga aslinya jadi label kecil di bawahnya. */}
            <BlurWords
              text={it.namaPuitis || it.nama}
              active={active}
              delay={0.15}
              className="font-display text-xl leading-snug tracking-[-0.01em] text-earth md:text-2xl"
            />
            {it.namaPuitis && it.namaPuitis !== it.nama && (
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ink/40">
                {it.nama}
              </p>
            )}
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-ink/55 md:text-sm">
              {it.alasan.split(' ').map((w, i) =>
                active ? (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    transition={{
                      duration: 0.4,
                      delay: 0.35 + i * (REASON_WORD_MS / 1000),
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
        </motion.div>
      ))}
    </div>
  );
}
