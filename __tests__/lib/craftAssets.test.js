import { describe, it, expect } from 'vitest';
import {
  CRAFT_ASSETS,
  POSE_LABELS,
  getCraftAsset,
  getFlowerPoses,
  getFlowerPoseSrc,
} from '@/lib/craftAssets';

describe('craftAssets - Helper Functions', () => {
  describe('POSE_LABELS constant', () => {
    it('should have all four pose labels', () => {
      expect(POSE_LABELS).toEqual({
        front: 'Front',
        left: 'Left',
        right: 'Right',
        free: 'Free',
      });
    });

    it('should have string values for all poses', () => {
      expect(typeof POSE_LABELS.front).toBe('string');
      expect(typeof POSE_LABELS.left).toBe('string');
      expect(typeof POSE_LABELS.right).toBe('string');
      expect(typeof POSE_LABELS.free).toBe('string');
    });
  });

  describe('getCraftAsset', () => {
    it('should return asset with default front pose', () => {
      const asset = getCraftAsset('rose_pink');
      
      expect(asset).toBeDefined();
      expect(asset.id).toBe('rose_pink');
      expect(asset.name).toBe('Pink Rose');
      expect(asset.src).toBe('/flowers/rose_pink/rose_pink_front.png');
    });

    it('should return asset with specified left pose', () => {
      const asset = getCraftAsset('rose_pink', 'left');
      
      expect(asset).toBeDefined();
      expect(asset.id).toBe('rose_pink');
      expect(asset.src).toBe('/flowers/rose_pink/rose_pink_left.png');
    });

    it('should return asset with specified right pose', () => {
      const asset = getCraftAsset('dahlia', 'right');
      
      expect(asset).toBeDefined();
      expect(asset.id).toBe('dahlia');
      expect(asset.src).toBe('/flowers/dahlia/dahlia_right.png');
    });

    it('should return asset with specified free pose', () => {
      const asset = getCraftAsset('lily', 'free');
      
      expect(asset).toBeDefined();
      expect(asset.id).toBe('lily');
      expect(asset.src).toBe('/flowers/lily/lily_free.png');
    });

    it('should return undefined for non-existent asset', () => {
      const asset = getCraftAsset('nonexistent');
      
      expect(asset).toBeUndefined();
    });

    it('should preserve all asset properties', () => {
      const asset = getCraftAsset('anthurium', 'left');
      
      expect(asset).toBeDefined();
      expect(asset.id).toBe('anthurium');
      expect(asset.name).toBe('Anthurium');
      expect(asset.category).toBe('flowers');
      expect(asset.price).toBe(18000);
      expect(asset.radius).toBe(30);
      expect(asset.scale).toBe(1);
      expect(asset.srcTemplate).toBe('/flowers/anthurium/anthurium_{pose}.png');
      expect(asset.poses).toEqual(['front', 'left', 'right', 'free']);
    });

    it('should work for all 6 flower types', () => {
      const flowerIds = ['anthurium', 'dahlia', 'lily', 'rose_pink', 'rose_white', 'sunflower'];
      
      flowerIds.forEach((id) => {
        const asset = getCraftAsset(id);
        expect(asset).toBeDefined();
        expect(asset.id).toBe(id);
        expect(asset.src).toContain(id);
      });
    });

    it('should generate correct src for all 24 pose combinations', () => {
      const flowerIds = ['anthurium', 'dahlia', 'lily', 'rose_pink', 'rose_white', 'sunflower'];
      const poses = ['front', 'left', 'right', 'free'];
      
      flowerIds.forEach((id) => {
        poses.forEach((pose) => {
          const asset = getCraftAsset(id, pose);
          expect(asset).toBeDefined();
          expect(asset.src).toBe(`/flowers/${id}/${id}_${pose}.png`);
        });
      });
    });
  });

  describe('getFlowerPoses', () => {
    it('should return poses array for valid flower', () => {
      const poses = getFlowerPoses('rose_pink');
      
      expect(poses).toBeDefined();
      expect(Array.isArray(poses)).toBe(true);
      expect(poses).toEqual(['front', 'left', 'right', 'free']);
    });

    it('should return poses array for all flower types', () => {
      const flowerIds = ['anthurium', 'dahlia', 'lily', 'rose_pink', 'rose_white', 'sunflower'];
      
      flowerIds.forEach((id) => {
        const poses = getFlowerPoses(id);
        expect(poses).toEqual(['front', 'left', 'right', 'free']);
      });
    });

    it('should return undefined for non-existent flower', () => {
      const poses = getFlowerPoses('nonexistent');
      
      expect(poses).toBeUndefined();
    });

    it('should return the same reference from asset definition', () => {
      const asset = CRAFT_ASSETS.find((a) => a.id === 'rose_pink');
      const poses = getFlowerPoses('rose_pink');
      
      expect(poses).toBe(asset.poses);
    });
  });

  describe('getFlowerPoseSrc', () => {
    it('should return correct src path for valid flower and pose', () => {
      const src = getFlowerPoseSrc('rose_pink', 'left');
      
      expect(src).toBe('/flowers/rose_pink/rose_pink_left.png');
    });

    it('should return correct src for all poses of a flower', () => {
      const poses = ['front', 'left', 'right', 'free'];
      
      poses.forEach((pose) => {
        const src = getFlowerPoseSrc('dahlia', pose);
        expect(src).toBe(`/flowers/dahlia/dahlia_${pose}.png`);
      });
    });

    it('should return correct src for all flower types with same pose', () => {
      const flowerIds = ['anthurium', 'dahlia', 'lily', 'rose_pink', 'rose_white', 'sunflower'];
      
      flowerIds.forEach((id) => {
        const src = getFlowerPoseSrc(id, 'front');
        expect(src).toBe(`/flowers/${id}/${id}_front.png`);
      });
    });

    it('should return undefined for non-existent flower', () => {
      const src = getFlowerPoseSrc('nonexistent', 'front');
      
      expect(src).toBeUndefined();
    });

    it('should work for all 24 combinations', () => {
      const flowerIds = ['anthurium', 'dahlia', 'lily', 'rose_pink', 'rose_white', 'sunflower'];
      const poses = ['front', 'left', 'right', 'free'];
      
      flowerIds.forEach((id) => {
        poses.forEach((pose) => {
          const src = getFlowerPoseSrc(id, pose);
          expect(src).toBe(`/flowers/${id}/${id}_${pose}.png`);
        });
      });
    });
  });

  describe('Integration - Helper Functions Work Together', () => {
    it('should use getCraftAsset internally in getFlowerPoseSrc', () => {
      const asset = getCraftAsset('lily', 'right');
      const src = getFlowerPoseSrc('lily', 'right');
      
      expect(src).toBe(asset.src);
    });

    it('should provide consistent data across all helpers', () => {
      const id = 'sunflower';
      const pose = 'left';
      
      const asset = getCraftAsset(id, pose);
      const poses = getFlowerPoses(id);
      const src = getFlowerPoseSrc(id, pose);
      
      expect(asset.src).toBe(src);
      expect(poses).toContain(pose);
      expect(asset.poses).toEqual(poses);
    });
  });
});
