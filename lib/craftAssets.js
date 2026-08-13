/**
 * Assets for the interactive bouquet workbench — the transparent flower
 * cutouts in /public/flowerstrail. `radius` is the flower head size in
 * canvas px used for physics + rendering; `scale` is the starting scale.
 */

export const CRAFT_CATEGORIES = [
  { id: 'flowers', label: 'Flowers' },
  { id: 'foliage', label: 'Foliage' },
  { id: 'decor', label: 'Decor' },
];

export const CRAFT_ASSETS = [
  // ── Flowers ──
  { id: 'garden-rose', name: 'Garden Rose', category: 'flowers', src: '/flowerstrail/flower1.png', price: 15000, radius: 30, scale: 1 },
  { id: 'peony', name: 'Peony', category: 'flowers', src: '/flowerstrail/flower2.png', price: 22000, radius: 33, scale: 1 },
  { id: 'dahlia', name: 'Dahlia', category: 'flowers', src: '/flowerstrail/flower3.png', price: 18000, radius: 29, scale: 1 },
  { id: 'anemone', name: 'Anemone', category: 'flowers', src: '/flowerstrail/flower4.png', price: 16000, radius: 27, scale: 1 },
  { id: 'sunflower', name: 'Sunflower', category: 'flowers', src: '/flowerstrail/flower5.png', price: 12000, radius: 31, scale: 1 },
  // ── Foliage ──
  { id: 'eucalyptus', name: 'Eucalyptus', category: 'foliage', src: '/flowerstrail/flower6.png', price: 6000, radius: 26, scale: 1 },
  { id: 'fern', name: 'Fern', category: 'foliage', src: '/flowerstrail/flower7.png', price: 7000, radius: 24, scale: 1 },
  { id: 'pampas', name: 'Pampas', category: 'foliage', src: '/flowerstrail/flower8.png', price: 9000, radius: 23, scale: 1 },
  // ── Decor ──
  { id: 'berry-sprig', name: 'Berry Sprig', category: 'decor', src: '/flowerstrail/flower9.png', price: 10000, radius: 22, scale: 1 },
  { id: 'lotus', name: 'Lotus', category: 'decor', src: '/flowerstrail/flower10.png', price: 20000, radius: 28, scale: 1 },
];

export const getCraftAsset = (id) => CRAFT_ASSETS.find((a) => a.id === id);
