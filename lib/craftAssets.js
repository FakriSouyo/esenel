/**
 * Assets for the interactive bouquet workbench — multi-pose flower variants
 * from /public/flowers. Each flower type has 4 pose variants (front, left, right, free).
 * `radius` is the flower head size in canvas px used for physics + rendering;
 * `scale` is the starting scale.
 */

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
    srcTemplate: '/flowers/anthurium/anthurium_{pose}.png',
    poses: ['front', 'left', 'right', 'free'],
    price: 18000,
    radius: 30,
    scale: 1,
  },
  {
    id: 'dahlia',
    name: 'Dahlia',
    category: 'flowers',
    srcTemplate: '/flowers/dahlia/dahlia_{pose}.png',
    poses: ['front', 'left', 'right', 'free'],
    price: 20000,
    radius: 32,
    scale: 1,
  },
  {
    id: 'lily',
    name: 'Lily',
    category: 'flowers',
    srcTemplate: '/flowers/lily/lily_{pose}.png',
    poses: ['front', 'left', 'right', 'free'],
    price: 25000,
    radius: 34,
    scale: 1,
  },
  {
    id: 'rose_pink',
    name: 'Pink Rose',
    category: 'flowers',
    srcTemplate: '/flowers/rose_pink/rose_pink_{pose}.png',
    poses: ['front', 'left', 'right', 'free'],
    price: 22000,
    radius: 28,
    scale: 1,
  },
  {
    id: 'rose_white',
    name: 'White Rose',
    category: 'flowers',
    srcTemplate: '/flowers/rose_white/rose_white_{pose}.png',
    poses: ['front', 'left', 'right', 'free'],
    price: 22000,
    radius: 28,
    scale: 1,
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    category: 'flowers',
    srcTemplate: '/flowers/sunflower/sunflower_{pose}.png',
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
  
  // Replace {pose} placeholder in srcTemplate with actual pose
  const src = asset.srcTemplate.replace('{pose}', pose);
  
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
