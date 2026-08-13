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
