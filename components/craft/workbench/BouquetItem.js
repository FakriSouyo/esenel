'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { useHtmlImage } from '@/hooks/useHtmlImage';
import { clampToCircle } from '@/lib/craftBoundary';

/**
 * A settled flower: a plain Konva.Image that can be dragged, rotated /
 * scaled (via the Transformer in BouquetCanvas), flipped, selected and
 * removed. Physics only happened once, while it was falling.
 */
export function BouquetItem({ item, asset, isSelected, boundary, onSelect, onChange, onCommit, registerNode }) {
  const image = useHtmlImage(asset.src);
  const shapeRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    registerNode(item.id, shapeRef.current);
    return () => registerNode(item.id, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, item.id, registerNode]);

  // Pop in when the flower first settles (once per node).
  useEffect(() => {
    const node = shapeRef.current;
    if (!node || mountedRef.current || !image) return;
    mountedRef.current = true;
    const from = 0.55;
    node.scaleX(node.scaleX() * from);
    node.scaleY(node.scaleY() * from);
    node.to({
      scaleX: item.flip ? -item.scale : item.scale,
      scaleY: item.scale,
      duration: 0.38,
      easing: Konva.Easings.BackEaseOut,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  const dragBoundFunc = useCallback(
    (pos) => clampToCircle(pos, boundary.cx, boundary.cy, boundary.radius, 0.72),
    [boundary]
  );

  const bounce = useCallback(() => {
    const node = shapeRef.current;
    if (!node) return;
    const sx = node.scaleX();
    const sy = node.scaleY();
    node.to({
      scaleX: sx * 1.09,
      scaleY: sy * 1.09,
      duration: 0.07,
      easing: Konva.Easings.EaseOut,
      onFinish: () => {
        node.to({ scaleX: sx, scaleY: sy, duration: 0.2, easing: Konva.Easings.BackEaseOut });
      },
    });
  }, []);

  const handleTransformEnd = useCallback(() => {
    const node = shapeRef.current;
    if (!node) return;
    const sx = node.scaleX();
    const patch = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scale: Math.abs(sx),
      flip: sx < 0,
    };
    onChange(item.id, patch);
    onCommit(item.id, patch);
  }, [item.id, onChange, onCommit]);

  if (!image) return null;

  const size = asset.radius * 2;

  return (
    <KonvaImage
      ref={shapeRef}
      image={image}
      x={item.x}
      y={item.y}
      width={size}
      height={size}
      offsetX={size / 2}
      offsetY={size / 2}
      rotation={item.rotation}
      scaleX={item.flip ? -item.scale : item.scale}
      scaleY={item.scale}
      draggable
      dragBoundFunc={dragBoundFunc}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(item.id);
        bounce();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect(item.id);
        bounce();
      }}
      onDragStart={() => onSelect(item.id)}
      onDragEnd={(e) => {
        const patch = { x: e.target.x(), y: e.target.y() };
        onChange(item.id, patch);
        onCommit(item.id, patch);
        bounce();
      }}
      onTransformEnd={handleTransformEnd}
      shadowColor="#23301F"
      shadowOpacity={isSelected ? 0.3 : 0.12}
      shadowBlur={isSelected ? 16 : 7}
      shadowOffsetY={5}
    />
  );
}
