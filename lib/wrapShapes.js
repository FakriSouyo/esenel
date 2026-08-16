/**
 * Wrap shapes for the bouquet paper (ported from the reference design).
 * Every shape has a GENUINELY different fold pattern — the back flaps, the
 * front panels and the tail are each built by their own generator, not a
 * resized copy of one shape:
 *
 *   klasik    — rounded classic fan, one smooth sleeve panel, soft tail
 *   geometris — open-edged flaps, three angular panels (two recessed), crisp tail
 *   silang    — asymmetric cross-over: a recessed back triangle + curved
 *               front panel sweeping across it
 *   ramping   — slim slender flaps, five narrow vertical panels
 *
 * All generators return SVG path strings, so they are pure and testable and
 * can be reused by the Konva renderer (BouquetWrap) and the debug overlay
 * (PartsMarkers in BouquetCanvas).
 */

/** How wide (in degrees) the back-flap fan spreads, per craft size. */
export const FLAP_SPREAD = { small: 30, medium: 36, large: 40, 'extra-large': 44 };

/* ------------------------------------------------------------------ *
 * Back flaps — local coordinates: base sits at (0,0), tip points up.  *
 * ------------------------------------------------------------------ */

/** Rounded leaf flap (classic / silang). */
export function flapRound(length, width) {
  return [
    'M 0 0',
    `C ${(-width * 0.62).toFixed(1)} ${(-length * 0.22).toFixed(1)} ${(-width).toFixed(1)} ${(-length * 0.52).toFixed(1)} ${(-width * 0.32).toFixed(1)} ${(-length * 0.82).toFixed(1)}`,
    `C ${(-width * 0.12).toFixed(1)} ${(-length * 0.94).toFixed(1)} -6 ${(-length * 0.99).toFixed(1)} 0 ${(-length).toFixed(1)}`,
    `C 6 ${(-length * 0.99).toFixed(1)} ${(width * 0.12).toFixed(1)} ${(-length * 0.94).toFixed(1)} ${(width * 0.32).toFixed(1)} ${(-length * 0.82).toFixed(1)}`,
    `C ${width.toFixed(1)} ${(-length * 0.52).toFixed(1)} ${(width * 0.62).toFixed(1)} ${(-length * 0.22).toFixed(1)} 0 0`,
    'Z',
  ].join(' ');
}

/** Open-edged flap with a flat tip (geometris). */
export function flapOpen(length, width) {
  return [
    'M 0 0',
    `C ${(-width * 0.7).toFixed(1)} ${(-length * 0.35).toFixed(1)} ${(-width * 0.55).toFixed(1)} ${(-length * 0.75).toFixed(1)} ${(-width * 0.12).toFixed(1)} ${(-length * 0.94).toFixed(1)}`,
    `L 0 ${(-length).toFixed(1)}`,
    `L ${(width * 0.12).toFixed(1)} ${(-length * 0.94).toFixed(1)}`,
    `C ${(width * 0.55).toFixed(1)} ${(-length * 0.75).toFixed(1)} ${(width * 0.7).toFixed(1)} ${(-length * 0.35).toFixed(1)} 0 0`,
    'Z',
  ].join(' ');
}

/** Slim needle flap (ramping). */
export function flapSlim(length, width) {
  return [
    'M 0 0',
    `C ${(-width * 0.3).toFixed(1)} ${(-length * 0.3).toFixed(1)} ${(-width * 0.5).toFixed(1)} ${(-length * 0.7).toFixed(1)} 0 ${(-length).toFixed(1)}`,
    `C ${(width * 0.5).toFixed(1)} ${(-length * 0.7).toFixed(1)} ${(width * 0.3).toFixed(1)} ${(-length * 0.3).toFixed(1)} 0 0`,
    'Z',
  ].join(' ');
}

export const FLAP_FNS = { round: flapRound, open: flapOpen, slim: flapSlim };

