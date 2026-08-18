'use client';

/**
 * Halaman link yang dibagikan (/craft/name/<nameKey>) — user yang membuka
 * link langsung melihat hasil generate: NameStory auto-play dari section
 * pertama sampai selesai (tanpa input nama). Tombol kembali ke /craft di
 * pojok kiri atas, sama seperti halaman ritual biasa.
 */

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import NameStory from '@/components/craft/NameStory';

export default function NameSharePage({ story }) {
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => router.push('/craft')}
        aria-label="Kembali ke halaman craft"
        className="fixed left-4 top-4 z-[80] grid size-10 place-items-center rounded-full border border-ink/10 bg-cloud/85 text-ink/70 backdrop-blur transition-colors hover:border-ink/30 hover:text-ink"
      >
        <ArrowLeft size={18} />
      </button>
      <NameStory story={story} onRestart={() => router.push('/craft/name')} />
    </>
  );
}
