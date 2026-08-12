/**
 * ============================================================
 * PRODUCT DATA — PLACEHOLDER
 * ============================================================
 * No real ESENEL catalog (screenshots / product sheet) was
 * supplied to Claude when this project was generated.
 *
 * These products, prices, and categories are PLACEHOLDERS only,
 * structured so the real ESENEL catalog can replace them by
 * editing THIS FILE ONLY — no component needs to change.
 *
 * Every part of the UI (filters, mega menu, collection pages,
 * product grid, product detail) is derived from this array.
 * Replace `image` with real ESENEL photography paths when ready
 * (e.g. "/products/melodie.jpg").
 * ============================================================
 */

export const categories = [
  { slug: 'small', label: 'Small' },
  { slug: 'medium', label: 'Medium' },
  { slug: 'large', label: 'Large' },
  { slug: 'extra-large', label: 'Extra Large' },
  { slug: 'vase', label: 'Vase' },
  { slug: 'flower-board', label: 'Flower Board' },
];

export const products = [
  {
    slug: 'melodie',
    name: 'Mélodie',
    category: 'medium',
    subtitle: 'Medium Bouquet',
    price: 350000,
    image:
      'https://images.unsplash.com/photo-1520763185298-1b434c919102?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1520763185298-1b434c919102?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=1200&auto=format&fit=crop',
    ],
    composition: ['Garden rose', 'Ranunculus', 'Eucalyptus'],
    featured: true,
    isNew: true,
    bestSeller: false,
    description:
      'A soft, rounded arrangement built from garden roses and ranunculus, finished with trailing eucalyptus.',
  },
  {
    slug: 'petite-aube',
    name: 'Petite Aube',
    category: 'small',
    subtitle: 'Small Bouquet',
    price: 220000,
    image:
      'https://images.unsplash.com/photo-1487070183336-b863922373d4?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1487070183336-b863922373d4?q=80&w=1200&auto=format&fit=crop',
    ],
    composition: ['Spray rose', 'Daisy', 'Wax flower'],
    featured: true,
    isNew: false,
    bestSeller: true,
    description:
      'A little gesture — a compact hand-tied posy for everyday moments.',
  },
  {
    slug: 'jardin-dore',
    name: 'Jardin Doré',
    category: 'large',
    subtitle: 'Large Bouquet',
    price: 520000,
    image:
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=1200&auto=format&fit=crop',
    ],
    composition: ['Sunflower', 'Dahlia', 'Ruscus'],
    featured: true,
    isNew: false,
    bestSeller: true,
    description:
      'A generous, sun-warmed arrangement for something unforgettable.',
  },
  {
    slug: 'maison-blanche',
    name: 'Maison Blanche',
    category: 'extra-large',
    subtitle: 'Extra Large Bouquet',
    price: 780000,
    image:
      'https://images.unsplash.com/photo-1509927083803-4bd519298ac4?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1509927083803-4bd519298ac4?q=80&w=1200&auto=format&fit=crop',
    ],
    composition: ['White peony', 'Hydrangea', 'Olive branch'],
    featured: false,
    isNew: true,
    bestSeller: false,
    description: 'An abundant, statement-making composition in soft white tones.',
  },
  {
    slug: 'vase-argile',
    name: 'Vase Argile',
    category: 'vase',
    subtitle: 'Arrangement in Vase',
    price: 610000,
    image: '/vase.jpg',
    gallery: ['/vase.jpg'],
    composition: ['Tulip', 'Ranunculus', 'Ceramic vase'],
    featured: true,
    isNew: false,
    bestSeller: false,
    description: 'A seasonal arrangement presented in a hand-glazed ceramic vase.',
  },
  {
    slug: 'planche-fleurie',
    name: 'Planche Fleurie',
    category: 'flower-board',
    subtitle: 'Flower Board',
    price: 465000,
    image:
      'https://images.unsplash.com/photo-1487530811176-3780de880c2d?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1487530811176-3780de880c2d?q=80&w=1200&auto=format&fit=crop',
    ],
    composition: ['Mixed dried florals', 'Wooden board'],
    featured: false,
    isNew: true,
    bestSeller: false,
    description: 'Flowers arranged flat across a natural wood board — a gift that lasts.',
  },
  {
    slug: 'aube-rosee',
    name: 'Aube Rosée',
    category: 'small',
    subtitle: 'Small Bouquet',
    price: 235000,
    image:
      'https://images.unsplash.com/photo-1455659817273-f96807779a8a?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1455659817273-f96807779a8a?q=80&w=1200&auto=format&fit=crop',
    ],
    composition: ['Rose', 'Baby breath'],
    featured: false,
    isNew: false,
    bestSeller: false,
    description: 'A tender, dawn-toned pairing of rose and baby breath.',
  },
  {
    slug: 'champ-dete',
    name: 'Champ d’Été',
    category: 'medium',
    subtitle: 'Medium Bouquet',
    price: 375000,
    image:
      'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?q=80&w=1200&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?q=80&w=1200&auto=format&fit=crop',
    ],
    composition: ['Field flowers', 'Grasses', 'Cosmos'],
    featured: false,
    isNew: false,
    bestSeller: true,
    description: 'A loose, meadow-inspired gathering of summer field flowers.',
  },
];

export function getProductBySlug(slug) {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug) {
  if (!categorySlug || categorySlug === 'all') return products;
  return products.filter((p) => p.category === categorySlug);
}

export function getFeaturedProducts() {
  return products.filter((p) => p.featured);
}
