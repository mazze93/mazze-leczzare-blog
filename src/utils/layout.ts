import type { Zone } from "./decay";

/** Deterministic 0..1 from a string (FNV-1a). Stable across renders for a given slug. */
export function seededUnit(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export interface NodePos {
  xPct: number;
  yPct: number;
}

/**
 * Horizontal band per zone (percent of hero width); vertical from a second seed.
 * A drifting experiment node is pulled leftward toward the undefined band as
 * driftRatio → 1, so aging is visible as migration, not a snap between zones.
 */
export function nodePosition(zone: Zone, driftRatio: number, slug: string): NodePos {
  const u = seededUnit(slug);
  const v = seededUnit(slug + "::y");
  let xPct: number;
  if (zone === "signal") {
    xPct = 78 + u * 14; // 78–92
  } else if (zone === "undefined") {
    xPct = 6 + u * 16; // 6–22
  } else {
    const base = 40 + u * 26; // 40–66
    const pulled = base - driftRatio * (base - 24); // toward ~24 at full drift
    xPct = pulled;
  }
  const yPct = 12 + v * 76; // 12–88
  return { xPct, yPct };
}

export interface NodeStyleOut {
  opacity: number;
  scale: number;
}

/** Visual intensity: signal full, experiment dims with drift, undefined faded. */
export function nodeStyle(zone: Zone, driftRatio: number): NodeStyleOut {
  if (zone === "signal") return { opacity: 1, scale: 1 };
  if (zone === "undefined") return { opacity: 0.42, scale: 0.82 };
  return { opacity: 1 - driftRatio * 0.45, scale: 1 - driftRatio * 0.12 };
}
