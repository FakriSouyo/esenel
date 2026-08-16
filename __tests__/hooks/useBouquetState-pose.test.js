import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBouquetState } from '@/hooks/useBouquetState';

describe('useBouquetState — pose switching & z-order', () => {
  beforeEach(() => {
    // Reset module-level id sequence so tests are deterministic.
    // (seq is module-scoped; ids only need uniqueness within a run.)
  });

  it('should switch the pose of an existing flower via setPose', () => {
    const { result } = renderHook(() => useBouquetState());

    act(() => {
      result.current.addItem('rose_pink', 'front', { x: 100, y: 200 });
    });

    const id = result.current.items[0].id;
    expect(result.current.items[0].pose).toBe('front');

    act(() => {
      result.current.setPose(id, 'left');
    });

    expect(result.current.items[0].pose).toBe('left');
    // Everything else stays intact
    expect(result.current.items[0].assetId).toBe('rose_pink');
  });

  it('should create an undo step when the pose changes', () => {
    const { result } = renderHook(() => useBouquetState());

    act(() => {
      result.current.addItem('dahlia', { x: 100, y: 200 });
    });
    const id = result.current.items[0].id;
    const pastBefore = result.current.past.length;

    act(() => {
      result.current.setPose(id, 'right');
    });

    expect(result.current.past.length).toBe(pastBefore + 1);
  });

  it('should not reorder the array when setPose is called', () => {
    const { result } = renderHook(() => useBouquetState());

    act(() => {
      result.current.addItem('rose_pink', { x: 100, y: 200 });
      result.current.addItem('lily', { x: 150, y: 250 });
    });

    const orderBefore = result.current.items.map((i) => i.id);
    act(() => {
      result.current.setPose(result.current.items[0].id, 'free');
    });

    expect(result.current.items.map((i) => i.id)).toEqual(orderBefore);
  });

  it('should change the rendered depth when bringing forward (zIndex order)', () => {
    const { result } = renderHook(() => useBouquetState());

    act(() => {
      result.current.addItem('rose_pink', { x: 100, y: 200 }); // zIndex 2000
      result.current.addItem('lily', { x: 150, y: 250 }); // zIndex 2500
    });

    const firstId = result.current.items[0].id;
    const secondId = result.current.items[1].id;

    act(() => {
      result.current.bringForward(firstId);
    });

    // Array order swapped …
    expect(result.current.items[1].id).toBe(firstId);
    expect(result.current.items[0].id).toBe(secondId);
    // … and the zIndex travelled with the slot, so the item that moved
    // forward now renders in front (sorted by zIndex).
    const sorted = [...result.current.items].sort((a, b) => a.zIndex - b.zIndex);
    expect(sorted[sorted.length - 1].id).toBe(firstId);
  });

  it('should not create an undo step when bringing forward the last item', () => {
    const { result } = renderHook(() => useBouquetState());

    act(() => {
      result.current.addItem('rose_pink', { x: 100, y: 200 });
      result.current.addItem('lily', { x: 150, y: 250 });
    });

    const lastId = result.current.items[1].id;
    const pastBefore = result.current.past.length;

    act(() => {
      result.current.bringForward(lastId);
    });

    expect(result.current.items[1].id).toBe(lastId);
    expect(result.current.past.length).toBe(pastBefore);
  });

  it('remapItems should reposition every flower including locked ones, without an undo step', () => {
    const { result } = renderHook(() => useBouquetState());

    act(() => {
      result.current.addItem('rose_pink', { x: 100, y: 200 });
      result.current.addItem('lily', { x: 150, y: 250 });
    });
    const ids = result.current.items.map((i) => i.id);
    act(() => {
      result.current.toggleLock(ids[0]);
    });
    const pastBefore = result.current.past.length;

    act(() => {
      result.current.remapItems((it) => ({ x: it.x * 2, y: it.y * 2 }));
    });

    // Both flowers moved — even the locked one (the bouquet itself moved).
    expect(result.current.items[0].x).toBe(200);
    expect(result.current.items[0].y).toBe(400);
    expect(result.current.items[1].x).toBe(300);
    expect(result.current.items[1].y).toBe(500);
    // zIndex follows the new depth.
    expect(result.current.items[0].zIndex).toBe(4000);
    // It is a layout correction, not a user edit — no undo step.
    expect(result.current.past.length).toBe(pastBefore);
  });

  it('remapItems should leave items unchanged when the mapper returns nothing', () => {
    const { result } = renderHook(() => useBouquetState());

    act(() => {
      result.current.addItem('rose_pink', { x: 100, y: 200 });
    });

    act(() => {
      result.current.remapItems(() => null);
    });

    expect(result.current.items[0].x).toBe(100);
    expect(result.current.items[0].y).toBe(200);
  });
});
