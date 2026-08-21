'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { getCraftAsset } from '@/lib/craftAssets';
import { clampToTrapezoid } from '@/lib/craftBoundary';

let seq = 0;
const nextId = () => `item-${++seq}-${Date.now().toString(36)}`;

/** Where the current bouquet arrangement is auto-saved (survives exit/refresh). */
const STORAGE_KEY = 'esenel.craft.bouquet.v1';
const SAVE_DEBOUNCE_MS = 500;

/** Load a previously auto-saved arrangement (or empty array). */
function loadPersisted() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && Array.isArray(data.items)) return data.items;
  } catch {
    // corrupt / unavailable storage — start empty
  }
  return [];
}

/**
 * Owns the list of flowers in the bouquet.
 *
 * - Structural changes (add / remove / duplicate / z-order / drag-end /
 *   transform-end) are pushed onto the undo stack; mid-drag updates are not.
 * - Undo / redo walk past / future stacks (keyboard: ⌘Z, ⌘⇧Z).
 * - zIndex is derived from depth (y) so lower flowers render in front.
 * - The arrangement is auto-saved to localStorage (debounced) so an
 *   accidental refresh / exit never loses the user's bouquet.
 */
export function useBouquetState({ persist = true } = {}) {
  const [items, setItems] = useState(() => (persist ? loadPersisted() : []));
  const [selectedId, setSelectedId] = useState(null);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const saveTimerRef = useRef(null);

  // Debounced auto-save of the arrangement.
  useEffect(() => {
    if (!persist) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
      } catch {
        // storage full / unavailable — ignore, not worth breaking the build
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [items, persist]);

  const commit = useCallback((updater) => {
    setItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next === prev) return prev;
      setPast((p) => [...p.slice(-49), prev]);
      setFuture([]);
      return next;
    });
  }, []);

  // ── add (from physics settle) — does NOT auto-select so the toolbar
  // doesn't flash open after every drop. ──
  const addItem = useCallback(
    (assetId, poseOrTransform, transform) => {
      // Support both signatures:
      // 1. addItem(assetId, transform) - legacy
      // 2. addItem(assetId, pose, transform) - new multi-pose support
      let pose = 'front';
      let actualTransform = transform;
      
      if (typeof poseOrTransform === 'string') {
        // New signature: addItem(assetId, pose, transform)
        pose = poseOrTransform;
        actualTransform = transform;
      } else {
        // Legacy signature: addItem(assetId, transform)
        actualTransform = poseOrTransform;
      }
      
      const asset = getCraftAsset(assetId, pose);
      const scale = actualTransform.scale ?? asset?.scale ?? 1;
      const item = {
        id: nextId(),
        assetId,
        pose,
        x: actualTransform.x,
        y: actualTransform.y,
        rotation: actualTransform.rotation ?? 0,
        scale,
        flip: false,
        locked: false,
        zIndex: Math.round(actualTransform.y * 10),
      };
      commit((prev) => [...prev, item]);
      return item.id;
    },
    [commit]
  );

  // Live update while dragging / transforming — NO undo step.
  const updateItem = useCallback((id, patch) => {
    setItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item?.locked) return prev; // Don't update locked items
      return prev.map((it) => (it.id === id ? { ...it, ...patch, zIndex: Math.round((patch.y ?? it.y) * 10) } : it));
    });
  }, []);

  // Canvas layout change (fullscreen / resize): reposition every flower
  // proportionally — including locked ones, since the bouquet itself moved.
  // No undo step: it is not a user edit. `fn` maps { x, y } → new { x, y }.
  const remapItems = useCallback((fn) => {
    setItems((prev) =>
      prev.map((it) => {
        const p = fn(it);
        if (!p) return it;
        return { ...it, x: p.x, y: p.y, zIndex: Math.round(p.y * 10) };
      })
    );
  }, []);

  // End of a drag / transform — one undo step.
  const commitItem = useCallback(
    (id, patch) => {
      commit((prev) => {
        const item = prev.find((it) => it.id === id);
        if (item?.locked) return prev; // Don't commit locked items
        return prev.map((it) => (it.id === id ? { ...it, ...patch, zIndex: Math.round((patch.y ?? it.y) * 10) } : it));
      });
    },
    [commit]
  );

  const removeItem = useCallback(
    (id) => {
      commit((prev) => prev.filter((it) => it.id !== id));
      setSelectedId((sel) => (sel === id ? null : sel));
    },
    [commit]
  );

  const duplicateItem = useCallback(
    (id) => {
      const src = items.find((it) => it.id === id);
      if (!src) return;
      const copy = { ...src, id: nextId(), x: src.x + 14, y: src.y + 14, zIndex: src.zIndex + 1 };
      commit((prev) => [...prev, copy]);
      setSelectedId(copy.id);
    },
    [items, commit]
  );

  const flipItem = useCallback(
    (id) => {
      commit((prev) => prev.map((it) => (it.id === id ? { ...it, flip: !it.flip } : it)));
    },
    [commit]
  );

  // Swap with the neighbour in the array AND carry each slot's zIndex with
  // it — the array move satisfies the public API, the zIndex swap is what
  // actually changes the rendered depth (items are drawn sorted by zIndex),
  // so the Forward/Backward buttons are visible on canvas.
  const swapNeighbour = useCallback((prev, id, dir) => {
    const idx = prev.findIndex((it) => it.id === id);
    const other = idx + dir;
    if (other < 0 || other >= prev.length) return prev;
    const next = [...prev];
    const a = next[idx];
    const b = next[other];
    next[idx] = { ...b, zIndex: a.zIndex };
    next[other] = { ...a, zIndex: b.zIndex };
    return next;
  }, []);

  const bringForward = useCallback(
    (id) => {
      commit((prev) => swapNeighbour(prev, id, +1));
    },
    [commit, swapNeighbour]
  );

  const sendBackward = useCallback(
    (id) => {
      commit((prev) => swapNeighbour(prev, id, -1));
    },
    [commit, swapNeighbour]
  );

  // Switch the pose of an already-placed flower (Front / Left / Right / Free).
  const setPose = useCallback(
    (id, pose) => {
      commit((prev) => prev.map((it) => (it.id === id ? { ...it, pose } : it)));
    },
    [commit]
  );

  const clearAll = useCallback(() => {
    if (items.length === 0) return;
    commit([]);
    setSelectedId(null);
  }, [items.length, commit]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prevItems = p[p.length - 1];
      setItems(prevItems);
      setSelectedId((sel) => (prevItems.some((it) => it.id === sel) ? sel : null));
      setFuture((f) => [items, ...f]);
      return p.slice(0, -1);
    });
  }, [items]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const nextItems = f[0];
      setItems(nextItems);
      setSelectedId((sel) => (nextItems.some((it) => it.id === sel) ? sel : null));
      setPast((p) => [...p, items]);
      return f.slice(1);
    });
  }, [items]);

  // Scatter everything a little inside the bouquet (no physics re-run). When
  // `bounds` is given, every shuffled flower is clamped to the drag limit, so
  // the arrangement can never end up covering the paper below the mouth.
  const shuffle = useCallback(
    (bounds) => {
      if (items.length === 0) return;
      commit((prev) =>
        prev.map((it) => {
          // Small, gentle scatter — flowers stay clustered at the mouth
          // instead of jumping far up/down/sideways (the trapezoid clamp
          // catches anything that would leave the region).
          const r = 26 + Math.random() * 34;
          const a = Math.random() * Math.PI * 2;
          const d = Math.random() * 0.55;
          let x = it.x + Math.cos(a) * r * d;
          let y = it.y + Math.sin(a) * r * d * 0.55;
          if (bounds) {
            const p = clampToTrapezoid({ x, y }, bounds);
            x = p.x;
            y = p.y;
          }
          return { ...it, x, y, rotation: (Math.random() - 0.5) * 60, zIndex: Math.round(y * 10) };
        })
      );
    },
    [items.length, commit]
  );

  const toggleLock = useCallback(
    (id) => {
      commit((prev) => prev.map((it) => (it.id === id ? { ...it, locked: !it.locked } : it)));
    },
    [commit]
  );

  const selectItem = useCallback(
    (id) => {
      const item = items.find((it) => it.id === id);
      if (item?.locked) {
        return; // Don't select locked items
      }
      setSelectedId(id);
    },
    [items]
  );

  return {
    items,
    selectedId,
    past,
    future,
    addItem,
    updateItem,
    remapItems,
    commitItem,
    removeItem,
    duplicateItem,
    flipItem,
    bringForward,
    sendBackward,
    clearAll,
    undo,
    redo,
    shuffle,
    selectItem,
    toggleLock,
    setPose,
  };
}
