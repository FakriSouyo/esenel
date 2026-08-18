import { ogImage } from '@/lib/site';

/** Metadata untuk halaman ritual nama — page.js-nya client component, jadi
 *  metadata diekspor dari layout server ini. */
export const metadata = {
  title: 'Name — ESENEL',
  description: 'Turn a name into a bouquet — meanings, stories, and flowers that match.',
  openGraph: {
    title: 'Name — ESENEL',
    description: 'Turn a name into a bouquet — meanings, stories, and flowers that match.',
    images: [ogImage('name')],
  },
};

export default function NameBouquetLayout({ children }) {
  return children;
}
