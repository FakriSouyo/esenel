'use client';

import { useMemo } from 'react';
import { Ellipse, Group, Path } from 'react-konva';
import { WRAP_THEMES } from '@/lib/wrapThemes';
import { buildFlaps, buildFrontPanels, buildTail, getWrapShape } from '@/lib/wrapShapes';

/**
 * The wrapping paper of the bouquet, drawn entirely with Konva shapes (no
 * image asset) so it can react to the bouquet size and shape — the fan
 * spread, the sleeve, the back flaps, the tail, the twine and the ground
 * shadow all come from the chosen size and wrap shape, like a real
 * hand-tied bouquet.
 *
 * Four wrap shapes (Klasik / Geometris / Silang / Ramping) each build their
 * own fold pattern — see lib/wrapShapes.js for the generators.
 *
 * Split in three parts because of z-order:
 *   WrapBack  — flaps + ground shadow, BEHIND the flowers
 *   WrapMouth — the sleeve opening (recess + rim), behind every flower
 *   WrapFront — sleeve body + tail + twine, wrapping AROUND the stems
 */

/**
 * How much bigger each craft size makes the whole bouquet geometry — the
 * bouquet keeps ONE size for the whole build; the flower count never
 * inflates it. Only the chosen size scales it.
 */
export const SIZE_FACTORS = {
  small: 0.85,
  medium: 1,
  large: 1.18,
  'extra-large': 1.4,
};

// Base geometry (Medium size) before the size factor is applied.
const BASE_GEOM = { halfW: 76, coneH: 92, tailLen: 64 };

export function computeWrapGeom(size, sizeId = 'medium') {
  const f = SIZE_FACTORS[sizeId] || 1;
  const cx = size.width / 2;
  const tieY = size.height * 0.63; // where the twine gathers the stems
  const coneH = Math.min(size.height * 0.34, BASE_GEOM.coneH * f); // sleeve height above the tie
  const rimY = tieY - coneH; // top opening of the sleeve
  const halfW = Math.min(size.width * 0.42, BASE_GEOM.halfW * f); // sleeve half-width
  const tailLen = Math.min(size.height * 0.22, BASE_GEOM.tailLen * f); // paper tail below the tie
  return { cx, tieY, coneH, rimY, halfW, tailLen };
}

/** Build an offscreen pattern canvas for the paper textures. */
function makeTexture(texture) {
  if (typeof document === 'undefined') return null;
  if (texture === 'newsprint') {
    const c = document.createElement('canvas');
    c.width = 46;
    c.height = 30;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = 'rgba(92,80,60,0.7)';
    ctx.lineWidth = 1;
    for (let y = 4; y < 30; y += 5) {
      ctx.beginPath();
      ctx.moveTo(3, y);
      ctx.lineTo(42 - (y % 10 === 4 ? 12 : 4), y);
      ctx.stroke();
    }
    return c;
  }
  if (texture === 'pleats') {
    const c = document.createElement('canvas');
    c.width = 13;
    c.height = 13;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = 'rgba(51,64,42,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.lineTo(1, 13);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(238,243,227,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(6, 13);
    ctx.stroke();
    return c;
  }
  return null;
}

export function WrapBack({ size, themeId = 'kraft', sizeId = 'medium', shapeId = 'klasik' }) {
  const theme = WRAP_THEMES[themeId] || WRAP_THEMES.kraft;
  const g = useMemo(() => computeWrapGeom(size, sizeId), [size, sizeId]);
  const flaps = useMemo(() => buildFlaps(shapeId, g, sizeId), [shapeId, g, sizeId]);

  return (
    <Group listening={false}>
      {/* ground shadow under the tail — grows with the bouquet */}
      <Ellipse
        x={g.cx}
        y={g.tieY + g.tailLen + 16}
        radiusX={Math.max(90, g.halfW * 1.15)}
        radiusY={20}
        fill="#23301F"
        opacity={0.12}
      />

      {/* back flaps fanning behind the stems — wide and tall so flowers
          have a real paper backdrop */}
      {flaps.map((f) => (
        <Group key={f.rot} x={g.cx} y={g.tieY} rotation={f.rot} opacity={0.85}>
          <Path
            data={f.d}
            fill={theme.base}
            stroke={theme.shadow}
            strokeWidth={1.2}
            strokeOpacity={0.35}
            shadowColor="#23301F"
            shadowOpacity={0.1}
            shadowBlur={8}
          />
        </Group>
      ))}
    </Group>
  );
}

export function WrapFront({ size, themeId = 'kraft', sizeId = 'medium', shapeId = 'klasik' }) {
  const theme = WRAP_THEMES[themeId] || WRAP_THEMES.kraft;
  const g = useMemo(() => computeWrapGeom(size, sizeId), [size, sizeId]);
  const texture = useMemo(() => makeTexture(theme.texture), [theme.texture]);
  const front = useMemo(() => buildFrontPanels(shapeId, g), [shapeId, g]);
  const tailD = useMemo(() => buildTail(shapeId, g), [shapeId, g]);

  return (
    <Group listening={false}>
      {/* ── sleeve panels: each wrap shape folds its own way ── */}
      {front.panels.map((p, i) => (
        <SleevePanel key={i} d={p.d} recessed={p.recessed} theme={theme} g={g} texture={texture} />
      ))}

      {/* fold highlights (klasik center crease / silang cross / geometris facets) */}
      {front.folds?.map((f, i) => (
        <Path
          key={i}
          data={f}
          stroke={theme.highlight}
          strokeWidth={1.4}
          strokeOpacity={0.55}
          shadowColor="rgba(0,0,0,0.25)"
          shadowBlur={1}
          shadowOffsetY={0.6}
        />
      ))}

      {/* ── tail ── */}
      <Path data={tailD} fill={theme.base} stroke={theme.shadow} strokeWidth={1} strokeOpacity={0.3} />
      <Path
        data={tailD}
        fillLinearGradientStartPoint={{ x: g.cx, y: g.tieY }}
        fillLinearGradientEndPoint={{ x: g.cx, y: g.tieY + g.tailLen }}
        fillLinearGradientColorStops={[0, 'rgba(0,0,0,0.2)', 1, 'rgba(0,0,0,0)']}
      />
      {texture && <Path data={tailD} fillPatternImage={texture} fillPatternRepeat="repeat" opacity={0.7} />}

      {/* ── twine bow at the tie ── */}
      <Twine cx={g.cx} cy={g.tieY} color={theme.twine} tailLen={g.tailLen} />
    </Group>
  );
}