/* ------------------------------------------------------------------ *
 * Front panels — absolute coordinates around the wrap geometry `g`    *
 * ({ cx, tieY, rimY, halfW, coneH }). Each returns { panels, fold }.  *
 * ------------------------------------------------------------------ */

/** One smooth flared panel with a soft center crease (klasik). */
export function frontClassic(g) {
  const { cx, tieY, rimY, halfW, coneH } = g;
  const d = [
    `M ${(cx - halfW * 0.34).toFixed(1)} ${tieY.toFixed(1)}`,
    `C ${(cx - halfW * 0.85).toFixed(1)} ${(tieY - coneH * 0.22).toFixed(1)} ${(cx - halfW).toFixed(1)} ${(tieY - coneH * 0.62).toFixed(1)} ${(cx - halfW * 0.7).toFixed(1)} ${(tieY - coneH * 0.85).toFixed(1)}`,
    `C ${(cx - halfW * 0.38).toFixed(1)} ${(rimY + 8).toFixed(1)} ${(cx - halfW * 0.14).toFixed(1)} ${rimY.toFixed(1)} ${cx.toFixed(1)} ${rimY.toFixed(1)}`,
    `C ${(cx + halfW * 0.14).toFixed(1)} ${rimY.toFixed(1)} ${(cx + halfW * 0.38).toFixed(1)} ${(rimY + 8).toFixed(1)} ${(cx + halfW * 0.7).toFixed(1)} ${(tieY - coneH * 0.85).toFixed(1)}`,
    `C ${(cx + halfW).toFixed(1)} ${(tieY - coneH * 0.62).toFixed(1)} ${(cx + halfW * 0.85).toFixed(1)} ${(tieY - coneH * 0.22).toFixed(1)} ${(cx + halfW * 0.34).toFixed(1)} ${tieY.toFixed(1)}`,
    'Z',
  ].join(' ');
  return {
    panels: [{ d, recessed: false }],
    folds: [`M ${cx.toFixed(1)} ${rimY.toFixed(1)} L ${cx.toFixed(1)} ${(tieY - 4).toFixed(1)}`],
  };
}

/** Faceted angular cone — straight edges and a flat rim with a shallow V
 *  dip (geometris). One continuous silhouette with two recessed facets
 *  suggesting folded planes + three crease lines. */
export function frontGeometric(g) {
  const { cx, tieY, rimY, halfW, coneH } = g;
  const rimHalf = halfW * 0.9;
  const sideInset = halfW * 0.34;
  const tieL = cx - halfW * 0.32;
  const tieR = cx + halfW * 0.32;
  const leftTop = cx - rimHalf;
  const rightTop = cx + rimHalf;
  const outline = [
    `M ${tieL.toFixed(1)} ${tieY.toFixed(1)}`,
    `L ${leftTop.toFixed(1)} ${(rimY + 4).toFixed(1)}`,
    `L ${(cx - sideInset).toFixed(1)} ${(rimY + 2).toFixed(1)}`,
    `L ${cx.toFixed(1)} ${(rimY + 10).toFixed(1)}`,
    `L ${(cx + sideInset).toFixed(1)} ${(rimY + 2).toFixed(1)}`,
    `L ${rightTop.toFixed(1)} ${(rimY + 4).toFixed(1)}`,
    `L ${tieR.toFixed(1)} ${tieY.toFixed(1)}`,
    `L ${(cx + halfW * 0.1).toFixed(1)} ${(tieY + 6).toFixed(1)}`,
    `L ${(cx - halfW * 0.1).toFixed(1)} ${(tieY + 6).toFixed(1)} Z`,
  ].join(' ');
  // Left / right folded planes, slightly pushed back for depth.
  const leftFacet = [
    `M ${tieL.toFixed(1)} ${tieY.toFixed(1)}`,
    `L ${leftTop.toFixed(1)} ${(rimY + 4).toFixed(1)}`,
    `L ${cx.toFixed(1)} ${(rimY + 6).toFixed(1)}`,
    `L ${(cx - halfW * 0.16).toFixed(1)} ${tieY.toFixed(1)} Z`,
  ].join(' ');
  const rightFacet = [
    `M ${tieR.toFixed(1)} ${tieY.toFixed(1)}`,
    `L ${rightTop.toFixed(1)} ${(rimY + 4).toFixed(1)}`,
    `L ${cx.toFixed(1)} ${(rimY + 6).toFixed(1)}`,
    `L ${(cx + halfW * 0.16).toFixed(1)} ${tieY.toFixed(1)} Z`,
  ].join(' ');
  return {
    panels: [
      { d: outline, recessed: false },
      { d: leftFacet, recessed: true },
      { d: rightFacet, recessed: true },
    ],
    folds: [
      `M ${cx.toFixed(1)} ${(rimY + 10).toFixed(1)} L ${cx.toFixed(1)} ${(tieY - 4).toFixed(1)}`,
      `M ${leftTop.toFixed(1)} ${(rimY + 4).toFixed(1)} L ${(cx - halfW * 0.2).toFixed(1)} ${tieY.toFixed(1)}`,
      `M ${rightTop.toFixed(1)} ${(rimY + 4).toFixed(1)} L ${(cx + halfW * 0.2).toFixed(1)} ${tieY.toFixed(1)}`,
    ],
  };
}

