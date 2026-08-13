'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Ellipse, Path, Rect, Transformer } from 'react-konva';
import { BouquetItem } from './BouquetItem';
import { PhysicsDrop } from './PhysicsDrop';
import { getCraftAsset } from '@/lib/craftAssets';

export function BouquetCanvas({ items, selectedId, dropQueue, settled, onSelect, onChange, onCommit, onDropConsumed, onFlowerSettled }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 480, height: 500 });
  const nodesRef = useRef(new Map());
  const trRef = useRef(null);

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
  const vase = useMemo(() => {
    const rimY = boundary.cy - boundary.radius * 0.1;
    const floorY = boundary.cy + boundary.radius * 0.42;
    const potBottom = boundary.cy + boundary.radius * 0.98;
    const topW = boundary.radius * 1.02;
    const botW = boundary.radius * 0.6;
    return { rimY, floorY, potBottom, topW, botW };
  }, [boundary]);

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
  const potPath = `M ${boundary.cx - vase.topW} ${vase.rimY} L ${boundary.cx + vase.topW} ${vase.rimY} L ${boundary.cx + vase.botW} ${vase.potBottom} Q ${boundary.cx} ${vase.potBottom + 14} ${boundary.cx - vase.botW} ${vase.potBottom} Z`;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden" style={{ touchAction: 'none' }}>
      <Stage width={size.width} height={size.height} onClick={handleBackground} onTap={handleBackground}>
        <Layer>
          {/* soft table shadow under the vase */}
          <Ellipse
            x={boundary.cx}
            y={vase.potBottom + 16}
            radiusX={vase.topW * 1.15}
            radiusY={vase.topW * 0.2}
            fill="#23301F"
            opacity={0.1}
            listening={false}
          />

          {/* arrangement guide — where flowers may go */}
          <Ellipse
            x={boundary.cx}
            y={boundary.cy}
            radiusX={boundary.radius}
            radiusY={boundary.radius}
            stroke="#A58F78"
            strokeWidth={1}
            dash={[5, 8]}
            opacity={0.22}
            listening={false}
          />

          {/* vase body — tapered, sand → earth gradient */}
          <Path
            data={potPath}
            fillLinearGradientStartPoint={{ x: boundary.cx, y: vase.rimY }}
            fillLinearGradientEndPoint={{ x: boundary.cx, y: vase.potBottom }}
            fillLinearGradientColorStops={[0, '#EFE7DA', 0.55, '#DED4C2', 1, '#C2AE90']}
            stroke="#BBA98A"
            strokeWidth={1.5}
            listening={false}
          />

          {/* subtle ceramic folds on the vase */}
          <Rect
            x={boundary.cx - vase.topW * 0.55}
            y={vase.rimY + 6}
            width={1.5}
            height={vase.potBottom - vase.rimY}
            fill="#A58F78"
            opacity={0.18}
            rotation={6}
            listening={false}
          />
          <Rect
            x={boundary.cx + vase.topW * 0.42}
            y={vase.rimY + 6}
            width={1.5}
            height={vase.potBottom - vase.rimY}
            fill="#A58F78"
            opacity={0.18}
            rotation={-7}
            listening={false}
          />

          {/* rim */}
          <Ellipse
            x={boundary.cx}
            y={vase.rimY}
            radiusX={vase.topW}
            radiusY={vase.topW * 0.3}
            fillLinearGradientStartPoint={{ x: boundary.cx, y: vase.rimY - vase.topW * 0.3 }}
            fillLinearGradientEndPoint={{ x: boundary.cx, y: vase.rimY + vase.topW * 0.3 }}
            fillLinearGradientColorStops={[0, '#F8F9F5', 1, '#DED4C2']}
            stroke="#BBA98A"
            strokeWidth={2}
            listening={false}
          />

          {/* dark opening — flowers rest above it */}
          <Ellipse
            x={boundary.cx}
            y={vase.rimY}
            radiusX={vase.topW * 0.8}
            radiusY={vase.topW * 0.22}
            fill="#3B352C"
            opacity={0.85}
            listening={false}
          />

          {sorted.map((item) => (
            <BouquetItem
              key={item.id}
              item={item}
              asset={getCraftAsset(item.assetId)}
              isSelected={item.id === selectedId}
              boundary={boundary}
              onSelect={onSelect}
              onChange={onChange}
              onCommit={onCommit}
              registerNode={registerNode}
            />
          ))}

          <PhysicsDrop
            dropQueue={dropQueue}
            boundary={boundary}
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
