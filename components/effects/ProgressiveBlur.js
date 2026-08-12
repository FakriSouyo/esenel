/**
 * ProgressiveBlur
 * Frosted, progressively-blurred top/bottom edges for scrollable content.
 *
 * Two usage modes:
 * - Default: place two inside a `relative` container wrapping a scrollable
 *   area (one `position="top"`, one `position="bottom"`) — content fades
 *   into a soft blur at both edges as it scrolls.
 * - `fixed`: mount on the page (e.g. in the root layout) with
 *   `position="top"` / `position="bottom"` and a `zIndex` below the navbar
 *   to blur whatever scrolls past the top/bottom of the viewport on every
 *   page — footer included.
 *
 * Adapted from the "Skiper 41" scroll demo by @gurvinder-singh02 (Skiper UI,
 * https://gxuri.me), converted to this project's JS conventions. Attribution
 * to Skiper UI is required when using the free version.
 */

export default function ProgressiveBlur({
  className = '',
  backgroundColor = '#f5f4f3',
  position = 'top',
  height = '150px',
  blurAmount = '4px',
  fixed = false,
  zIndex,
}) {
  const isTop = position === 'top';

  // Mask uses plain black stops (decoupled from backgroundColor) so the blur
  // layer also shows correctly on dark backgrounds, not just near-white ones.
  const mask = isTop
    ? 'linear-gradient(to bottom, #000 50%, transparent)'
    : 'linear-gradient(to top, #000 50%, transparent)';

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none left-0 w-full select-none ${fixed ? 'fixed' : 'absolute'} ${className}`}
      style={{
        [isTop ? 'top' : 'bottom']: 0,
        height,
        zIndex,
        background: isTop
          ? `linear-gradient(to top, transparent, ${backgroundColor})`
          : `linear-gradient(to bottom, transparent, ${backgroundColor})`,
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitBackdropFilter: `blur(${blurAmount})`,
        backdropFilter: `blur(${blurAmount})`,
      }}
    />
  );
}