/** Asymmetric cross-over: recessed back triangle + curved front sweep (silang). */
export function frontCrossover(g) {
  const { cx, tieY, halfW, coneH } = g;
  const back = [
    `M ${(cx - halfW * 0.04).toFixed(1)} ${tieY.toFixed(1)}`,
    `L ${(cx - halfW * 0.88).toFixed(1)} ${(tieY - coneH * 0.52).toFixed(1)}`,
    `L ${(cx - halfW * 0.5).toFixed(1)} ${(tieY - coneH * 1.02).toFixed(1)}`,
    `L ${(cx + halfW * 0.06).toFixed(1)} ${(tieY - coneH * 0.62).toFixed(1)} Z`,
  ].join(' ');
  const front = [
    `M ${(cx + halfW * 0.32).toFixed(1)} ${tieY.toFixed(1)}`,
    `C ${(cx + halfW * 0.88).toFixed(1)} ${(tieY - coneH * 0.3).toFixed(1)} ${(cx + halfW * 0.94).toFixed(1)} ${(tieY - coneH * 0.72).toFixed(1)} ${(cx + halfW * 0.56).toFixed(1)} ${(tieY - coneH * 0.94).toFixed(1)}`,
    `C ${(cx + halfW * 0.1).toFixed(1)} ${(tieY - coneH * 1.04).toFixed(1)} ${(cx - halfW * 0.52).toFixed(1)} ${(tieY - coneH * 0.84).toFixed(1)} ${(cx - halfW * 0.64).toFixed(1)} ${(tieY - coneH * 0.5).toFixed(1)}`,
    `C ${(cx - halfW * 0.5).toFixed(1)} ${(tieY - coneH * 0.16).toFixed(1)} ${(cx - halfW * 0.06).toFixed(1)} ${(tieY - coneH * 0.02).toFixed(1)} ${(cx + halfW * 0.08).toFixed(1)} ${tieY.toFixed(1)}`,
    'Z',
  ].join(' ');
  const fold = [
    `M ${(cx - halfW * 0.46).toFixed(1)} ${(tieY - coneH * 0.5).toFixed(1)}`,
    `Q ${(cx + halfW * 0.04).toFixed(1)} ${(tieY - coneH * 0.7).toFixed(1)} ${(cx + halfW * 0.46).toFixed(1)} ${(tieY - coneH * 0.5).toFixed(1)}`,
  ].join(' ');
  return {
    panels: [
      { d: back, recessed: true },
      { d: front, recessed: false },
    ],
    folds: [fold],
  };
}

