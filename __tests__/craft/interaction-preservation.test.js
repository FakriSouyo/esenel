/**
 * Preservation Property Tests - Interaction Patterns
 * 
 * **Validates: Requirements 3.1-3.23**
 * 
 * **Property 2: Preservation** - Existing Interaction Patterns
 * 
 * **IMPORTANT**: This test suite captures CURRENT behavior that must be preserved.
 * These tests are written against the ORIGINAL code BEFORE the enhancement.
 * 
 * **EXPECTED OUTCOME**: All tests PASS on current code (baseline behavior).
 * After enhancement, these tests must STILL PASS (no regressions).
 * 
 * This test suite verifies:
 * 1. Core Interaction Patterns (drag, rotate, scale, flip)
 * 2. State Management (undo/redo, selection, duplicate, delete)
 * 3. Z-Order Management (forward/backward, depth-based rendering)
 * 4. Item Structure and Behavior
 * 5. History and Undo/Redo Stack Behavior
 * 6. Edge Cases and Boundary Conditions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBouquetState } from '@/hooks/useBouquetState';
import { CRAFT_ASSETS, getCraftAsset } from '@/lib/craftAssets';

describe('Property 2: Preservation - Existing Interaction Patterns', () => {
  
  describe('Core Interaction Patterns - Item Creation and Basic Operations', () => {
    it('should add item with correct structure when addItem is called', () => {
      // **Validates: Requirements 3.1, 3.9**
      // Verifies addItem creates item with proper fields: id, assetId, x, y, rotation, scale, flip, zIndex
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200, rotation: 0 });
      });
      
      expect(result.current.items).toHaveLength(1);
      
      const item = result.current.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('assetId', 'rose_pink');
      expect(item).toHaveProperty('x', 100);
      expect(item).toHaveProperty('y', 200);
      expect(item).toHaveProperty('rotation', 0);
      expect(item).toHaveProperty('scale');
      expect(item).toHaveProperty('flip', false);
      expect(item).toHaveProperty('zIndex');
      expect(typeof item.id).toBe('string');
      expect(typeof item.scale).toBe('number');
      expect(typeof item.zIndex).toBe('number');
    });

    it('should derive zIndex from y-coordinate (y * 10)', () => {
      // **Validates: Requirement 3.12**
      // Verifies zIndex is calculated as Math.round(y * 10) for depth-based rendering
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 50 });
      });
      
      const item = result.current.items[0];
      expect(item.zIndex).toBe(Math.round(50 * 10)); // 500
    });

    it('should NOT auto-select newly added item', () => {
      // **Validates: Requirement 3.6**
      // Verifies addItem does NOT set selectedId (toolbar doesn't flash open)
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      expect(result.current.selectedId).toBeNull();
    });

    it('should use asset scale property if transform.scale not provided', () => {
      // **Validates: Requirement 3.21**
      // Verifies asset definition structure (scale property) is used
      
      const { result } = renderHook(() => useBouquetState());
      const asset = getCraftAsset('rose_pink');
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const item = result.current.items[0];
      expect(item.scale).toBe(asset.scale);
    });

    it('should use provided scale from transform if available', () => {
      // **Validates: Requirement 3.3**
      // Verifies custom scale can override asset default
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200, scale: 1.5 });
      });
      
      const item = result.current.items[0];
      expect(item.scale).toBe(1.5);
    });
  });

  describe('Real-Time Updates - Drag and Transform Interactions', () => {
    it('should update item position in real-time with updateItem (no undo step)', () => {
      // **Validates: Requirement 3.1**
      // Verifies drag creates real-time updates without undo history entries
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemId = result.current.items[0].id;
      const pastLengthBefore = result.current.past.length;
      
      // Simulate dragging (real-time updates)
      act(() => {
        result.current.updateItem(itemId, { x: 110, y: 210 });
      });
      
      // Item position updated
      expect(result.current.items[0].x).toBe(110);
      expect(result.current.items[0].y).toBe(210);
      
      // No undo step added
      expect(result.current.past.length).toBe(pastLengthBefore);
    });

    it('should update zIndex when y-coordinate changes in updateItem', () => {
      // **Validates: Requirement 3.12**
      // Verifies zIndex is recalculated during drag
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 50 });
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.updateItem(itemId, { y: 80 });
      });
      
      expect(result.current.items[0].zIndex).toBe(Math.round(80 * 10)); // 800
    });

    it('should update rotation in real-time', () => {
      // **Validates: Requirement 3.2**
      // Verifies rotate creates responsive angle updates
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200, rotation: 0 });
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.updateItem(itemId, { rotation: 45 });
      });
      
      expect(result.current.items[0].rotation).toBe(45);
    });

    it('should update scale in real-time', () => {
      // **Validates: Requirement 3.3**
      // Verifies scale creates proportional resizing
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.updateItem(itemId, { scale: 1.8 });
      });
      
      expect(result.current.items[0].scale).toBe(1.8);
    });

    it('should preserve unchanged properties in updateItem', () => {
      // **Validates: Requirements 3.1, 3.2, 3.3**
      // Verifies partial updates don't affect other properties
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200, rotation: 30, scale: 1.2 });
      });
      
      const itemId = result.current.items[0].id;
      const originalRotation = result.current.items[0].rotation;
      const originalScale = result.current.items[0].scale;
      
      act(() => {
        result.current.updateItem(itemId, { x: 150 }); // Only update x
      });
      
      expect(result.current.items[0].x).toBe(150);
      expect(result.current.items[0].rotation).toBe(originalRotation);
      expect(result.current.items[0].scale).toBe(originalScale);
    });
  });

  describe('Committed Changes - Drag End and Transform End', () => {
    it('should commit item changes with undo step using commitItem', () => {
      // **Validates: Requirement 3.5**
      // Verifies drag end creates undo history entry
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemId = result.current.items[0].id;
      const pastLengthBefore = result.current.past.length;
      
      // Commit change (drag end)
      act(() => {
        result.current.commitItem(itemId, { x: 150, y: 250 });
      });
      
      // Item updated
      expect(result.current.items[0].x).toBe(150);
      expect(result.current.items[0].y).toBe(250);
      
      // Undo step added
      expect(result.current.past.length).toBe(pastLengthBefore + 1);
    });

    it('should update zIndex when committing y-coordinate change', () => {
      // **Validates: Requirement 3.12**
      // Verifies zIndex is recalculated on drag end
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 50 });
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.commitItem(itemId, { y: 120 });
      });
      
      expect(result.current.items[0].zIndex).toBe(Math.round(120 * 10)); // 1200
    });

    it('should clear future stack when committing changes', () => {
      // **Validates: Requirement 3.5**
      // Verifies new actions clear redo history
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
      });
      
      // Undo to create future stack
      act(() => {
        result.current.undo();
      });
      
      expect(result.current.future.length).toBeGreaterThan(0);
      
      const itemId = result.current.items[0].id;
      
      // Commit new change
      act(() => {
        result.current.commitItem(itemId, { x: 200 });
      });
      
      // Future stack cleared
      expect(result.current.future).toHaveLength(0);
    });
  });

  describe('Selection Behavior', () => {
    it('should select item when selectItem is called', () => {
      // **Validates: Requirement 3.6**
      // Verifies selection sets selectedId
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.selectItem(itemId);
      });
      
      expect(result.current.selectedId).toBe(itemId);
    });

    it('should allow selecting different items', () => {
      // **Validates: Requirement 3.6**
      // Verifies selection can switch between items
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
      });
      
      const item1Id = result.current.items[0].id;
      const item2Id = result.current.items[1].id;
      
      act(() => {
        result.current.selectItem(item1Id);
      });
      expect(result.current.selectedId).toBe(item1Id);
      
      act(() => {
        result.current.selectItem(item2Id);
      });
      expect(result.current.selectedId).toBe(item2Id);
    });

    it('should clear selection when selected item is removed', () => {
      // **Validates: Requirements 3.6, 3.8**
      // Verifies removeItem clears selection if item was selected
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.selectItem(itemId);
        result.current.removeItem(itemId);
      });
      
      expect(result.current.selectedId).toBeNull();
      expect(result.current.items).toHaveLength(0);
    });

    it('should preserve selection when removing different item', () => {
      // **Validates: Requirements 3.6, 3.8**
      // Verifies removeItem preserves selection of other items
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
      });
      
      const item1Id = result.current.items[0].id;
      const item2Id = result.current.items[1].id;
      
      act(() => {
        result.current.selectItem(item1Id);
        result.current.removeItem(item2Id);
      });
      
      expect(result.current.selectedId).toBe(item1Id);
      expect(result.current.items).toHaveLength(1);
    });
  });

  describe('Flip Interaction', () => {
    it('should toggle flip property when flipItem is called', () => {
      // **Validates: Requirement 3.4**
      // Verifies flip creates horizontal mirroring toggle
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemId = result.current.items[0].id;
      
      // Initially not flipped
      expect(result.current.items[0].flip).toBe(false);
      
      // Flip
      act(() => {
        result.current.flipItem(itemId);
      });
      expect(result.current.items[0].flip).toBe(true);
      
      // Flip again
      act(() => {
        result.current.flipItem(itemId);
      });
      expect(result.current.items[0].flip).toBe(false);
    });

    it('should create undo step when flipping', () => {
      // **Validates: Requirements 3.4, 3.5**
      // Verifies flip creates undo history entry
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemId = result.current.items[0].id;
      const pastLengthBefore = result.current.past.length;
      
      act(() => {
        result.current.flipItem(itemId);
      });
      
      expect(result.current.past.length).toBe(pastLengthBefore + 1);
    });
  });

  describe('Duplicate Interaction', () => {
    it('should create copy with slight offset when duplicateItem is called', () => {
      // **Validates: Requirement 3.7**
      // Verifies duplicate creates identical copy with offset (x+14, y+14)
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200, rotation: 30, scale: 1.2 });
      });
      
      const itemId = result.current.items[0].id;
      const originalItem = result.current.items[0];
      
      act(() => {
        result.current.duplicateItem(itemId);
      });
      
      expect(result.current.items).toHaveLength(2);
      
      const copy = result.current.items[1];
      expect(copy.id).not.toBe(originalItem.id); // Different ID
      expect(copy.assetId).toBe(originalItem.assetId);
      expect(copy.x).toBe(originalItem.x + 14);
      expect(copy.y).toBe(originalItem.y + 14);
      expect(copy.rotation).toBe(originalItem.rotation);
      expect(copy.scale).toBe(originalItem.scale);
      expect(copy.flip).toBe(originalItem.flip);
      expect(copy.zIndex).toBe(originalItem.zIndex + 1);
    });

    it('should auto-select duplicated item', () => {
      // **Validates: Requirement 3.7**
      // Verifies duplicate sets selectedId to new copy
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.duplicateItem(itemId);
      });
      
      const copyId = result.current.items[1].id;
      expect(result.current.selectedId).toBe(copyId);
    });

    it('should create undo step when duplicating', () => {
      // **Validates: Requirements 3.7, 3.5**
      // Verifies duplicate creates undo history entry
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemId = result.current.items[0].id;
      const pastLengthBefore = result.current.past.length;
      
      act(() => {
        result.current.duplicateItem(itemId);
      });
      
      expect(result.current.past.length).toBe(pastLengthBefore + 1);
    });

    it('should handle duplicate on non-existent item gracefully', () => {
      // **Validates: Requirement 3.7**
      // Verifies duplicate returns early if item not found
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      act(() => {
        result.current.duplicateItem('non-existent-id');
      });
      
      // Should still have only 1 item
      expect(result.current.items).toHaveLength(1);
    });
  });

  describe('Remove/Delete Interaction', () => {
    it('should remove item when removeItem is called', () => {
      // **Validates: Requirement 3.8**
      // Verifies delete removes flower from arrangement
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
      });
      
      const item1Id = result.current.items[0].id;
      
      act(() => {
        result.current.removeItem(item1Id);
      });
      
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].assetId).toBe('lily');
    });

    it('should create undo step when removing', () => {
      // **Validates: Requirements 3.8, 3.5**
      // Verifies delete creates undo history entry
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemId = result.current.items[0].id;
      const pastLengthBefore = result.current.past.length;
      
      act(() => {
        result.current.removeItem(itemId);
      });
      
      expect(result.current.past.length).toBe(pastLengthBefore + 1);
    });
  });

  describe('Z-Order Management', () => {
    it('should bring item forward in array when bringForward is called', () => {
      // **Validates: Requirement 3.13**
      // Verifies forward action swaps array positions
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
        result.current.addItem('dahlia', { x: 200, y: 300 });
      });
      
      const item1Id = result.current.items[0].id;
      
      act(() => {
        result.current.bringForward(item1Id);
      });
      
      // First item should now be at index 1
      expect(result.current.items[1].id).toBe(item1Id);
    });

    it('should not change order when bringing forward last item', () => {
      // **Validates: Requirement 3.13**
      // Verifies forward action boundary condition
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
      });
      
      const item2Id = result.current.items[1].id;
      const pastLengthBefore = result.current.past.length;
      
      act(() => {
        result.current.bringForward(item2Id);
      });
      
      // Order unchanged
      expect(result.current.items[1].id).toBe(item2Id);
      // No undo step added (no change)
      expect(result.current.past.length).toBe(pastLengthBefore);
    });

    it('should send item backward in array when sendBackward is called', () => {
      // **Validates: Requirement 3.13**
      // Verifies backward action swaps array positions
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
        result.current.addItem('dahlia', { x: 200, y: 300 });
      });
      
      const item2Id = result.current.items[1].id;
      
      act(() => {
        result.current.sendBackward(item2Id);
      });
      
      // Second item should now be at index 0
      expect(result.current.items[0].id).toBe(item2Id);
    });

    it('should not change order when sending backward first item', () => {
      // **Validates: Requirement 3.13**
      // Verifies backward action boundary condition
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
      });
      
      const item1Id = result.current.items[0].id;
      const pastLengthBefore = result.current.past.length;
      
      act(() => {
        result.current.sendBackward(item1Id);
      });
      
      // Order unchanged
      expect(result.current.items[0].id).toBe(item1Id);
      // No undo step added (no change)
      expect(result.current.past.length).toBe(pastLengthBefore);
    });

    it('should create undo step when changing z-order', () => {
      // **Validates: Requirements 3.13, 3.5**
      // Verifies z-order actions create undo history entries
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
      });
      
      const item1Id = result.current.items[0].id;
      const pastLengthBefore = result.current.past.length;
      
      act(() => {
        result.current.bringForward(item1Id);
      });
      
      expect(result.current.past.length).toBe(pastLengthBefore + 1);
    });
  });

  describe('Undo/Redo History Management', () => {
    it('should undo last action when undo is called', () => {
      // **Validates: Requirement 3.5, 3.19**
      // Verifies undo (⌘Z) restores previous state
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
      });
      
      expect(result.current.items).toHaveLength(2);
      
      act(() => {
        result.current.undo();
      });
      
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].assetId).toBe('rose_pink');
    });

    it('should redo previously undone action when redo is called', () => {
      // **Validates: Requirement 3.5, 3.20**
      // Verifies redo (⌘⇧Z or ⌘Y) restores undone state
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
      });
      
      act(() => {
        result.current.undo();
      });
      
      expect(result.current.items).toHaveLength(1);
      
      act(() => {
        result.current.redo();
      });
      
      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[1].assetId).toBe('lily');
    });

    it('should maintain past stack with max 50 items', () => {
      // **Validates: Requirement 3.5**
      // Verifies history is limited to 50 entries (slice(-49))
      
      const { result } = renderHook(() => useBouquetState());
      
      // Add 52 items to test limit
      act(() => {
        for (let i = 0; i < 52; i++) {
          result.current.addItem('rose_pink', { x: i * 10, y: 100 });
        }
      });
      
      // Past should be capped at 50
      expect(result.current.past.length).toBeLessThanOrEqual(50);
    });

    it('should clear future stack when new action is performed after undo', () => {
      // **Validates: Requirement 3.5**
      // Verifies new actions clear redo history
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
      });
      
      act(() => {
        result.current.undo();
      });
      
      expect(result.current.future.length).toBeGreaterThan(0);
      
      act(() => {
        result.current.addItem('dahlia', { x: 200, y: 300 });
      });
      
      expect(result.current.future).toHaveLength(0);
    });

    it('should preserve selection through undo if item still exists', () => {
      // **Validates: Requirements 3.5, 3.6**
      // Verifies undo preserves selection of existing items
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
      });
      
      const item1Id = result.current.items[0].id;
      
      act(() => {
        result.current.selectItem(item1Id);
        result.current.undo();
      });
      
      // Item 1 still exists after undoing item 2
      expect(result.current.selectedId).toBe(item1Id);
    });

    it('should clear selection if selected item is removed by undo', () => {
      // **Validates: Requirements 3.5, 3.6**
      // Verifies undo clears selection if selected item no longer exists
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.selectItem(itemId);
        result.current.undo();
      });
      
      // Item no longer exists
      expect(result.current.items).toHaveLength(0);
      expect(result.current.selectedId).toBeNull();
    });

    it('should handle multiple undo/redo cycles correctly', () => {
      // **Validates: Requirements 3.5, 3.19, 3.20**
      // Verifies undo/redo maintains state integrity through multiple cycles
      
      const { result } = renderHook(() => useBouquetState());
      
      // Start: [] → add item1 → [item1] → add item2 → [item1, item2] → add item3 → [item1, item2, item3]
      // Past stack after adds: [[], [item1], [item1, item2]]
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
        result.current.addItem('dahlia', { x: 200, y: 300 });
      });
      
      expect(result.current.items).toHaveLength(3);
      
      // Undo: moves [item1, item2] from past to current, pushes [item1, item2, item3] to future
      // Past: [[], [item1]]  Current: [item1, item2]  Future: [[item1, item2, item3]]
      act(() => {
        result.current.undo();
      });
      expect(result.current.items).toHaveLength(2);
      
      // Undo again: moves [item1] from past to current, pushes [item1, item2] to future
      // Past: [[]]  Current: [item1]  Future: [[item1, item2], [item1, item2, item3]]
      act(() => {
        result.current.undo();
      });
      expect(result.current.items).toHaveLength(1);
      
      // Redo: takes [item1, item2] from future[0], sets as current, pushes [item1] to past
      // Past: [[], [item1]]  Current: [item1, item2]  Future: [[item1, item2, item3]]
      act(() => {
        result.current.redo();
      });
      expect(result.current.items).toHaveLength(2);
      
      // Redo again: takes [item1, item2, item3] from future[0], sets as current
      // Past: [[], [item1], [item1, item2]]  Current: [item1, item2, item3]  Future: []
      act(() => {
        result.current.redo();
      });
      expect(result.current.items).toHaveLength(3);
      
      // Undo once: back to 2 items
      act(() => {
        result.current.undo();
      });
      expect(result.current.items).toHaveLength(2);
    });

    it('should do nothing when undoing with empty past stack', () => {
      // **Validates: Requirement 3.5**
      // Verifies undo boundary condition
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemCount = result.current.items.length;
      const pastLength = result.current.past.length;
      
      // Undo all
      act(() => {
        for (let i = 0; i < pastLength + 5; i++) {
          result.current.undo();
        }
      });
      
      // Should reach empty state and not error
      expect(result.current.items).toHaveLength(0);
      expect(result.current.past).toHaveLength(0);
    });

    it('should do nothing when redoing with empty future stack', () => {
      // **Validates: Requirement 3.5**
      // Verifies redo boundary condition
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemCount = result.current.items.length;
      
      // Try to redo when no future exists
      act(() => {
        result.current.redo();
        result.current.redo();
      });
      
      // Should not error
      expect(result.current.items).toHaveLength(itemCount);
      expect(result.current.future).toHaveLength(0);
    });
  });

  describe('Clear All Functionality', () => {
    it('should clear all items when clearAll is called', () => {
      // **Validates: Requirement 3.15**
      // Verifies clear action removes all flowers
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 150, y: 250 });
        result.current.addItem('dahlia', { x: 200, y: 300 });
      });
      
      act(() => {
        result.current.clearAll();
      });
      
      expect(result.current.items).toHaveLength(0);
    });

    it('should clear selection when clearing all items', () => {
      // **Validates: Requirements 3.15, 3.6**
      // Verifies clear resets selection
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.selectItem(itemId);
        result.current.clearAll();
      });
      
      expect(result.current.selectedId).toBeNull();
    });

    it('should create undo step when clearing all', () => {
      // **Validates: Requirements 3.15, 3.5**
      // Verifies clear creates undo history entry
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const pastLengthBefore = result.current.past.length;
      
      act(() => {
        result.current.clearAll();
      });
      
      expect(result.current.past.length).toBe(pastLengthBefore + 1);
    });

    it('should do nothing when clearing already empty arrangement', () => {
      // **Validates: Requirement 3.15**
      // Verifies clear early returns on empty state
      
      const { result } = renderHook(() => useBouquetState());
      
      const pastLengthBefore = result.current.past.length;
      
      act(() => {
        result.current.clearAll();
      });
      
      // No undo step added
      expect(result.current.past.length).toBe(pastLengthBefore);
    });
  });

  describe('Shuffle Functionality', () => {
    it('should randomize positions when shuffle is called', () => {
      // **Validates: Requirement 3.15**
      // Verifies shuffle scatters flowers with random offsets
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('lily', { x: 100, y: 200 }); // Same position
      });
      
      const originalX1 = result.current.items[0].x;
      const originalX2 = result.current.items[1].x;
      
      act(() => {
        result.current.shuffle();
      });
      
      // At least one should have changed position (very high probability)
      const newX1 = result.current.items[0].x;
      const newX2 = result.current.items[1].x;
      
      const positionsChanged = newX1 !== originalX1 || newX2 !== originalX2;
      expect(positionsChanged).toBe(true);
    });

    it('should randomize rotations when shuffle is called', () => {
      // **Validates: Requirement 3.15**
      // Verifies shuffle randomizes rotation (-30 to 30 degrees)
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200, rotation: 0 });
      });
      
      act(() => {
        result.current.shuffle();
      });
      
      const rotation = result.current.items[0].rotation;
      // Rotation should be within expected range (-30 to 30)
      expect(rotation).toBeGreaterThanOrEqual(-30);
      expect(rotation).toBeLessThanOrEqual(30);
    });

    it('should update zIndex based on new y-coordinates after shuffle', () => {
      // **Validates: Requirements 3.15, 3.12**
      // Verifies shuffle recalculates zIndex
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      act(() => {
        result.current.shuffle();
      });
      
      const item = result.current.items[0];
      expect(item.zIndex).toBe(Math.round(item.y * 10));
    });

    it('should create undo step when shuffling', () => {
      // **Validates: Requirements 3.15, 3.5**
      // Verifies shuffle creates undo history entry
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const pastLengthBefore = result.current.past.length;
      
      act(() => {
        result.current.shuffle();
      });
      
      expect(result.current.past.length).toBe(pastLengthBefore + 1);
    });

    it('should do nothing when shuffling empty arrangement', () => {
      // **Validates: Requirement 3.15**
      // Verifies shuffle early returns on empty state
      
      const { result } = renderHook(() => useBouquetState());
      
      const pastLengthBefore = result.current.past.length;
      
      act(() => {
        result.current.shuffle();
      });
      
      // No undo step added
      expect(result.current.past.length).toBe(pastLengthBefore);
    });
  });

  describe('Asset Integration', () => {
    it('should use asset definition structure from CRAFT_ASSETS', () => {
      // **Validates: Requirement 3.21**
      // Verifies asset properties (id, name, category, srcTemplate, price, radius, scale, poses)
      
      const asset = getCraftAsset('rose_pink');
      
      expect(asset).toBeDefined();
      expect(asset).toHaveProperty('id', 'rose_pink');
      expect(asset).toHaveProperty('name');
      expect(asset).toHaveProperty('category');
      expect(asset).toHaveProperty('src'); // resolved from srcTemplate
      expect(asset).toHaveProperty('price');
      expect(asset).toHaveProperty('radius');
      expect(asset).toHaveProperty('scale');
      
      expect(typeof asset.price).toBe('number');
      expect(typeof asset.radius).toBe('number');
      expect(typeof asset.scale).toBe('number');
    });

    it('should support all current flower assets', () => {
      // **Validates: Requirements 3.21, 3.22, 3.23**
      // Verifies current 6 flower types with multi-pose support are accessible
      
      const currentFlowerIds = ['anthurium', 'dahlia', 'lily', 'rose_pink', 'rose_white', 'sunflower'];
      
      currentFlowerIds.forEach(assetId => {
        const asset = getCraftAsset(assetId);
        expect(asset).toBeDefined();
        expect(asset.id).toBe(assetId);
      });
    });

    it('should use /flowers paths for current assets', () => {
      // **Validates: Requirement 3.21**
      // Verifies current asset paths use new multi-pose structure
      
      const flowerAssets = CRAFT_ASSETS.filter(asset => asset.category === 'flowers');
      
      flowerAssets.forEach(asset => {
        const assetWithSrc = getCraftAsset(asset.id);
        expect(assetWithSrc.src).toMatch(/\/flowers\/\w+\/\w+_(front|left|right|free)\.webp/);
      });
    });
  });

  describe('Price Calculation Support', () => {
    it('should support calculating total price from items', () => {
      // **Validates: Requirement 3.22**
      // Verifies price calculation using asset prices
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 }); // 22000
        result.current.addItem('sunflower', { x: 150, y: 250 }); // 15000
      });
      
      const totalPrice = result.current.items.reduce((sum, item) => {
        const asset = getCraftAsset(item.assetId);
        return sum + (asset?.price || 0);
      }, 0);
      
      expect(totalPrice).toBe(22000 + 15000); // 37000
    });

    it('should support counting stems by asset type', () => {
      // **Validates: Requirements 3.14, 3.16**
      // Verifies stem count calculation for display
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('rose_pink', { x: 150, y: 250 });
        result.current.addItem('lily', { x: 200, y: 300 });
      });
      
      const stemCounts = result.current.items.reduce((counts, item) => {
        counts[item.assetId] = (counts[item.assetId] || 0) + 1;
        return counts;
      }, {});
      
      expect(stemCounts['rose_pink']).toBe(2);
      expect(stemCounts['lily']).toBe(1);
    });
  });

  describe('Integration - Complex Interaction Sequences', () => {
    it('should handle drag → commit → undo → redo sequence correctly', () => {
      // **Validates: Requirements 3.1, 3.5, 3.19, 3.20**
      // Verifies complex interaction preserves state correctly
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemId = result.current.items[0].id;
      
      // Drag (updateItem - no undo step, just modifies current state)
      act(() => {
        result.current.updateItem(itemId, { x: 150 });
      });
      expect(result.current.items[0].x).toBe(150);
      
      // Commit (creates undo step with current state before commit)
      // The undo step saves the state BEFORE commitItem is called
      // At this point, the item already has x: 150 from updateItem
      // So the undo step saves x: 150
      act(() => {
        result.current.commitItem(itemId, { x: 200 });
      });
      expect(result.current.items[0].x).toBe(200);
      
      // Undo restores the state before commitItem (which was x: 150 from updateItem)
      act(() => {
        result.current.undo();
      });
      expect(result.current.items[0].x).toBe(150);
      
      // Redo restores the committed state (x: 200)
      act(() => {
        result.current.redo();
      });
      expect(result.current.items[0].x).toBe(200);
    });

    it('should handle add → select → duplicate → remove sequence correctly', () => {
      // **Validates: Requirements 3.6, 3.7, 3.8**
      // Verifies selection, duplicate, and remove interactions
      
      const { result } = renderHook(() => useBouquetState());
      
      // Add
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const item1Id = result.current.items[0].id;
      
      // Select
      act(() => {
        result.current.selectItem(item1Id);
      });
      expect(result.current.selectedId).toBe(item1Id);
      
      // Duplicate
      act(() => {
        result.current.duplicateItem(item1Id);
      });
      expect(result.current.items).toHaveLength(2);
      const item2Id = result.current.items[1].id;
      expect(result.current.selectedId).toBe(item2Id); // Auto-selected
      
      // Remove duplicate
      act(() => {
        result.current.removeItem(item2Id);
      });
      expect(result.current.items).toHaveLength(1);
      expect(result.current.selectedId).toBeNull(); // Cleared
    });

    it('should handle multiple transformations with proper zIndex updates', () => {
      // **Validates: Requirements 3.1, 3.2, 3.3, 3.12**
      // Verifies zIndex tracks y-coordinate through multiple operations
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 100 });
      });
      
      const itemId = result.current.items[0].id;
      
      // Move down (y increases)
      act(() => {
        result.current.updateItem(itemId, { y: 200 });
      });
      expect(result.current.items[0].zIndex).toBe(2000);
      
      // Rotate
      act(() => {
        result.current.updateItem(itemId, { rotation: 45 });
      });
      expect(result.current.items[0].zIndex).toBe(2000); // Unchanged
      
      // Scale
      act(() => {
        result.current.updateItem(itemId, { scale: 1.5 });
      });
      expect(result.current.items[0].zIndex).toBe(2000); // Unchanged
      
      // Move up (y decreases)
      act(() => {
        result.current.updateItem(itemId, { y: 50 });
      });
      expect(result.current.items[0].zIndex).toBe(500);
    });

    it('should handle flip → undo → flip → redo correctly', () => {
      // **Validates: Requirements 3.4, 3.5, 3.19, 3.20**
      // Verifies flip interacts correctly with undo/redo
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
      });
      
      const itemId = result.current.items[0].id;
      
      // Flip
      act(() => {
        result.current.flipItem(itemId);
      });
      expect(result.current.items[0].flip).toBe(true);
      
      // Undo flip
      act(() => {
        result.current.undo();
      });
      expect(result.current.items[0].flip).toBe(false);
      
      // Flip again (different from redo)
      act(() => {
        result.current.flipItem(itemId);
      });
      expect(result.current.items[0].flip).toBe(true);
      
      // Redo should do nothing (future cleared)
      act(() => {
        result.current.redo();
      });
      expect(result.current.items[0].flip).toBe(true);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle operations on empty arrangement gracefully', () => {
      // **Validates: All requirements**
      // Verifies operations don't error on empty state
      
      const { result } = renderHook(() => useBouquetState());
      
      expect(() => {
        act(() => {
          result.current.undo();
          result.current.redo();
          result.current.clearAll();
          result.current.shuffle();
          result.current.selectItem('non-existent');
          result.current.updateItem('non-existent', { x: 100 });
          result.current.commitItem('non-existent', { x: 100 });
          result.current.removeItem('non-existent');
          result.current.duplicateItem('non-existent');
          result.current.flipItem('non-existent');
          result.current.bringForward('non-existent');
          result.current.sendBackward('non-existent');
        });
      }).not.toThrow();
    });

    it('should generate unique IDs for each item', () => {
      // **Validates: All requirements**
      // Verifies ID generation creates unique identifiers
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 200 });
        result.current.addItem('rose_pink', { x: 150, y: 250 });
        result.current.addItem('rose_pink', { x: 200, y: 300 });
      });
      
      const ids = result.current.items.map(item => item.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(3); // All unique
    });

    it('should handle very large y-coordinates for zIndex calculation', () => {
      // **Validates: Requirement 3.12**
      // Verifies zIndex calculation doesn't overflow
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: 100, y: 999999 });
      });
      
      expect(result.current.items[0].zIndex).toBe(Math.round(999999 * 10));
    });

    it('should handle negative coordinates', () => {
      // **Validates: Requirements 3.1, 3.12**
      // Verifies negative positions are supported
      
      const { result } = renderHook(() => useBouquetState());
      
      act(() => {
        result.current.addItem('rose_pink', { x: -50, y: -100 });
      });
      
      expect(result.current.items[0].x).toBe(-50);
      expect(result.current.items[0].y).toBe(-100);
      expect(result.current.items[0].zIndex).toBe(Math.round(-100 * 10));
    });
  });
});
