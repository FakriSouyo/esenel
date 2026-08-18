import { ogImage } from '@/lib/site';

/** Metadata untuk halaman ritual nama — page.js-nya client component, jadi
 *  metadata diekspor dari layout server ini. */
export const metadata = {
  title: 'Buat Bunga dari Namamu — ESENEL',
  description: 'Ubah namamu menjadi buket — arti nama, cerita, dan bunga yang cocok untukmu.',
  openGraph: {
    title: 'Buat Bunga dari Namamu — ESENEL',
    description: 'Ubah namamu menjadi buket — arti nama, cerita, dan bunga yang cocok untukmu.',
    images: [ogImage('name')],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buat Bunga dari Namamu — ESENEL',
    description: 'Ubah namamu menjadi buket — arti nama, cerita, dan bunga yang cocok untukmu.',
    images: [ogImage('name')],
  },
};

export default function NameBouquetLayout({ children }) {
  return children;
}
