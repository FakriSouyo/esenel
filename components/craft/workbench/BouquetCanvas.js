'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Ellipse, Rect, Path, Transformer, Group, Circle, Text, Line } from 'react-konva';
import { Maximize2, Minimize2, Undo2, Redo2, Trash2, Copy, FlipHorizontal2, ChevronUp, ChevronDown, Lock, Unlock } from 'lucide-react';
import { BouquetItem } from './BouquetItem';
import { PhysicsDrop } from './PhysicsDrop';
import { WrapBack, WrapFront, WrapMouth, computeWrapGeom } from './BouquetWrap';
import { CRAFT_ASSETS, getCraftAsset, getFlowerPoseSrc, POSE_LABELS, flowerDisplaySize } from '@/lib/craftAssets';
import { WRAP_THEMES } from '@/lib/wrapThemes';
import { WRAP_SHAPES, buildFlaps, buildFrontPanels, buildTail } from '@/lib/wrapShapes';
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
}) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 480, height: 500 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showParts, setShowParts] = useState(false);
  const nodesRef = useRef(new Map());
  const trRef = useRef(null);

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

  // Track the browser fullscreen state of the canvas.
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.();
    }
  }, []);

  // The bouquet layout derives ONLY from the chosen size — adding flowers
  // never makes the paper bigger. The mouth is raised a touch and the
  // geometry stays fixed for the whole build.
  const wrap = useMemo(() => {
    const g = computeWrapGeom(size, sizeId);
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
  }, [size, sizeId]);

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
    if (!prev || !items.length) return;
    if (prev.width === size.width && prev.height === size.height) return;
    const sx = size.width / prev.width;
    const sy = size.height / prev.height;
    if (!Number.isFinite(sx) || !Number.isFinite(sy) || sx <= 0 || sy <= 0) return;
    onRemapItems?.((it) => clampToTrapezoid({ x: it.x * sx, y: it.y * sy }, dragLimit));
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
      const dx = (transform.x - size.width / 2) / Math.max(1, size.width / 2);
      const tilt = Math.max(-24, Math.min(24, dx * 22 + (Math.random() - 0.5) * 10));
      onFlowerSettled(reqId, assetId, { ...transform, rotation: tilt });
    },
    [size, onFlowerSettled]
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

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ touchAction: 'none', background: isFullscreen ? '#F7F3EC' : undefined }}
    >
      <Stage width={size.width} height={size.height} onClick={handleBackground} onTap={handleBackground}>
        <Layer>
          {/* paper flaps + ground shadow — behind everything */}
          <WrapBack size={size} themeId={theme} sizeId={sizeId} shapeId={shapeId} />

          {/* mouth oval (recess + rim) — BEHIND every flower, so the brown
              opening never covers a stem */}
          <WrapMouth size={size} themeId={theme} sizeId={sizeId} shapeId={shapeId} />

          {/* back flowers — stems sit BEHIND the sleeve paper */}
          {backFlowers.map(renderFlower)}

          {/* sleeve body + tail + twine — wraps AROUND the back stems */}
          <WrapFront size={size} themeId={theme} sizeId={sizeId} shapeId={shapeId} />

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

          {/* debug markers — label every part of the bouquet so we can
              decide together which parts the flowers should cover */}
          {showParts && <PartsMarkers wrap={wrap} dragLimit={dragLimit} shapeId={shapeId} sizeId={sizeId} />}

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

      {/* part-marker toggle (next to fullscreen) */}
      <button
        type="button"
        onClick={() => setShowParts((v) => !v)}
        aria-pressed={showParts}
        title="Show bouquet part markers"
        className={`absolute right-3 top-14 z-30 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-wide transition-colors ${
          showParts
            ? 'border-[#23301F] bg-[#23301F] text-white'
            : 'border-sand bg-white/85 text-ink/55 shadow-[0_4px_14px_rgba(32,34,30,0.14)] backdrop-blur-sm hover:text-ink'
        }`}
      >
        {showParts ? 'HIDE PARTS' : 'SHOW PARTS'}
      </button>

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

