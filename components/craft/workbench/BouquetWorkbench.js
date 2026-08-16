'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Undo2, Redo2, Trash2, Copy, FlipHorizontal2, ChevronUp, ChevronDown, Sparkles, Lock, Unlock } from 'lucide-react';
import { useBouquetState } from '@/hooks/useBouquetState';
import { getCraftAsset, getFlowerPoseSrc, POSE_LABELS } from '@/lib/craftAssets';
import { formatIDR } from '@/lib/format';
import { WRAP_THEMES } from '@/lib/wrapThemes';
import { WRAP_SHAPES } from '@/lib/wrapShapes';
import { AssetPicker } from './AssetPicker';

// react-konva touches the DOM/canvas directly — client only.
const BouquetCanvas = dynamic(() => import('./BouquetCanvas').then((m) => m.BouquetCanvas), { ssr: false });

/**
 * The interactive bouquet builder: tap a flower below and it physically
 * falls into the vase (Matter.js), piling up on the flowers already in
 * there. Settled flowers can be dragged, rotated, scaled, flipped,
 * duplicated, re-ordered, undone and cleared — all themed for ESENEL.
 *
 * Reports the current flower counts upward via `onFlowersChange` so the
 * wizard's price / summary / preview stay in sync.
 */
export function BouquetWorkbench({
  onFlowersChange,
  sizeId = 'medium',
  sizeLabel = 'Medium',
  bouquet: bouquetProp,
  theme: themeProp,
  onThemeChange: onThemeChangeProp,
  shapeId: shapeIdProp,
  onShapeChange: onShapeChangeProp,
}) {
  // When CraftBuilder lifts the state up (so the arrangement survives step
  // navigation), it passes the hook down; otherwise the workbench owns it.
  const internalBouquet = useBouquetState();
  const bouquet = bouquetProp ?? internalBouquet;
  const [dropQueue, setDropQueue] = useState([]);
  const [touched, setTouched] = useState(false);
  const [theme, setTheme] = useState(themeProp ?? 'kraft');
  const [shapeId, setShapeId] = useState(shapeIdProp ?? 'klasik');
  const boundsRef = useRef(null);
  const themeValue = themeProp ?? theme;
  const shapeValue = shapeIdProp ?? shapeId;
  const handleThemeChange = onThemeChangeProp ?? setTheme;
  const handleShapeChange = onShapeChangeProp ?? setShapeId;

  const counts = useMemo(() => {
    const c = {};
    bouquet.items.forEach((it) => {
      c[it.assetId] = (c[it.assetId] || 0) + 1;
    });
    return c;
  }, [bouquet.items]);

  useEffect(() => {
    onFlowersChange?.(counts);
  }, [counts, onFlowersChange]);

  const totalPrice = useMemo(
    () => bouquet.items.reduce((sum, it) => sum + (getCraftAsset(it.assetId, it.pose)?.price || 0), 0),
    [bouquet.items]
  );

  const settled = useMemo(
    () =>
      bouquet.items.map((it) => ({
        id: it.id,
        x: it.x,
        y: it.y,
        radius: (getCraftAsset(it.assetId, it.pose)?.radius || 26) * it.scale,
      })),
    [bouquet.items]
  );

  // Keyboard: ⌘Z / ⌘⇧Z undo-redo, Del removes the selection, Esc deselects.
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && bouquet.selectedId) {
        e.preventDefault();
        bouquet.removeItem(bouquet.selectedId);
      } else if (e.key === 'Escape' && bouquet.selectedId) {
        e.preventDefault();
        bouquet.selectItem(null);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) bouquet.redo();
        else bouquet.undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        bouquet.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bouquet]);

  const handleAssetSelect = (assetId, pose = 'front') => {
    setTouched(true);
    setDropQueue((q) => [
      ...q,
      { reqId: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, assetId, pose },
    ]);
  };

  const handleDropConsumed = (reqId) => {
    setDropQueue((q) => q.filter((r) => r.reqId !== reqId));
  };

  const handleFlowerSettled = (reqId, assetId, transform) => {
    const dropItem = dropQueue.find((item) => item.reqId === reqId);
    const pose = dropItem?.pose || 'front';
    bouquet.addItem(assetId, pose, transform);
  };

  const selected = bouquet.items.find((i) => i.id === bouquet.selectedId) ?? null;
  const selectedAsset = selected ? getCraftAsset(selected.assetId, selected.pose) : null;

  const handleLockedFlowerClick = (id) => {
    if (window.confirm('This flower is locked. Unlock it?')) {
      bouquet.toggleLock(id);
    }
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-sand bg-white shadow-[0_12px_40px_rgba(32,34,30,0.06)]">
      {/* ── header: count + price + global actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand/70 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.18em] uppercase text-ink/40">Bouquet workbench</p>
          <p className="mt-0.5 truncate text-sm text-ink/70">
            {bouquet.items.length === 0
              ? `Tap a flower below to drop it in · ${sizeLabel} bouquet`
              : `${bouquet.items.length} ${bouquet.items.length === 1 ? 'stem' : 'stems'} · ${formatIDR(totalPrice)} · ${sizeLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn onClick={bouquet.undo} disabled={!bouquet.past.length} title="Undo (⌘Z)">
            <Undo2 size={15} />
          </IconBtn>
          <IconBtn onClick={bouquet.redo} disabled={!bouquet.future.length} title="Redo (⌘⇧Z)">
            <Redo2 size={15} />
          </IconBtn>
          <span className="mx-1 h-5 w-px bg-sand" />
          <IconBtn
            onClick={() => bouquet.shuffle(boundsRef.current)}
            disabled={!bouquet.items.length}
            title="Shuffle arrangement"
          >
            <Sparkles size={15} />
          </IconBtn>
          <IconBtn onClick={bouquet.clearAll} disabled={!bouquet.items.length} title="Clear all" danger>
            <Trash2 size={15} />
          </IconBtn>
        </div>
      </div>

      {/* ── paper theme swatches ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand/70 px-4 py-2 sm:px-5">
        <p className="text-[11px] tracking-[0.18em] uppercase text-ink/40">Paper</p>
        <div className="flex items-center gap-2">
          {Object.values(WRAP_THEMES).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleThemeChange(t.id)}
              aria-pressed={themeValue === t.id}
              title={t.label}
              aria-label={t.label}
              className={`h-6 w-6 rounded-full border shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] transition-all active:scale-90 ${
                themeValue === t.id
                  ? 'scale-110 border-[#23301F] ring-2 ring-[#23301F]/25'
                  : 'border-sand hover:scale-105'
              }`}
              style={{ background: t.base }}
            />
          ))}
        </div>
      </div>

      {/* ── wrap shape ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand/70 px-4 py-2 sm:px-5">
        <p className="text-[11px] tracking-[0.18em] uppercase text-ink/40">Shape</p>
        <div className="flex items-center gap-1 rounded-full bg-ink/[0.05] p-1">
          {Object.values(WRAP_SHAPES).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleShapeChange(s.id)}
              aria-pressed={shapeValue === s.id}
              title={s.desc}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors active:scale-95 ${
                shapeValue === s.id
                  ? 'bg-[#23301F] text-cloud shadow-[0_2px_8px_rgba(35,48,31,0.35)]'
                  : 'text-ink/60 hover:bg-white/70 hover:text-ink'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── contextual toolbar for the selected flower ── */}
      <div
        className={`overflow-hidden border-sand/70 transition-all duration-200 ${
          selected ? 'max-h-12 border-b opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex items-center justify-center gap-1.5 px-4 py-2">
          <ActionBtn onClick={() => selected && bouquet.duplicateItem(selected.id)} label="Duplicate">
            <Copy size={14} />
          </ActionBtn>
          <ActionBtn onClick={() => selected && bouquet.flipItem(selected.id)} label="Flip">
            <FlipHorizontal2 size={14} />
          </ActionBtn>
          <span className="mx-1 h-5 w-px bg-sand" />

          {/* pose switcher — every flower has 4 poses */}
          {selected && selectedAsset?.poses && (
            <div className="flex items-center gap-1 rounded-full bg-ink/[0.05] p-1">
              {selectedAsset.poses.map((pose) => (
                <button
                  key={pose}
                  type="button"
                  onClick={() => bouquet.setPose(selected.id, pose)}
                  title={`${POSE_LABELS[pose]} pose`}
                  aria-pressed={selected.pose === pose}
                  className={`grid size-7 place-items-center rounded-full transition-all active:scale-90 ${
                    selected.pose === pose ? 'bg-[#23301F] shadow-[0_2px_8px_rgba(35,48,31,0.35)]' : 'hover:bg-white/70'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getFlowerPoseSrc(selected.assetId, pose)}
                    alt={POSE_LABELS[pose]}
                    className={`h-5 w-5 object-contain ${selected.pose === pose ? 'brightness-[1.6]' : ''}`}
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          )}
          <span className="mx-1 h-5 w-px bg-sand" />
          <ActionBtn onClick={() => selected && bouquet.toggleLock(selected.id)} label={selected?.locked ? 'Unlock' : 'Lock'}>
            {selected?.locked ? <Unlock size={14} /> : <Lock size={14} />}
          </ActionBtn>
          <span className="mx-1 h-5 w-px bg-sand" />
          <ActionBtn onClick={() => selected && bouquet.bringForward(selected.id)} label="Forward">
            <ChevronUp size={14} />
          </ActionBtn>
          <ActionBtn onClick={() => selected && bouquet.sendBackward(selected.id)} label="Backward">
            <ChevronDown size={14} />
          </ActionBtn>
          <span className="mx-1 h-5 w-px bg-sand" />
          <ActionBtn onClick={() => selected && bouquet.removeItem(selected.id)} label="Delete" danger>
            <Trash2 size={14} />
          </ActionBtn>
        </div>
      </div>

      {/* ── canvas ── */}
      <div className="relative h-[400px] sm:h-[480px]">
        <BouquetCanvas
          items={bouquet.items}
          selectedId={bouquet.selectedId}
          selectedItem={selected}
          dropQueue={dropQueue}
          settled={settled}
          onSelect={bouquet.selectItem}
          onChange={bouquet.updateItem}
          onCommit={bouquet.commitItem}
          onDropConsumed={handleDropConsumed}
          onFlowerSettled={handleFlowerSettled}
          onLockedFlowerClick={handleLockedFlowerClick}
          onRemapItems={bouquet.remapItems}
          onAddFlower={handleAssetSelect}
          onSetPose={bouquet.setPose}
          onToggleLock={bouquet.toggleLock}
          onDuplicate={bouquet.duplicateItem}
          onFlip={bouquet.flipItem}
          onForward={bouquet.bringForward}
          onBackward={bouquet.sendBackward}
          onRemove={bouquet.removeItem}
          onUndo={bouquet.undo}
          onRedo={bouquet.redo}
          onClear={bouquet.clearAll}
          canUndo={bouquet.past.length > 0}
          canRedo={bouquet.future.length > 0}
          canClear={bouquet.items.length > 0}
          theme={themeValue}
          onThemeChange={handleThemeChange}
          shapeId={shapeValue}
          onShapeChange={handleShapeChange}
          sizeId={sizeId}
          sizeLabel={sizeLabel}
          onBoundsChange={(b) => {
            boundsRef.current = b;
          }}
        />

        {/* empty-state hint */}
        {!touched && bouquet.items.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-pill bg-white/90 px-5 py-3 text-sm text-ink/60 shadow-[0_8px_24px_rgba(32,34,30,0.12)] backdrop-blur-sm">
              Tap a flower below to drop it into the bouquet ✿
            </div>
          </div>
        )}
      </div>

      {/* ── asset picker ── */}
      <AssetPicker onSelect={handleAssetSelect} counts={counts} />
    </div>
  );
}

function IconBtn({ children, onClick, disabled, title, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`grid size-9 place-items-center rounded-full transition-colors ${
        danger
          ? 'text-ink/55 hover:bg-red-50 hover:text-red-600'
          : 'text-ink/55 hover:bg-ink/[0.06] hover:text-ink'
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function ActionBtn({ children, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors active:scale-95 ${
        danger ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-ink/[0.05] text-ink/65 hover:bg-ink/[0.09] hover:text-ink'
      }`}
    >
      {children}
      {label}
    </button>
  );
}
