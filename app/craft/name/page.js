'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
 * Resume: story terakhir disimpan di localStorage. Kalau user refresh,
 * halaman langsung balik ke story yang sama (data sama, dari cache
 * Supabase / dummy), bukan ke input — sampai tombol "Tulis nama lain"
 * ditekan, baru input muncul lagi. Tidak butuh JWT: ini data klien murni,
 * bukan data privat per akun.
 */
const STORY_STORAGE_KEY = 'esenel.nameStory.v1';

export default function NameBouquetPage() {
  const router = useRouter();
  const [stage, setStage] = useState('input'); // input | thinking | story
  const [name, setName] = useState('');
  const [story, setStory] = useState(null);
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

  // Refresh → langsung resume story yang terakhir (kalau ada).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORY_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.story && saved?.name) {
        setName(saved.name);
        setStory(saved.story);
        setStage('story');
      }
    } catch {
      // storage korup → biarkan di input
    }
  }, []);

  // Escape = jalan keluar diam-diam (halaman ini tanpa navbar).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && stage !== 'thinking') router.push('/craft');
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
    // Simpan hasilnya supaya refresh tidak mengulang dari input.
    try {
      window.localStorage.setItem(
        STORY_STORAGE_KEY,
        JSON.stringify({ name: name.trim(), story })
      );
    } catch {
      // penyimpanan penuh / private mode — abaikan
    }
    const wait = Math.max(0, 2200 - (Date.now() - started));
    setTimeout(() => {
      setStory(story);
      setStage('story');
    }, wait);
  }

  if (stage === 'story' && story) {
    return (
      <NameStory
        story={story}
        onRestart={() => {
          try {
            window.localStorage.removeItem(STORY_STORAGE_KEY);
            window.sessionStorage.removeItem('esenel.directItem.v1');
          } catch {
            // abaikan
          }
          setStory(null);
          setName('');
          setStage('input');
        }}
      />
    );
  }

  return (
    <main className="flex min-h-screen flex-col justify-center bg-[#F8F9F5]">
      {stage === 'input' ? (
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
  );
}
