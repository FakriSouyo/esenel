/**
 * Flower & craft options — PLACEHOLDER data.
 * Replace with real ESENEL-supported flower varieties, wrapping
 * options, and pricing when available. Everything in the Craft
 * builder is derived from this file.
 */

export const craftSizes = [
  { id: 'small', label: 'Small', basePrice: 220000, stemCount: 6 },
  { id: 'medium', label: 'Medium', basePrice: 350000, stemCount: 10 },
  { id: 'large', label: 'Large', basePrice: 520000, stemCount: 16 },
];

export const craftFlowers = [
  {
    id: 'garden-rose',
    name: 'Garden Rose',
    pricePerStem: 15000,
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'ranunculus',
    name: 'Ranunculus',
    pricePerStem: 18000,
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'daisy',
    name: 'Daisy',
    pricePerStem: 8000,
    image: 'https://images.unsplash.com/photo-1487070183336-b863922373d4?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    pricePerStem: 12000,
    image: 'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: 'eucalyptus',
    name: 'Eucalyptus (greenery)',
    pricePerStem: 6000,
    image: 'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?q=80&w=400&auto=format&fit=crop',
  },
];

export const craftWrappings = [
  { id: 'cloud', name: 'Cloud', hex: '#F8F9F5' },
  { id: 'earth', name: 'Earth Kraft', hex: '#A58F78' },
  { id: 'sand', name: 'Sand Linen', hex: '#DED4C2' },
  { id: 'ink', name: 'Ink Paper', hex: '#20221E' },
];
