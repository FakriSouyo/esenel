'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Stage, Layer, Rect, Path, Transformer, Group, Circle } from 'react-konva';
import { Maximize2, Minimize2, Undo2, Redo2, Trash2, Copy, FlipHorizontal2, ChevronUp, ChevronDown, Lock, Unlock } from 'lucide-react';
import { BouquetItem } from './BouquetItem';
import { PhysicsDrop } from './PhysicsDrop';
import { WrapBack, WrapFront, WrapMouth, computeWrapGeom } from './BouquetWrap';
import { CRAFT_ASSETS, getCraftAsset, getFlowerPoseSrc, POSE_LABELS, flowerDisplaySize } from '@/lib/craftAssets';
import { WRAP_THEMES } from '@/lib/wrapThemes';
import { WRAP_SHAPES } from '@/lib/wrapShapes';
import { clampToTrapezoid } from '@/lib/craftBoundary';

export function BouquetCanvas({
  items,
  selectedId,
  selectedItem,
  dropQueue,
  settled,
  onSelect,
  onChange,
  onCommit,
  onRemapItems,
  onDropConsumed,
  onFlowerSettled,
  onLockedFlowerClick,
  onAddFlower,
  onSetPose,
  onToggleLock,
  onDuplicate,
  onFlip,
  onForward,
  onBackward,
  onRemove,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  canClear,
  theme = 'kraft',
  onThemeChange,
  shapeId = 'klasik',
  onShapeChange,
  sizeId = 'medium',
  sizeLabel = 'Medium',
  onBoundsChange,
  onStageReady,
}) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  // `size` starts `null` until the ResizeObserver measures the container. A
  // bogus initial size (e.g. {480,500}) used to trigger a spurious remap on
  // first mount/resize and shift flowers that were already placed correctly.
  const [size, setSize] = useState(null);
  // Two distinct "fullscreen" modes: the real browser Fullscreen API (best for
  // desktop) and a CSS-overlay fallback for mobile/iOS where requestFullscreen
  // is unreliable. `isFullscreen` is true if either is active.
  const [browserFs, setBrowserFs] = useState(false);
  const [cssFs, setCssFs] = useState(false);
  const isFullscreen = browserFs || cssFs;
  const nodesRef = useRef(new Map());
  const trRef = useRef(null);

  // Geometry needs a concrete size even before the first measure — fall back
  // to the legacy default so nothing computes NaN while `size` is null.
  const geoSize = size ?? { width: 480, height: 500 };

  // Expose the rendered Stage upward so the workbench can export a PNG
  // snapshot of the bouquet for Save / gallery.
  useEffect(() => {
    onStageReady?.(stageRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size?.width, size?.height]);

  const pickerFlowers = CRAFT_ASSETS.filter((a) => a.category === 'flowers');

  const handleItemSelect = useCallback((id) => {
    const item = items.find((it) => it.id === id);
    if (item?.locked) {
      onLockedFlowerClick?.(id);
      return;
    }
    onSelect(id);
  }, [items, onSelect, onLockedFlowerClick]);

  // Match the Stage to its container (responsive + mobile + fullscreen).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 4 && height > 4) setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The CSS-overlay fullscreen portals the canvas under <body>. After that
  // reparent, the ResizeObserver above may not re-fire right away with the new
  // full-viewport size, so force an immediate measure the moment the overlay
  // mounts — otherwise the Stage stays at its old (small) size and the canvas
  // doesn't fill the screen on mobile.
  useEffect(() => {
    if (!cssFs) return;
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w > 4 && h > 4) setSize({ width: w, height: h });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cssFs]);

  // Keep `browserFs` in sync with the native Fullscreen API so the toggle
  // button and everything driven by `isFullscreen` react to the browser's own
  // fullscreen transitions (Esc exit, OS controls, etc).
  useEffect(() => {
    const onFsChange = () => setBrowserFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Touch devices (mobile / iOS) can't rely on the native element Fullscreen
  // API: iOS Safari doesn't support it on arbitrary elements at all, and on
  // Android the promise may never settle or silently no-op — so the CSS
  // overlay would never kick in and the canvas wouldn't go fullscreen. Detect
  // touch once and use the deterministic CSS-overlay fullscreen on those
  // devices; only desktop gets the real browser Fullscreen API.
  const isTouch = useMemo(
    () => typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window),
    []
  );

  const toggleFullscreen = useCallback(() => {
    if (isTouch) {
      setCssFs((v) => !v);
      return;
    }
    // Desktop: real browser fullscreen, with the CSS overlay only as a last
    // resort if the native API is missing or rejects.
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
      return;
    }
    const el = containerRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => setCssFs((v) => !v));
    } else {
      setCssFs((v) => !v);
    }
  }, [isTouch]);

  // The bouquet layout derives ONLY from the chosen size — adding flowers
  // never makes the paper bigger. The mouth is raised a touch and the
  // geometry stays fixed for the whole build.
  const wrap = useMemo(() => {
    const g = computeWrapGeom(geoSize, sizeId);
    return {
      wrapX: g.cx - g.halfW,
      wrapY: g.rimY,
      wrapWidth: g.halfW * 2,
      wrapHeight: g.coneH,
      topWidth: g.halfW * 2,
      bottomWidth: g.halfW * 2,
      floorY: g.rimY + 16,
      ...g,
    };
  }, [geoSize, sizeId]);

  // A very tight drag zone around the mouth shaped like an INVERTED
  // TRAPEZOID: wide where the heads splay (top), narrowing to the mouth
  // where the stems gather (bottom). The bottom edge sits ABOVE the rim so
  // a flower can never be dragged down onto the sleeve body, and left/right
  // freedom shrinks toward the opening — the paper is never covered and
  // flowers stay clustered at the mouth.
  const dragLimit = useMemo(() => {
    return {
      cx: wrap.cx,
      yTop: wrap.rimY - 50,
      yBottom: wrap.rimY - 4,
      halfTop: wrap.halfW * 0.95,
      halfBottom: wrap.halfW * 0.55,
    };
  }, [wrap]);

  // Report the current drag limit upward so the workbench can clamp
  // non-drag operations (e.g. shuffle) to the same trapezoid.
  useEffect(() => {
    onBoundsChange?.(dragLimit);
  }, [dragLimit, onBoundsChange]);

  // When the canvas changes size (fullscreen toggle, container resize) the
  // wrap geometry moves (cx = width/2, tieY = height*0.63) but flowers keep
  // absolute coordinates — so they'd drift away from the bouquet. Remap every
  // flower proportionally to the new canvas and clamp it back into the drag
  // limit so the arrangement stays exactly where it was relative to the paper.
  const prevSizeRef = useRef(null);
  useEffect(() => {
    const prev = prevSizeRef.current;
    prevSizeRef.current = size;
    // Guards: before the FIRST real measurement (prev === null) there is no
    // previous geometry to remap from — flowers are already where the user
    // placed them, so we must NOT remap. Only genuine subsequent resizes
    // (fullscreen toggle, rotate, container change) remap the arrangement.
    if (!prev || !size || !items.length) return;
    if (prev.width === size.width && prev.height === size.height) return;
    // Remap flowers relative to the bouquet anchor (mouth center + rim) so the
    // arrangement stays glued to the paper when the canvas resizes (fullscreen
    // toggle, rotate, container change) instead of being multiplied by a raw
    // canvas scale factor (which drifts because the paper is centered/capped).
    const prevWrap = computeWrapGeom(prev, sizeId);
    const curWrap = computeWrapGeom(size, sizeId);
    const dx = curWrap.cx - prevWrap.cx;
    const dy = curWrap.rimY - prevWrap.rimY;
    // If the geometry is stable (e.g. capping keeps the paper the same pixel
    // size), keep flowers at constant offset from the anchor.
    if (dx === 0 && dy === 0) return;
    onRemapItems?.((it) => clampToTrapezoid({ x: it.x + dx, y: it.y + dy }, dragLimit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // Keep the Transformer attached to the selected node.
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = selectedId ? nodesRef.current.get(selectedId) ?? null : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, items]);

  const registerNode = useCallback((id, node) => {
    if (node) nodesRef.current.set(id, node);
    else nodesRef.current.delete(id);
  }, []);

  const handleBackground = (e) => {
    if (e.target === e.target.getStage()) onSelect(null);
  };

  // When a flower settles, tilt it outward from the bouquet center — like the
  // reference's radial fan — so the bouquet reads as a hand-tied fan, not a
  // random scatter. Physics still decides where it lands.
  const handleSettle = useCallback(
    (reqId, assetId, transform) => {
      // Clamp the fall to the mouth trapezoid so a dropped flower always lands
      // inside the bouquet (near the mouth oval), never far outside the paper.
      const clamped = clampToTrapezoid({ x: transform.x, y: transform.y }, dragLimit);
      const dx = (clamped.x - geoSize.width / 2) / Math.max(1, geoSize.width / 2);
      const tilt = Math.max(-24, Math.min(24, dx * 22 + (Math.random() - 0.5) * 10));
      onFlowerSettled(reqId, assetId, { ...clamped, rotation: tilt });
    },
    [geoSize, dragLimit, onFlowerSettled]
  );

  const sorted = [...items].sort((a, b) => a.zIndex - b.zIndex);

  // Depth illusion: flowers whose anchor sits ABOVE the sleeve rim go behind
  // the paper (pushed back with the Backward button, or settled deep) — their
  // stems are covered by the sleeve, so they read as being INSIDE the
  // bouquet. Everything else overlaps the paper in front. The mouth oval is
  // drawn in its own layer BEHIND every flower, so the brown opening never
  // covers a stem.
  const sleeveZ = wrap.rimY * 10;
  const backFlowers = sorted.filter((it) => it.zIndex < sleeveZ);
  const frontFlowers = sorted.filter((it) => it.zIndex >= sleeveZ);

  const renderFlower = (item) => {
    const asset = getCraftAsset(item.assetId, item.pose);
    const { w: flowerWidth, h: flowerHeight } = flowerDisplaySize(asset, item.scale);

    return (
      <Group key={item.id}>
        <BouquetItem
          item={item}
          asset={asset}
          isSelected={item.id === selectedId}
          bounds={dragLimit}
          onSelect={handleItemSelect}
          onChange={onChange}
          onCommit={onCommit}
          registerNode={registerNode}
          opacity={item.locked ? 0.9 : 1}
        />

        {/* Lock icon overlay for locked flowers */}
        {item.locked && (
          <Group
            x={item.x + flowerWidth / 2 - 10}
            y={item.y - flowerHeight / 2 + 10}
            listening={false}
          >
            <Circle
              radius={10}
              fill="#23301F"
              opacity={0.75}
              shadowColor="rgba(0,0,0,0.3)"
              shadowBlur={4}
              shadowOffsetY={2}
            />
            <Group offsetX={4} offsetY={4}>
              <Rect x={1} y={3} width={6} height={5} fill="#F8F9F5" cornerRadius={1} />
              <Path
                data="M 2.5 3 L 2.5 2 C 2.5 1.17 3.17 0.5 4 0.5 C 4.83 0.5 5.5 1.17 5.5 2 L 5.5 3"
                stroke="#F8F9F5"
                strokeWidth={1.2}
                lineCap="round"
                fill=""
              />
            </Group>
          </Group>
        )}
      </Group>
    );
  };

  const renderCanvas = (
    <div
      ref={containerRef}
      // When the CSS-overlay fullscreen is active the parent portal wrapper is
      // `position: fixed`, and a plain `h-full` (height:100%) can fail to
      // resolve against it on some browsers — so size the canvas box to the
      // viewport explicitly. Otherwise it fills its normal (workbench) box.
      className={`relative overflow-hidden ${cssFs ? 'h-screen w-screen' : 'h-full w-full'}`}
      style={{ touchAction: 'pan-y', background: isFullscreen ? '#F7F3EC' : undefined }}
    >
      <Stage
        ref={stageRef}
        width={size?.width || geoSize.width}
        height={size?.height || geoSize.height}
        onClick={handleBackground}
        onTap={handleBackground}
      >
        <Layer>
          {/* paper flaps + ground shadow — behind everything */}
          <WrapBack size={geoSize} themeId={theme} sizeId={sizeId} shapeId={shapeId} />

          {/* mouth oval (recess + rim) — BEHIND every flower, so the brown
              opening never covers a stem */}
          <WrapMouth size={geoSize} themeId={theme} sizeId={sizeId} shapeId={shapeId} />

          {/* back flowers — stems sit BEHIND the sleeve paper */}
          {backFlowers.map(renderFlower)}

          {/* sleeve body + tail + twine — wraps AROUND the back stems */}
          <WrapFront size={geoSize} themeId={theme} sizeId={sizeId} shapeId={shapeId} />

          {/* falling flowers drop in from the viewer's side */}
          <PhysicsDrop
            dropQueue={dropQueue}
            wrap={wrap}
            settled={settled}
            onDropConsumed={onDropConsumed}
            onSettle={handleSettle}
          />

          {/* front flowers — overlap the paper */}
          {frontFlowers.map(renderFlower)}

          <Transformer
            ref={trRef}
            rotateEnabled
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            anchorSize={10}
            anchorCornerRadius={6}
            borderStroke="#23301F"
            borderDash={[4, 4]}
            anchorStroke="#23301F"
            anchorFill="#F8F9F5"
            rotationSnaps={[0, 90, 180, 270]}
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 26 || newBox.height < 26 ? oldBox : newBox)}
          />
        </Layer>
      </Stage>

      {/* fullscreen toggle */}
      <button
        type="button"
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen canvas'}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen canvas'}
        className="absolute right-3 top-3 z-30 grid size-9 place-items-center rounded-full bg-white/85 text-ink/60 shadow-[0_4px_14px_rgba(32,34,30,0.14)] backdrop-blur-sm transition-colors hover:bg-white hover:text-ink"
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>

      {/* ── fullscreen control bar: everything the panel below would have ── */}
      {isFullscreen && (
        <>
          {/* paper themes + wrap shape + undo/redo/clear */}
          <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-sand bg-white/90 p-1.5 shadow-[0_8px_24px_rgba(32,34,30,0.14)] backdrop-blur">
            {Object.values(WRAP_THEMES).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onThemeChange?.(t.id)}
                title={t.label}
                aria-label={t.label}
                aria-pressed={theme === t.id}
                className={`h-5 w-5 rounded-full border shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] transition-all active:scale-90 ${
                  theme === t.id ? 'scale-110 border-[#23301F] ring-2 ring-[#23301F]/25' : 'border-sand hover:scale-105'
                }`}
                style={{ background: t.base }}
              />
            ))}
            <span className="mx-0.5 h-4 w-px bg-sand" />
            <FsIconBtn onClick={onUndo} disabled={!canUndo} title="Undo (⌘Z)">
              <Undo2 size={13} />
            </FsIconBtn>
            <FsIconBtn onClick={onRedo} disabled={!canRedo} title="Redo (⌘⇧Z)">
              <Redo2 size={13} />
            </FsIconBtn>
            <FsIconBtn onClick={onClear} disabled={!canClear} title="Clear all" danger>
              <Trash2 size={13} />
            </FsIconBtn>
            <span className="mx-0.5 h-4 w-px bg-sand" />
            {Object.values(WRAP_SHAPES).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onShapeChange?.(s.id)}
                title={`${s.label} — ${s.desc}`}
                aria-pressed={shapeId === s.id}
                className={`rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide transition-colors ${
                  shapeId === s.id ? 'bg-[#23301F] text-white' : 'text-ink/55 hover:bg-ink/[0.06] hover:text-ink'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* contextual bar for the selected flower */}
          {selectedItem && (
            <div className="absolute left-1/2 top-14 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-sand bg-white/90 px-2 py-1.5 shadow-[0_8px_24px_rgba(32,34,30,0.14)] backdrop-blur">
              {(() => {
                const asset = getCraftAsset(selectedItem.assetId, selectedItem.pose);
                return asset?.poses ? (
                  <div className="flex items-center gap-1">
                    {asset.poses.map((pose) => (
                      <button
                        key={pose}
                        type="button"
                        onClick={() => onSetPose?.(selectedItem.id, pose)}
                        title={`${POSE_LABELS[pose]} pose`}
                        aria-pressed={selectedItem.pose === pose}
                        className={`grid size-7 place-items-center rounded-full transition-all active:scale-90 ${
                          selectedItem.pose === pose ? 'bg-[#23301F]' : 'hover:bg-ink/[0.05]'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getFlowerPoseSrc(selectedItem.assetId, pose)}
                          alt={POSE_LABELS[pose]}
                          className={`h-5 w-5 object-contain ${selectedItem.pose === pose ? 'brightness-[1.6]' : ''}`}
                          draggable={false}
                        />
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}
              <span className="mx-0.5 h-4 w-px bg-sand" />
              <FsIconBtn
                onClick={() => onToggleLock?.(selectedItem.id)}
                title={selectedItem.locked ? 'Unlock' : 'Lock'}
              >
                {selectedItem.locked ? <Unlock size={13} /> : <Lock size={13} />}
              </FsIconBtn>
              <FsIconBtn onClick={() => onForward?.(selectedItem.id)} title="Forward">
                <ChevronUp size={13} />
              </FsIconBtn>
              <FsIconBtn onClick={() => onBackward?.(selectedItem.id)} title="Backward">
                <ChevronDown size={13} />
              </FsIconBtn>
              <FsIconBtn onClick={() => onDuplicate?.(selectedItem.id)} title="Duplicate">
                <Copy size={13} />
              </FsIconBtn>
              <FsIconBtn onClick={() => onFlip?.(selectedItem.id)} title="Flip">
                <FlipHorizontal2 size={13} />
              </FsIconBtn>
              <span className="mx-0.5 h-4 w-px bg-sand" />
              <FsIconBtn onClick={() => onRemove?.(selectedItem.id)} title="Delete" danger>
                <Trash2 size={13} />
              </FsIconBtn>
            </div>
          )}

          {/* mini flower picker — the panel below is hidden in fullscreen */}
          <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-3">
            <div className="flex items-end gap-2 rounded-2xl border border-sand bg-white/95 p-2 pb-2.5 shadow-[0_16px_40px_rgba(32,34,30,0.22)] backdrop-blur">
              {pickerFlowers.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onAddFlower?.(a.id, 'front')}
                  title={`Add ${a.name}`}
                  className="flex flex-col items-center gap-1 rounded-xl px-1 py-0.5 transition-all hover:bg-cloud active:scale-95"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-sand/70 bg-cloud">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getFlowerPoseSrc(a.id, 'front')}
                      alt={a.name}
                      className="h-10 w-10 object-contain"
                      draggable={false}
                    />
                  </span>
                  <span className="text-[10px] leading-tight text-ink/60">{a.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Mobile/iOS CSS-overlay fullscreen must cover the REAL viewport. A plain
  // `position: fixed` overlay can get pinned to a transformed ancestor (e.g.
  // the framer-motion step wrapper), which moves it off-screen on actual
  // phones. Rendering the overlay through a portal directly under <body>
  // sidesteps every ancestor transform/containing-block quirk and reliably
  // fills the screen on Safari and Chrome mobile alike.
  if (isFullscreen && cssFs) {
    return createPortal(
      <div
        className="fixed inset-0 z-[60] h-screen w-screen"
        style={{ overscrollBehavior: 'contain' }}
      >
        {renderCanvas}
      </div>,
      typeof document !== 'undefined' ? document.body : null
    );
  }
  return renderCanvas;
}

function FsIconBtn({ children, onClick, disabled, title, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`grid size-7 place-items-center rounded-full transition-colors ${
        danger
          ? 'text-ink/55 hover:bg-red-50 hover:text-red-600'
          : 'text-ink/55 hover:bg-ink/[0.06] hover:text-ink'
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {children}
    </button>
  );
}
