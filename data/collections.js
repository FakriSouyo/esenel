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
];

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
};
