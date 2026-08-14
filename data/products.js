/**
 * ============================================================
 * PRODUCT DATA — ESENEL CATALOG
 * ============================================================
 * The real ESENEL catalog. Product photos live in
 * public/katalog_esenel/<Category Folder>/<file>.png and every
 * product below is derived from those files — name and price
 * come straight from the studio's price list.
 *
 * Every part of the UI (filters, mega menu, collection pages,
 * product grid, product detail) is derived from this file.
 * ============================================================
 */

/**
 * Per-category catalog. Each entry is:
 *   [filename, display name, price (IDR)]
 */
const CATALOG = {
  small: {
    label: 'Small',
    subtitle: 'Small Bouquet',
    folder: 'Small Bouquet',
    entries: [
      ['alba', 'Alba', 50000],
      ['annecy', 'Annecy', 90000],
      ['birmingham', 'Birmingham', 50000],
      ['jeju', 'Jeju', 55000],
      ['karuizawa', 'Karuizawa', 70000],
      ['melaka', 'Melaka', 50000],
      ['nagpur', 'Nagpur', 40000],
      ['oslo', 'Oslo', 38000],
      ['parisi', 'Paris I', 60000],
      ['toulouse', 'Toulouse', 45000],
      ['tuscany', 'Tuscany', 42000],
    ],
  },
  medium: {
    label: 'Medium',
    subtitle: 'Medium Bouquet',
    folder: 'Medium Bouquet',
    entries: [
      ['bali', 'Bali', 63000],
      ['berlin', 'Berlin', 155000],
      ['boston', 'Boston', 125000],
      ['burano', 'Burano', 150000],
      ['cairo', 'Cairo', 128000],
      ['chicago', 'Chicago', 350000],
      ['como', 'Como', 155000],
      ['delhi', 'Delhi', 155000],
      ['florence', 'Florence', 165000],
      ['jaipur', 'Jaipur', 130000],
      ['jeju', 'Jeju', 55000],
      ['kyoto', 'Kyoto', 110000],
      ['kyoto2', 'Kyoto 2', 150000],
      ['lecce', 'Lecce', 90000],
      ['leiden', 'Leiden', 160000],
      ['lisbon', 'Lisbon', 115000],
      ['ljubljana', 'Ljubljana', 115000],
      ['malibu', 'Malibu', 150000],
      ['marrakesh', 'Marrakesh', 170000],
      ['monterrey', 'Monterrey', 160000],
      ['osaka', 'Osaka', 159000],
      ['parispremium', 'Paris Premium', 100000],
      ['petra', 'Petra', 165000],
      ['prague', 'Prague', 145000],
      ['praha', 'Praha', 88000],
      ['riodejaneiro', 'Rio de Janeiro', 160000],
      ['rome', 'Rome', 95000],
      ['sainttropez', 'Saint Tropez', 70000],
      ['santorini', 'Santorini', 105000],
      ['valparaiso', 'Valparaiso', 175000],
      ['varenna', 'Varenna', 105000],
      ['versailles', 'Versailles', 150000],
    ],
  },
  large: {
    label: 'Large',
    subtitle: 'Large Bouquet',
    folder: 'Large Bouquet',
    entries: [
      ['amsterdam', 'Amsterdam', 280000],
      ['athena', 'Athena', 1000000],
      ['bajo', 'Bajo', 300000],
      ['bruges', 'Bruges', 275000],
      ['colmar', 'Colmar', 250000],
      ['como', 'Como', 155000],
      ['delhi', 'Delhi', 155000],
      ['doha', 'Doha', 199000],
      ['edinburgh', 'Edinburgh', 160000],
      ['geneva', 'Geneva', 305000],
      ['giverny', 'Giverny', 325000],
      ['givernycustom', 'Giverny Custom', 220000],
      ['hallstat', 'Hallstat', 200000],
      ['honolulu', 'Honolulu', 259000],
      ['ibiza', 'Ibiza', 195000],
      ['kawazu', 'Kawazu', 270000],
      ['leiden', 'Leiden', 160000],
      ['lombok', 'Lombok', 265000],
      ['male', 'Male', 190000],
      ['manaus', 'Manaus', 180000],
      ['milan', 'Milan', 200000],
      ['monterrey', 'Monterrey', 160000],
      ['paris3', 'Paris 3', 200000],
      ['pisa', 'Pisa', 300000],
      ['pompei', 'Pompei', 470000],
      ['prague', 'Prague', 145000],
      ['riodejaneiro', 'Rio de Janeiro', 160000],
      ['siena', 'Siena', 250000],
      ['tokyo', 'Tokyo', 240000],
      ['vancouver', 'Vancouver', 380000],
    ],
  },
  'extra-large': {
    label: 'Extra Large',
    subtitle: 'Extra Large Bouquet',
    folder: 'Extra Large Bouquet',
    entries: [
      ['brugesxtralarge', 'Bruges Xtra Large', 500000],
      ['newyork', 'New York', 900000],
      ['venice', 'Venice', 460000],
    ],
  },
  vase: {
    label: 'Vase',
    subtitle: 'Arrangement in Vase',
    folder: 'Vase',
    entries: [
      ['aspen', 'Aspen', 210000],
      ['bellagio', 'Bellagio', 750000],
      ['gifu', 'Gifu', 400000],
      ['napoli', 'Napoli', 300000],
      ['seville', 'Seville', 189000],
      ['sydney', 'Sydney', 200000],
    ],
  },
  'flower-board': {
    label: 'Flower Board',
    subtitle: 'Flower Board',
    folder: 'Papan Bunga',
    entries: [['satu', 'Satu', 75000]],
  },
  custom: {
    label: 'Custom Bouquet',
    subtitle: 'Custom Bouquet',
    folder: 'Custom Bouquet',
    entries: [
      ['customgift', 'Custom Gift', 110000],
      ['fruitbouquet', 'Fruit Bouquet', 250000],
    ],
  },
};