/** One sleeve panel: base fill + vertical shade + optional recess + texture. */
function SleevePanel({ d, recessed, theme, g, texture }) {
  return (
    <>
      <Path data={d} fill={theme.base} stroke={theme.shadow} strokeWidth={1.2} strokeOpacity={0.35} />
      <Path
        data={d}
        fillLinearGradientStartPoint={{ x: g.cx, y: g.rimY }}
        fillLinearGradientEndPoint={{ x: g.cx, y: g.tieY }}
        fillLinearGradientColorStops={[0, 'rgba(255,255,255,0.32)', 0.5, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.24)']}
      />
      {recessed && <Path data={d} fill="#2a1d12" opacity={0.16} />}
      {texture && <Path data={d} fillPatternImage={texture} fillPatternRepeat="repeat" opacity={0.7} />}
    </>
  );
}

/**
 * The sleeve OPENING — the dark recess + highlighted rim (the "brown oval"
 * at the mouth). The front rim now CURVES slightly downward into the
 * sleeve (a shallow scoop), so the opening reads as a 3D cone mouth rather
 * than a flat ellipse. Drawn as its own layer so it can sit BEHIND the
 * flowers: stems always overlap the opening, never the other way around.
 */
export function WrapMouth({ size, themeId = 'kraft', sizeId = 'medium', shapeId = 'klasik' }) {
  const theme = WRAP_THEMES[themeId] || WRAP_THEMES.kraft;
  const g = useMemo(() => computeWrapGeom(size, sizeId), [size, sizeId]);
  // Narrower sleeve mouth for the slimmer shapes (geometris / ramping).
  const mouthW = g.halfW * (shapeId === 'geometris' || shapeId === 'ramping' ? 0.82 : 0.9);
  const rimDip = 15; // how far the front rim scoops down below the ellipse line
  const rimPath = `M ${(g.cx - mouthW).toFixed(1)} ${g.rimY.toFixed(1)} Q ${g.cx.toFixed(1)} ${(g.rimY + rimDip).toFixed(1)} ${(g.cx + mouthW).toFixed(1)} ${g.rimY.toFixed(1)}`;
  return (
    <Group listening={false}>
      {/* dark recess inside the opening — sits a touch below the rim line */}
      <Ellipse x={g.cx} y={g.rimY + 6} radiusX={mouthW * 0.95} radiusY={10} fill="#2a1d12" opacity={0.22} />
      {/* soft inner shadow hugging the underside of the rim */}
      <Path
        data={rimPath}
        stroke="#2a1d12"
        strokeWidth={6}
        lineCap="round"
        opacity={0.2}
      />
      {/* highlighted rim scooping down into the sleeve */}
      <Path
        data={rimPath}
        stroke={theme.highlight}
        strokeWidth={10}
        lineCap="round"
        shadowColor={theme.shadow}
        shadowOpacity={0.35}
        shadowBlur={2}
        shadowOffsetY={2}
      />
    </Group>
  );
}

/** Twine: two loops, a knot, and hanging strings. */
function Twine({ cx, cy, color, tailLen }) {
  const loop = (sx) => (
    <Ellipse
      x={cx + sx * 25}
      y={cy - 3}
      radiusX={23}
      radiusY={14}
      stroke={color}
      strokeWidth={5.5}
      rotation={sx * 24}
      fillEnabled={false}
    />
  );
  return (
    <Group listening={false}>
      <Path
        data={`M ${cx} ${cy} Q ${cx - 42} ${cy - 17} ${cx - 64} ${cy + 4} M ${cx} ${cy + 4} Q ${cx - 42} ${cy - 9} ${cx - 64} ${cy + 11} M ${cx} ${cy} Q ${cx + 42} ${cy - 17} ${cx + 64} ${cy + 4} M ${cx} ${cy + 4} Q ${cx + 42} ${cy - 9} ${cx + 64} ${cy + 11}`}
        stroke={color}
        strokeWidth={3}
      />
      {loop(-1)}
      {loop(1)}
      <Ellipse x={cx} y={cy + 2} radiusX={8.5} radiusY={8.5} fill={color} />
      <Ellipse x={cx - 2} y={cy} radiusX={3} radiusY={3} fill="#fff" opacity={0.5} />
      <Path
        data={`M ${cx - 7} ${cy + 9} Q ${cx - 16} ${cy + 58} ${cx - 22} ${cy + Math.min(116, tailLen * 0.6)}`}
        stroke={color}
        strokeWidth={4.2}
        lineCap="round"
      />
      <Path
        data={`M ${cx + 7} ${cy + 9} Q ${cx + 16} ${cy + 58} ${cx + 22} ${cy + Math.min(116, tailLen * 0.6)}`}
        stroke={color}
        strokeWidth={4.2}
        lineCap="round"
      />
    </Group>
  );
}

// Re-export so callers can inspect a shape without importing the lib directly.
export { getWrapShape };
