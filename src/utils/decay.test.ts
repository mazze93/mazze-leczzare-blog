import { describe, it, expect } from "vitest";
import { computeZone, decayStatus, DRIFT_START_DAYS, ERASURE_DAYS, DAY_MS } from "./decay";

const NOW = Date.UTC(2026, 4, 23); // 2026-05-23

function daysAgo(n: number): number {
  return NOW - n * DAY_MS;
}

describe("computeZone", () => {
  it("pins committed nodes to signal regardless of age", () => {
    const r = computeZone(daysAgo(10_000), true, NOW);
    expect(r.zone).toBe("signal");
    expect(r.driftRatio).toBe(0);
  });

  it("places freshly-touched work in experiment with no drift", () => {
    const r = computeZone(daysAgo(5), false, NOW);
    expect(r.zone).toBe("experiment");
    expect(r.driftRatio).toBe(0);
  });

  it("keeps work in experiment but drifts it within the band", () => {
    const midBand = (DRIFT_START_DAYS + ERASURE_DAYS) / 2; // 105 days
    const r = computeZone(daysAgo(midBand), false, NOW);
    expect(r.zone).toBe("experiment");
    expect(r.driftRatio).toBeGreaterThan(0);
    expect(r.driftRatio).toBeLessThan(1);
    expect(r.driftRatio).toBeCloseTo(0.5, 1);
  });

  it("drops fully-aged work into undefined with max drift", () => {
    const r = computeZone(daysAgo(ERASURE_DAYS + 30), false, NOW);
    expect(r.zone).toBe("undefined");
    expect(r.driftRatio).toBe(1);
  });

  it("treats exactly DRIFT_START_DAYS as the start of drift", () => {
    const r = computeZone(daysAgo(DRIFT_START_DAYS), false, NOW);
    expect(r.zone).toBe("experiment");
    expect(r.driftRatio).toBeCloseTo(0, 5);
  });

  it("treats exactly ERASURE_DAYS as undefined", () => {
    const r = computeZone(daysAgo(ERASURE_DAYS), false, NOW);
    expect(r.zone).toBe("undefined");
    expect(r.driftRatio).toBe(1);
  });
});

describe("decayStatus", () => {
  const NOW2 = Date.UTC(2026, 4, 23);
  const at = (days: number) => computeZone(NOW2 - days * DAY_MS, false, NOW2);

  it("reports sealed for committed projects", () => {
    const state = computeZone(NOW2 - 9999 * DAY_MS, true, NOW2);
    expect(decayStatus(state, true)).toBe("sealed");
  });

  it("counts down days until drift while fresh", () => {
    expect(decayStatus(at(10), false)).toBe("20 days until drift");
  });

  it("reports days into drift within the band", () => {
    expect(decayStatus(at(60), false)).toBe("30 days into drift");
  });

  it("reports erasure once fully aged", () => {
    expect(decayStatus(at(ERASURE_DAYS + 5), false)).toBe("in erasure");
  });
});