export const categories = Object.entries(CATALOG).map(([slug, cat]) => ({
  slug,
  label: cat.label,
}));

/** Rotating composition lists per category. */
const COMPOSITIONS = {
  small: [
    ['Garden rose', 'Spray rose', 'Eucalyptus'],
    ['Tulip', 'Wax flower', 'Ruscus'],
    ['Ranunculus', 'Daisy', 'Eucalyptus'],
  ],
  medium: [
    ['Garden rose', 'Ranunculus', 'Eucalyptus'],
    ['Hydrangea', 'Peony', 'Ruscus'],
    ['Spray rose', 'Lisianthus', 'Eucalyptus'],
  ],
  large: [
    ['Sunflower', 'Dahlia', 'Ruscus'],
    ['Garden rose', 'Hydrangea', 'Eucalyptus'],
    ['Peony', 'Ranunculus', 'Olive branch'],
  ],
  'extra-large': [
    ['Peony', 'Hydrangea', 'Olive branch'],
    ['Garden rose', 'Dahlia', 'Eucalyptus'],
    ['Lily', 'Hydrangea', 'Ruscus'],
  ],
  vase: [
    ['Tulip', 'Ranunculus', 'Ceramic vase'],
    ['Hydrangea', 'Eucalyptus', 'Ceramic vase'],
    ['Peony', 'Spray rose', 'Ceramic vase'],
  ],
  'flower-board': [['Mixed dried florals', 'Wooden board']],
  custom: [
    ['Mixed seasonal blooms', 'Hand-finished wrap'],
    ['Seasonal fruit', 'Mixed florals', 'Gift wrap'],
  ],
};

const DESCRIPTIONS = {
  small: (name) =>
    `${name} — a compact, hand-tied bouquet for everyday moments, wrapped in paper and finished with ribbon.`,
  medium: (name) =>
    `${name} — a rounded medium arrangement of seasonal blooms, hand-tied and wrapped at our Sleman studio.`,
  large: (name) =>
    `${name} — a full, abundant bouquet for something unforgettable, composed with generous seasonal stems.`,
  'extra-large': (name) =>
    `${name} — a statement arrangement with plenty of blooms for the moments that ask for more.`,
  vase: (name) =>
    `${name} — a seasonal arrangement presented in a ceramic vase, ready to display on arrival.`,
  'flower-board': (name) =>
    `${name} — flowers arranged flat across a natural board; a gift that lasts far longer than a week.`,
  custom: (name) =>
    `${name} — made to order with a personal touch, composed by hand at our Sleman studio.`,
};

// Featured / New / Best seller picks (keyed by filename).
const FEATURED = new Set([
  'alba',
  'bali',
  'santorini',
  'amsterdam',
  'tokyo',
  'bellagio',
  'customgift',
]);

const IS_NEW = new Set(['varenna', 'versailles', 'newyork', 'givernycustom', 'fruitbouquet']);

const BEST_SELLERS = new Set(['bali', 'jeju', 'oslo', 'prague', 'santorini', 'amsterdam']);

// Canonical category order — first occurrence of a duplicate filename
// keeps the clean slug (e.g. /shop/como), later ones get a suffix.
const ORDER = ['small', 'medium', 'large', 'extra-large', 'vase', 'flower-board', 'custom'];

const seenSlugs = new Set();

export const products = ORDER.flatMap((slug) => {
  const cat = CATALOG[slug];
  const comps = COMPOSITIONS[slug];
  const describe = DESCRIPTIONS[slug];
  return cat.entries.map(([file, name, price], i) => {
    let productSlug = file;
    if (seenSlugs.has(file)) productSlug = `${file}-${slug}`;
    seenSlugs.add(file);
    return {
      slug: productSlug,
      name,
      category: slug,
      subtitle: cat.subtitle,
      price,
      image: `/katalog_esenel/${cat.folder}/${file}.png`,
      gallery: [`/katalog_esenel/${cat.folder}/${file}.png`],
      composition: comps[i % comps.length],
      featured: FEATURED.has(file),
      isNew: IS_NEW.has(file),
      bestSeller: BEST_SELLERS.has(file),
      description: describe(name),
    };
  });
});

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
