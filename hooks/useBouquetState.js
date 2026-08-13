'use client';

import { useCallback, useRef, useState } from 'react';
import { getCraftAsset } from '@/lib/craftAssets';

let seq = 0;
const nextId = () => `item-${++seq}-${Date.now().toString(36)}`;

/**
 * Owns the list of flowers in the bouquet.
 *
 * - Structural changes (add / remove / duplicate / z-order / drag-end /
 *   transform-end) are pushed onto the undo stack; mid-drag updates are not.
 * - Undo / redo walk past / future stacks (keyboard: ⌘Z, ⌘⇧Z).
 * - zIndex is derived from depth (y) so lower flowers render in front.
 */
export function useBouquetState() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

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
    (assetId, transform) => {
      const asset = getCraftAsset(assetId);
      const scale = transform.scale ?? asset?.scale ?? 1;
      const item = {
        id: nextId(),
        assetId,
        x: transform.x,
        y: transform.y,
        rotation: transform.rotation ?? 0,
        scale,
        flip: false,
        zIndex: Math.round(transform.y * 10),
      };
      commit((prev) => [...prev, item]);
      return item.id;
    },
    [commit]
  );

  // Live update while dragging / transforming — NO undo step.
  const updateItem = useCallback((id, patch) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch, zIndex: Math.round((patch.y ?? it.y) * 10) } : it))
    );
  }, []);

  // End of a drag / transform — one undo step.
  const commitItem = useCallback(
    (id, patch) => {
      commit((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...patch, zIndex: Math.round((patch.y ?? it.y) * 10) } : it))
      );
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

  const bringForward = useCallback(
    (id) => {
      commit((prev) => {
        const idx = prev.findIndex((it) => it.id === id);
        if (idx < 0 || idx >= prev.length - 1) return prev;
        const next = [...prev];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        return next;
      });
    },
    [commit]
  );

  const sendBackward = useCallback(
    (id) => {
      commit((prev) => {
        const idx = prev.findIndex((it) => it.id === id);
        if (idx <= 0) return prev;
        const next = [...prev];
        [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
        return next;
      });
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

  // Scatter everything a little inside the vase (no physics re-run).
  const shuffle = useCallback(() => {
    if (items.length === 0) return;
    commit((prev) =>
      prev.map((it) => {
        const asset = getCraftAsset(it.assetId);
        const r = 90 + Math.random() * 40;
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * 0.55;
        const x = it.x + Math.cos(a) * r * d;
        const y = it.y + Math.sin(a) * r * d * 0.8;
        return { ...it, x, y, rotation: (Math.random() - 0.5) * 60, zIndex: Math.round(y * 10) };
      })
    );
  }, [items.length, commit]);

  const selectItem = useCallback((id) => setSelectedId(id), []);

  return {
    items,
    selectedId,
    past,
    future,
    addItem,
    updateItem,
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
  };
}
