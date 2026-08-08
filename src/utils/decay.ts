export type Zone = "undefined" | "experiment" | "signal" | "resolved";

export const DAY_MS = 86_400_000;
export const DRIFT_START_DAYS = 30;
export const ERASURE_DAYS = 180;

export interface ZoneState {
  zone: Zone;
  driftRatio: number; // 0 at fresh/sealed/resolved, 0→1 across the drift band, 1 at erasure
  ageDays: number;
}

/**
 * Zone is a pure function of recency and two seals.
 * Precedence: resolved > committed > age.
 *   resolved  → terminal archive. Complete work resolves with dignity:
 *               a fixed array in outer space — no decay, and it no longer
 *               competes with live signal or emerging mass.
 *   committed → signal (sealed, never decays, still live/gravitational)
 * Otherwise age decides:
 *   age < DRIFT_START_DAYS  → experiment, driftRatio 0
 *   drift band              → experiment, driftRatio interpolated 0→1
 *   age >= ERASURE_DAYS     → undefined, driftRatio 1 (faint traces at the edge)
 */
export function computeZone(
  lastTouchedMs: number,
  committed: boolean,
  nowMs: number,
  resolved: boolean = false,
): ZoneState {
  const ageDays = (nowMs - lastTouchedMs) / DAY_MS;

  if (resolved) {
    return { zone: "resolved", driftRatio: 0, ageDays };
  }

  if (committed) {
    return { zone: "signal", driftRatio: 0, ageDays };
  }

  if (ageDays < DRIFT_START_DAYS) {
    return { zone: "experiment", driftRatio: 0, ageDays };
  }

  if (ageDays >= ERASURE_DAYS) {
    return { zone: "undefined", driftRatio: 1, ageDays };
  }

  const driftRatio = (ageDays - DRIFT_START_DAYS) / (ERASURE_DAYS - DRIFT_START_DAYS);
  return { zone: "experiment", driftRatio, ageDays };
}

/** Human-readable decay state for studio/project display. Pure. */
export function decayStatus(state: ZoneState, committed: boolean): string {
  if (state.zone === "resolved") return "resolved — archival";
  if (committed) return "sealed";
  if (state.zone === "undefined") return "in erasure";
  if (state.ageDays < DRIFT_START_DAYS) {
    return `${Math.ceil(DRIFT_START_DAYS - state.ageDays)} days until drift`;
  }
  return `${Math.floor(state.ageDays - DRIFT_START_DAYS)} days into drift`;
}
