/**
 * Assets for the interactive bouquet workbench — multi-pose flower variants
 * from /public/flowers (served from Supabase Storage, bucket `craft`).
 * Each flower type has 4 pose variants (front, left, right, free).
 * `radius` is the flower head size in canvas px used for physics + rendering;
 * `scale` is the starting scale.
 */

import { storageUrl } from '@/lib/supabase';

export const CRAFT_CATEGORIES = [
  { id: 'flowers', label: 'Flowers' },
  { id: 'foliage', label: 'Foliage' },
  { id: 'decor', label: 'Decor' },
];

export const CRAFT_ASSETS = [
  // ── Container ──
  {
    id: 'wrap-bouquet',
    name: 'Wrap Bouquet',
    category: 'container',
    src: '/containers/wrap-cone.png',
    price: 0,
  },
  // ── Flowers with Multi-Pose Support ──
  {
    id: 'anthurium',
    name: 'Anthurium',
    category: 'flowers',
    srcTemplate: '/flowers/anthurium/anthurium_{pose}.webp',
    poses: ['front', 'left', 'right', 'free'],
    price: 18000,
    radius: 30,
    scale: 1,
  },
  {
    id: 'dahlia',
    name: 'Dahlia',
    category: 'flowers',
    srcTemplate: '/flowers/dahlia/dahlia_{pose}.webp',
    poses: ['front', 'left', 'right', 'free'],
    price: 20000,
    radius: 32,
    scale: 1,
  },
  {
    id: 'lily',
    name: 'Lily',
    category: 'flowers',
    srcTemplate: '/flowers/lily/lily_{pose}.webp',
    poses: ['front', 'left', 'right', 'free'],
    price: 25000,
    radius: 34,
    scale: 1,
  },
  {
    id: 'rose_pink',
    name: 'Pink Rose',
    category: 'flowers',
    srcTemplate: '/flowers/rose_pink/rose_pink_{pose}.webp',
    poses: ['front', 'left', 'right', 'free'],
    price: 22000,
    radius: 28,
    scale: 1,
  },
  {
    id: 'rose_white',
    name: 'White Rose',
    category: 'flowers',
    srcTemplate: '/flowers/rose_white/rose_white_{pose}.webp',
    poses: ['front', 'left', 'right', 'free'],
    price: 22000,
    radius: 28,
    scale: 1,
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    category: 'flowers',
    srcTemplate: '/flowers/sunflower/sunflower_{pose}.webp',
    poses: ['front', 'left', 'right', 'free'],
    price: 15000,
    radius: 36,
    scale: 1,
  },
];

export const POSE_LABELS = {
  front: 'Front',
  left: 'Left',
  right: 'Right',
  free: 'Free',
};

/**
 * Get craft asset by ID with optional pose selection.
 * @param {string} id - Asset ID (e.g., 'rose_pink')
 * @param {string} pose - Pose variant ('front', 'left', 'right', 'free'). Defaults to 'front'.
 * @returns {object|undefined} Asset object with src path resolved from template
 */
export const getCraftAsset = (id, pose = 'front') => {
  const asset = CRAFT_ASSETS.find((a) => a.id === id);
  if (!asset) return undefined;
  
  // Replace {pose} placeholder in srcTemplate with actual pose, then map the
  // local path to its Supabase Storage URL (storageUrl is applied AFTER the
  // placeholder substitution so {pose} isn't URL-encoded).
  const src = storageUrl(asset.srcTemplate.replace('{pose}', pose));
  
  return {
    ...asset,
    src,
  };
};

/**
 * Get available poses for a flower type.
 * @param {string} id - Asset ID (e.g., 'rose_pink')
 * @returns {string[]|undefined} Array of pose names or undefined if asset not found
 */
export const getFlowerPoses = (id) => {
  const asset = CRAFT_ASSETS.find((a) => a.id === id);
  return asset?.poses;
};

/**
 * Get the full path to a specific flower pose asset.
 * @param {string} id - Asset ID (e.g., 'rose_pink')
 * @param {string} pose - Pose variant ('front', 'left', 'right', 'free')
 * @returns {string|undefined} Full path to the asset or undefined if not found
 */
export const getFlowerPoseSrc = (id, pose) => {
  const asset = getCraftAsset(id, pose);
  return asset?.src;
};

/**
 * All craft flower PNGs are normalized onto the same 400×800 transparent
 * canvas, so every flower renders at a uniform aspect (1:2) — the stem is
 * always twice as tall as it is wide, whatever the flower type.
 */
export const FLOWER_CANVAS = { w: 400, h: 800 };

/**
 * Display size of a flower for a given scale. Width is driven by the head
 * radius (`radius`), height follows the uniform 1:2 canvas aspect.
 * @returns {{ w: number, h: number }} width/height in canvas px
 */
export function flowerDisplaySize(asset, scale = 1) {
  const r = asset?.radius || 28;
  const w = r * 2 * scale;
  return { w, h: w * (FLOWER_CANVAS.h / FLOWER_CANVAS.w) };
}
