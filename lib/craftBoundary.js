/**
 * Clamp a point so its CENTER stays inside the vase-mouth circle, keeping
 * a small margin so flowers never slide off the rim. `factor` is how far
 * from the rim the center may travel (0–1 of the radius).
 */
export function clampToCircle(pos, cx, cy, radius, factor = 0.72) {
  const dx = pos.x - cx;
  const dy = pos.y - cy;
  const dist = Math.hypot(dx, dy);
  const max = radius * factor;
  if (dist <= max) return { x: pos.x, y: pos.y };
  const t = max / dist;
  return { x: cx + dx * t, y: cy + dy * t };
}

/**
 * Clamp a point so its CENTER stays inside a rectangular region — the
 * bouquet bounds (fan width × bouquet height). Flowers can be dragged
 * around inside the bouquet but never leave it.
 */
export function clampToBox(pos, bounds) {
  return {
    x: Math.max(bounds.xMin, Math.min(bounds.xMax, pos.x)),
    y: Math.max(bounds.yMin, Math.min(bounds.yMax, pos.y)),
  };
}

/**
 * Clamp a point inside an INVERTED trapezoid — wide at yTop, narrowing to
 * yBottom (like the bouquet fan: stems gathered at the mouth, heads
 * splaying a little higher up). Left/right freedom shrinks toward the
 * mouth, so flowers stay clustered at the opening.
 * shape: { cx, yTop, yBottom, halfTop, halfBottom }
 */
export function clampToTrapezoid(pos, shape) {
  const y = Math.max(shape.yTop, Math.min(shape.yBottom, pos.y));
  const t = (y - shape.yTop) / Math.max(1e-6, shape.yBottom - shape.yTop);
  const half = shape.halfTop + (shape.halfBottom - shape.halfTop) * t;
  return {
    x: Math.max(shape.cx - half, Math.min(shape.cx + half, pos.x)),
    y,
  };
}
