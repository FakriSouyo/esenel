'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { normalizeName } from '@/lib/nameNormalize';
import { getDummyStory } from '@/lib/nameStoryDummy';
import { products } from '@/data/products';
import NameStory from '@/components/craft/NameStory';

/** Daftar nama buket dari katalog — diteruskan ke AI (dan dummy) supaya
 *  nama buket yang dihasilkan terasa seperti bagian dari katalog. */
const CATALOG_NAMES = Array.from(new Set(products.map((p) => p.name)));

/**
 * "Buat bunga dari namamu" — halaman ritual nama.
 *
 * Alur: input nama (editorial, putih, tanpa navbar/footer) → tekan Enter →
 * tombol input hilang, halaman menampilkan "Thinking" seperti agent loading
 * → respons AI tampil per section, auto-scroll halus ke bawah, teks animasi
 * blur per kata, lalu nama buket di-reveal (scramble), gambar di-generate
 * (pollinations → Supabase Storage), dan section selesai dengan CTA.
 *
 * Story AI dipanggil lewat POST /api/name-story: cache Supabase dulu
 * (kunci = normalizeName), kalau belum ada baru DeepSeek (DEEPSEEK_API_KEY
 * di .env.local), kalau tidak ada key jatuh ke dummy. Gambar lewat
 * POST /api/name-image.
 *
 * Riwayat: story TIDAK disimpan otomatis lagi (refetch dari cache Supabase
 * cepat dan hasilnya selalu segar). Yang disimpan cuma daftar nama yang
 * pernah dipakai (localStorage, kecil) untuk dropdown autocomplete di input
 * — user tetap mengetik/memilih nama ulang, tidak pernah di-resume diam-diam.
 */
const HISTORY_KEY = 'esenel.nameHistory.v1';