/** Five narrow vertical strips (ramping). */
export function frontSlim(g) {
  const { cx, tieY, halfW, coneH } = g;
  const n = 5;
  const spread = halfW * 0.62;
  const panels = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * 2 - 1;
    const px = cx + t * spread;
    const py = tieY - coneH * (0.82 + 0.22 * (1 - Math.abs(t)));
    const baseHalf = halfW * 0.06;
    const d = [
      `M ${(cx + t * halfW * 0.1).toFixed(1)} ${tieY.toFixed(1)}`,
      `L ${(px - baseHalf).toFixed(1)} ${(tieY - coneH * 0.3).toFixed(1)}`,
      `L ${px.toFixed(1)} ${py.toFixed(1)}`,
      `L ${(px + baseHalf).toFixed(1)} ${(tieY - coneH * 0.3).toFixed(1)} Z`,
    ].join(' ');
    panels.push({ d, recessed: Math.abs(t) > 0.3 });
  }
  return { panels, folds: null };
}

export const FRONT_FNS = {
  classic: frontClassic,
  geometric: frontGeometric,
  crossover: frontCrossover,
  slim: frontSlim,
};

/* ------------------------------------------------------------------ *
 * Paper tails — absolute coordinates, `halfW` is already the tail's   *
 * own half-width.                                                     *
 * ------------------------------------------------------------------ */

/** Soft, blunted tail (klasik / silang). */
export function tailSmooth(g) {
  const { cx, tieY, halfW, tailLen } = g;
  const flareY = tieY + tailLen * 0.55;
  const tipY = tieY + tailLen;
  return [
    `M ${(cx - halfW * 0.3).toFixed(1)} ${(tieY - 2).toFixed(1)}`,
    `C ${(cx - halfW * 0.5).toFixed(1)} ${(tieY + tailLen * 0.18).toFixed(1)} ${(cx - halfW * 0.48).toFixed(1)} ${(tieY + tailLen * 0.4).toFixed(1)} ${(cx - halfW * 0.34).toFixed(1)} ${flareY.toFixed(1)}`,
    `L ${cx.toFixed(1)} ${tipY.toFixed(1)}`,
    `L ${(cx + halfW * 0.34).toFixed(1)} ${flareY.toFixed(1)}`,
    `C ${(cx + halfW * 0.48).toFixed(1)} ${(tieY + tailLen * 0.4).toFixed(1)} ${(cx + halfW * 0.5).toFixed(1)} ${(tieY + tailLen * 0.18).toFixed(1)} ${(cx + halfW * 0.3).toFixed(1)} ${(tieY - 2).toFixed(1)}`,
    `C ${(cx + halfW * 0.12).toFixed(1)} ${(tieY + 6).toFixed(1)} ${(cx - halfW * 0.12).toFixed(1)} ${(tieY + 6).toFixed(1)} ${(cx - halfW * 0.3).toFixed(1)} ${(tieY - 2).toFixed(1)}`,
    'Z',
  ].join(' ');
}

/** Sharp pointed tail (geometris / ramping). */
export function tailAngular(g) {
  const { cx, tieY, halfW, tailLen } = g;
  const flareY = tieY + tailLen * 0.5;
  const tipY = tieY + tailLen;
  return [
    `M ${(cx - halfW * 0.28).toFixed(1)} ${tieY.toFixed(1)}`,
    `L ${(cx - halfW * 0.4).toFixed(1)} ${flareY.toFixed(1)}`,
    `L ${cx.toFixed(1)} ${tipY.toFixed(1)}`,
    `L ${(cx + halfW * 0.4).toFixed(1)} ${flareY.toFixed(1)}`,
    `L ${(cx + halfW * 0.28).toFixed(1)} ${tieY.toFixed(1)}`,
    `L ${(cx + halfW * 0.1).toFixed(1)} ${(tieY + 8).toFixed(1)}`,
    `L ${(cx - halfW * 0.1).toFixed(1)} ${(tieY + 8).toFixed(1)} Z`,
  ].join(' ');
}