/**
 * Debug overlay: outlines + labels for every part of the bouquet (flaps,
 * sleeve, mouth oval, tail, tie, drag limit) so we can agree which parts
 * the flowers should cover. Toggle with the SHOW PARTS button.
 */
function PartsMarkers({ wrap, dragLimit, shapeId = 'klasik', sizeId = 'medium' }) {
  const { cx, tieY, rimY, halfW, coneH, tailLen } = wrap;
  const flaps = buildFlaps(shapeId, wrap, sizeId);
  const front = buildFrontPanels(shapeId, wrap);
  const tailD = buildTail(shapeId, wrap);
  return (
    <Group listening={false}>
      {/* FLAPS — the paper fan behind the flowers */}
      {flaps.map((f) => {
        const rad = (f.rot * Math.PI) / 180;
        return (
          <Line
            key={f.rot}
            points={[cx, tieY, cx + Math.sin(rad) * f.length, tieY - Math.cos(rad) * f.length]}
            stroke="#E8B64C"
            strokeWidth={2}
            opacity={0.9}
          />
        );
      })}
      <PartChip x={cx - 84} y={tieY - flaps[0].length - 40} color="#E8B64C" label="FLAPS · behind paper" />

      {/* SLEEVE — the shape's front panels (outline only, never covers flowers) */}
      {front.panels.map((p, i) => (
        <Path key={i} data={p.d} stroke="#3B82F6" strokeWidth={2} />
      ))}
      <PartChip x={cx + halfW * 0.5} y={rimY + coneH * 0.42} color="#3B82F6" label="SLEEVE" />

      {/* MOUTH — the brown oval opening */}
      <Ellipse x={cx} y={rimY} radiusX={halfW * 0.92} radiusY={10} stroke="#EF4444" strokeWidth={2} />
      <PartChip x={cx - halfW * 0.92 - 96} y={rimY - 14} color="#EF4444" label="MOUTH (brown oval)" />

      {/* TAIL — paper hanging below the tie */}
      <Path data={tailD} stroke="#22C55E" strokeWidth={2} />
      <PartChip x={cx + 30} y={tieY + tailLen * 0.5 - 10} color="#22C55E" label="TAIL" />

      {/* TIE — where the twine gathers the stems */}
      <Ellipse x={cx} y={tieY} radiusX={30} radiusY={12} stroke="#A855F7" strokeWidth={2} />
      <PartChip x={cx + 36} y={tieY - 26} color="#A855F7" label="TIE" />

      {/* DRAG LIMIT — inverted trapezoid (wide top, narrow at the mouth) */}
      <Line
        points={[
          dragLimit.cx - dragLimit.halfTop,
          dragLimit.yTop,
          dragLimit.cx + dragLimit.halfTop,
          dragLimit.yTop,
          dragLimit.cx + dragLimit.halfBottom,
          dragLimit.yBottom,
          dragLimit.cx - dragLimit.halfBottom,
          dragLimit.yBottom,
        ]}
        closed
        stroke="#F97316"
        strokeWidth={2}
        dash={[6, 5]}
      />
      <PartChip x={dragLimit.cx + dragLimit.halfTop - 118} y={dragLimit.yTop + 6} color="#F97316" label="DRAG LIMIT" />
    </Group>
  );
}

function PartChip({ x, y, color, label }) {
  const w = label.length * 6.4 + 14;
  return (
    <Group x={x} y={y}>
      <Rect width={w} height={20} cornerRadius={4} fill="#FFFFFF" opacity={0.94} stroke={color} strokeWidth={1.2} />
      <Text text={label} x={7} y={4} fontSize={11} fontStyle="bold" fill={color} fontFamily="Inter, system-ui, sans-serif" />
    </Group>
  );
}