export default function NameBouquetPage() {
  const router = useRouter();
  const [stage, setStage] = useState('input'); // input | thinking | story
  const [name, setName] = useState('');
  const [story, setStory] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef(null);

  // Masuk ke alur nama = mulai fresh: buang buket nama yang belum jadi dari
  // sesi sebelumnya (kalau ada) supaya checkout tidak memakai data basi.
  useEffect(() => {
    try {
      window.sessionStorage.removeItem('esenel.directItem.v1');
    } catch {
      // abaikan
    }
  }, []);

  // Baca daftar nama yang pernah dipakai (hanya nama, bukan story).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) {
        setHistory(arr.filter((x) => typeof x === 'string' && x.trim()).slice(0, 5));
      }
    } catch {
      // storage korup / private mode → tanpa riwayat
    }
  }, []);

  // Simpan nama ke riwayat setelah dipakai (dedupe, paling baru di depan).
  const rememberName = (n) => {
    const trimmed = String(n || '').trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const next = [
        trimmed,
        ...prev.filter((x) => x.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 5);
      try {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // penyimpanan penuh / private mode — abaikan
      }
      return next;
    });
  };

  // Escape = jalan keluar diam-diam (halaman ini tanpa navbar). Saat dialog
  // perbesar gambar terbuka (data-attr di body), Escape hanya menutup dialog
  // — jangan langsung keluar halaman.
  useEffect(() => {
    const onKey = (e) => {
      let dialogOpen = false;
      try {
        dialogOpen = document.body.dataset.esenelDialog === 'open';
      } catch {
        // abaikan
      }
      if (e.key === 'Escape' && stage !== 'thinking' && !dialogOpen) {
        router.push('/craft');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    const key = normalizeName(name);
    if (!key) return; // kosong — biarkan fokus untuk mengetik
    setStage('thinking');
    // Minimal 2.2 detik agar state "Thinking" sempat terlihat walau cache
    // Supabase langsung menjawab.
    const started = Date.now();
    let story = null;
    try {
      const res = await fetch('/api/name-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      story = data?.story || null;
    } catch {
      story = null;
    }
    if (!story) story = getDummyStory(name.trim(), CATALOG_NAMES);
    rememberName(name);
    const wait = Math.max(0, 2200 - (Date.now() - started));
    setTimeout(() => {
      setStory(story);
      setStage('story');
    }, wait);
  }

  return (
    <>
      {/* Tombol kembali ke halaman craft — pojok kiri atas, selalu tampil
          (input, thinking, maupun story). Halaman ini tanpa navbar, jadi
          tombol ini dan Escape adalah jalan keluarnya. */}
      <button
        type="button"
        onClick={() => router.push('/craft')}
        aria-label="Kembali ke halaman craft"
        className="fixed left-4 top-4 z-[80] grid size-10 place-items-center rounded-full border border-ink/10 bg-cloud/85 text-ink/70 backdrop-blur transition-colors hover:border-ink/30 hover:text-ink"
      >
        <ArrowLeft size={18} />
      </button>

      {stage === 'story' && story ? (
        <NameStory
          story={story}
          onRestart={() => {
            try {
              window.sessionStorage.removeItem('esenel.directItem.v1');
            } catch {
              // abaikan
            }
            setStory(null);
            setName('');
            setStage('input');
          }}
        />
      ) : (
        <main className="flex min-h-screen flex-col justify-center bg-[#F8F9F5]">
      {stage === 'input' ? (
        <div className="flex w-full flex-col items-end">
          <div className="flex h-14 w-full items-center justify-end lg:h-[88px]">
            <div className="ml-10 h-full w-full border-b border-ink/10 lg:w-[50vw]">
              <form
                onSubmit={handleSubmit}
                className="relative mx-auto flex w-full items-center font-display text-4xl tracking-[-0.05em] text-ink lg:!text-6xl"
              >
                <label className="flex w-full items-center pr-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setShowHistory(true)}
                    onBlur={() =>
                      // tunda sebentar supaya klik dropdown sempat kebaca
                      setTimeout(() => setShowHistory(false), 180)
                    }
                    placeholder="Tulis namamu…"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={40}
                    className="relative z-50 h-full w-full border-none bg-transparent pr-4 text-ink placeholder:text-ink/25 focus:outline-none focus:ring-0"
                  />
                  <button
                    type="submit"
                    aria-label="Kirim nama"
                    className="flex h-full cursor-pointer items-center justify-center whitespace-nowrap pr-4 text-ink/60 transition-colors hover:text-ink"
                  >
                    →
                  </button>
                </label>
              </form>
            </div>
          </div>

          {/* Riwayat nama yang pernah dipakai — baris chip yang bisa digeser
              ke samping di mobile (nama panjang tetap kebaca), klik untuk
              mengisi ulang (story tetap di-fetch segar dari cache Supabase,
              bukan resume). */}
          {showHistory && history.length > 0 && (
            <div className="ml-10 w-[calc(100%-2.5rem)] lg:w-[50vw]">
              <div className="pt-5">
                <p className="text-[10px] tracking-[0.24em] font-medium uppercase text-ink/35">
                  Namamu sebelumnya
                </p>
                <div
                  className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:[mask-image:none] [mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)]"
                  role="list"
                >
                  {history.map((h) => (
                    <button
                      key={h}
                      type="button"
                      role="listitem"
                      onMouseDown={(e) => e.preventDefault() /* jaga fokus input */}
                      onClick={() => {
                        setName(h);
                        setShowHistory(false);
                        inputRef.current?.focus();
                      }}
                      className="flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-ink/10 px-3 py-1.5 font-display text-[13px] tracking-[-0.02em] text-ink/55 transition-colors hover:border-ink/30 hover:text-ink sm:px-3.5 sm:text-sm"
                    >
                      <span className="text-[10px] text-ink/25">↳</span>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <div className="flex items-baseline gap-1.5 font-display text-3xl tracking-[-0.02em] text-ink md:text-5xl">
            <span>Thinking</span>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0.15, 1, 0.15] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.22 }}
              >
                .
              </motion.span>
            ))}
          </div>
        </div>
          )}
        </main>
      )}
    </>
  );
}