export const TAIL_FNS = { smooth: tailSmooth, angular: tailAngular };

/* ------------------------------------------------------------------ *
 * Shape registry + builders                                           *
 * ------------------------------------------------------------------ */

export const WRAP_SHAPES = {
  klasik: {
    id: 'klasik',
    label: 'Klasik',
    desc: 'Round classic fan',
    flaps: {
      fn: 'round',
      // [rotation multiplier, length multiplier, width multiplier]
      specs: [
        [-0.98, 0.82, 0.34],
        [-0.47, 1.04, 0.39],
        [-0.09, 0.89, 0.29],
        [0.3, 1.09, 0.41],
        [0.81, 0.89, 0.36],
      ],
    },
    front: 'classic',
    tail: 'smooth',
    tailHalfMul: 0.55,
  },
  geometris: {
    id: 'geometris',
    label: 'Geometris',
    desc: 'Sharp folded panels',
    flaps: {
      fn: 'open',
      specs: [
        [-1.05, 0.85, 0.41],
        [-0.36, 1.05, 0.44],
        [0.34, 0.99, 0.42],
        [1.0, 0.82, 0.39],
      ],
    },
    front: 'geometric',
    tail: 'angular',
    tailHalfMul: 0.5,
  },
  silang: {
    id: 'silang',
    label: 'Silang',
    desc: 'Asymmetric cross-over',
    flaps: {
      fn: 'round',
      specs: [
        [-0.95, 0.73, 0.29],
        [-0.25, 1.0, 0.35],
        [0.42, 1.07, 0.38],
        [0.92, 1.11, 0.39],
      ],
    },
    front: 'crossover',
    tail: 'smooth',
    tailHalfMul: 0.55,
  },
  ramping: {
    id: 'ramping',
    label: 'Ramping',
    desc: 'Slim slender strips',
    flaps: {
      fn: 'slim',
      specs: [
        [-0.86, 0.82, 0.15],
        [-0.43, 0.92, 0.17],
        [0, 1.0, 0.18],
        [0.43, 0.92, 0.17],
        [0.86, 0.82, 0.15],
      ],
    },
    front: 'slim',
    tail: 'angular',
    tailHalfMul: 0.35,
  },
};

export function getWrapShape(shapeId) {
  return WRAP_SHAPES[shapeId] || WRAP_SHAPES.klasik;
}

/**
 * Build the back flaps for a shape + geometry. The fan is deliberately
 * BIG — wide leaves and a length that reaches well past the sleeve mouth
 * so flowers have a paper backdrop behind them. The length base is capped
 * so even the largest size stays inside the canvas.
 */
export function buildFlaps(shapeId, g, sizeId = 'medium') {
  const shape = getWrapShape(shapeId);
  const spread = FLAP_SPREAD[sizeId] || FLAP_SPREAD.medium;
  const flapBase = Math.min(g.coneH * 2.0, 175);
  const fn = FLAP_FNS[shape.flaps.fn];
  return shape.flaps.specs.map(([rotMul, lenMul, widMul]) => {
    const rot = rotMul * spread;
    const length = lenMul * flapBase;
    const width = Math.min(widMul * flapBase, g.halfW * 0.8);
    return { rot, length, width, d: fn(length, width) };
  });
}

/** Build the front panels (with the optional fold line) for a shape. */
export function buildFrontPanels(shapeId, g) {
  const shape = getWrapShape(shapeId);
  return FRONT_FNS[shape.front](g);
}

/** Build the tail path for a shape (applies the shape's tail half-width). */
export function buildTail(shapeId, g) {
  const shape = getWrapShape(shapeId);
  return TAIL_FNS[shape.tail]({ ...g, halfW: g.halfW * shape.tailHalfMul });
}
