'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Ellipse, Path, Rect, Transformer, Image as KonvaImage, Group, Circle } from 'react-konva';
import { BouquetItem } from './BouquetItem';
import { PhysicsDrop } from './PhysicsDrop';
import { getCraftAsset } from '@/lib/craftAssets';
import { useHtmlImage } from '@/hooks/useHtmlImage';

export function BouquetCanvas({ items, selectedId, dropQueue, settled, onSelect, onChange, onCommit, onDropConsumed, onFlowerSettled, onLockedFlowerClick }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 480, height: 500 });
  const nodesRef = useRef(new Map());
  const trRef = useRef(null);
  const wrapImage = useHtmlImage('/craft/wrap-bouquet.svg');

  const handleItemSelect = useCallback((id) => {
    const item = items.find((it) => it.id === id);
    if (item?.locked) {
      onLockedFlowerClick?.(id);
      return;
    }
    onSelect(id);
  }, [items, onSelect, onLockedFlowerClick]);

  // Match the Stage to its container (responsive + mobile).
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

  const boundary = useMemo(() => {
    const cx = size.width / 2;
    const cy = size.height / 2;
    const radius = Math.min(size.width, size.height) * 0.4;
    return { cx, cy, radius };
  }, [size]);

  // Vase geometry (drawn around the physics floor).
  // Wrap bouquet cone geometry (trapezoid: narrow at top, wide at bottom)
  const wrap = useMemo(() => {
    const wrapWidth = 200;
    const wrapHeight = 150;
    const wrapX = size.width / 2 - wrapWidth / 2;
    const wrapY = size.height - wrapHeight;
    const topWidth = 80; // narrow opening at top
    const bottomWidth = 200; // wider base
    const floorY = wrapY + wrapHeight - 20; // physics floor slightly above visual bottom
    return { wrapX, wrapY, wrapWidth, wrapHeight, topWidth, bottomWidth, floorY };
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

  const sorted = [...items].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden" style={{ touchAction: 'none' }}>
      <Stage width={size.width} height={size.height} onClick={handleBackground} onTap={handleBackground}>
        <Layer>
          {/* soft table shadow under the wrap */}
          <Ellipse
            x={size.width / 2}
            y={wrap.wrapY + wrap.wrapHeight + 10}
            radiusX={wrap.bottomWidth / 2 * 1.15}
            radiusY={wrap.bottomWidth / 2 * 0.2}
            fill="#23301F"
            opacity={0.1}
            listening={false}
          />

          {/* arrangement guide — where flowers may go (adjusted for cone shape) */}
          <Ellipse
            x={size.width / 2}
            y={wrap.wrapY + wrap.wrapHeight / 2}
            radiusX={wrap.topWidth}
            radiusY={wrap.topWidth * 0.8}
            stroke="#A58F78"
            strokeWidth={1}
            dash={[5, 8]}
            opacity={0.22}
            listening={false}
          />

          {/* wrap bouquet container (cone-shaped paper wrapping) */}
          {wrapImage && (
            <KonvaImage
              image={wrapImage}
              x={wrap.wrapX}
              y={wrap.wrapY}
              width={wrap.wrapWidth}
              height={wrap.wrapHeight}
              listening={false}
            />
          )}

          {sorted.map((item) => {
            const asset = getCraftAsset(item.assetId, item.pose);
            const assetRadius = asset?.radius || 26;
            const flowerWidth = assetRadius * 2 * item.scale;
            const flowerHeight = assetRadius * 2 * item.scale;
            
            return (
              <Group key={item.id}>
                <BouquetItem
                  item={item}
                  asset={asset}
                  isSelected={item.id === selectedId}
                  boundary={boundary}
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
                    {/* Semi-transparent background circle */}
                    <Circle
                      radius={10}
                      fill="#23301F"
                      opacity={0.75}
                      shadowColor="rgba(0,0,0,0.3)"
                      shadowBlur={4}
                      shadowOffsetY={2}
                    />
                    {/* Lock icon - simple path-based lock */}
                    <Group offsetX={4} offsetY={4}>
                      {/* Lock body (rectangle) */}
                      <Rect
                        x={1}
                        y={3}
                        width={6}
                        height={5}
                        fill="#F8F9F5"
                        cornerRadius={1}
                      />
                      {/* Lock shackle (arc) */}
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
          })}

          <PhysicsDrop
            dropQueue={dropQueue}
            boundary={boundary}
            wrap={wrap}
            settled={settled}
            onDropConsumed={onDropConsumed}
            onSettle={onFlowerSettled}
          />

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
    </div>
  );
}
