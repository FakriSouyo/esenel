/**
 * Collection groupings used by the mega menu and /collections page.
 * Derived from the same category slugs as data/products.js so the
 * navigation always reflects real catalog data.
 */

export const collectionGroups = [
  {
    heading: 'Shop by Size',
    items: [
      { slug: 'small', label: 'Small' },
      { slug: 'medium', label: 'Medium' },
      { slug: 'large', label: 'Large' },
      { slug: 'extra-large', label: 'Extra Large' },
    ],
  },
  {
    heading: 'Arrangements',
    items: [
      { slug: 'vase', label: 'Vase' },
      { slug: 'flower-board', label: 'Flower Board' },
    ],
  },
  {
    heading: 'Made to Order',
    items: [{ slug: 'custom', label: 'Custom Bouquet' }],
  },
];

import { storageUrl } from '@/lib/supabase';

// Hero photo for each collection — real catalog shots from public/katalog_esenel,
// served from Supabase Storage.
export const collectionImages = {
  small: storageUrl('/katalog_esenel/Small Bouquet/alba.webp'),
  medium: storageUrl('/katalog_esenel/Medium Bouquet/bali.webp'),
  large: storageUrl('/katalog_esenel/Large Bouquet/amsterdam.webp'),
  'extra-large': storageUrl('/katalog_esenel/Extra Large Bouquet/venice.webp'),
  vase: storageUrl('/katalog_esenel/Vase/bellagio.webp'),
  'flower-board': storageUrl('/katalog_esenel/Papan Bunga/satu.webp'),
  custom: storageUrl('/katalog_esenel/Custom Bouquet/customgift.webp'),
};

export const featuredLinks = [
  { slug: 'new', label: 'New Arrivals' },
  { slug: 'best-sellers', label: 'Best Sellers' },
];

export const collectionCopy = {
  small: { title: 'Small', tagline: 'A little gesture.' },
  medium: { title: 'Medium', tagline: 'For everyday moments.' },
  large: { title: 'Large', tagline: 'For something unforgettable.' },
  'extra-large': { title: 'Extra Large', tagline: 'Make a statement.' },
  vase: { title: 'Vase', tagline: 'Arranged, presented, ready.' },
  'flower-board': { title: 'Flower Board', tagline: 'A gift that lasts.' },
  custom: { title: 'Custom Bouquet', tagline: 'Made to order, made for you.' },
};
