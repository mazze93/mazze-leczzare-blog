import { describe, it, expect } from "vitest";
import { seededUnit, nodePosition, nodeStyle } from "./layout";

describe("seededUnit", () => {
  it("is deterministic for the same slug", () => {
    expect(seededUnit("merchants-of-war")).toBe(seededUnit("merchants-of-war"));
  });
  it("returns a value in [0, 1)", () => {
    for (const s of ["a", "secure-pride", "x-y-z", ""]) {
      const u = seededUnit(s);
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
    }
  });
  it("differs across different slugs", () => {
    expect(seededUnit("alpha")).not.toBe(seededUnit("beta"));
  });
});

describe("nodePosition", () => {
  it("places signal nodes in the right band (>=78%)", () => {
    const p = nodePosition("signal", 0, "x");
    expect(p.xPct).toBeGreaterThanOrEqual(78);
    expect(p.xPct).toBeLessThanOrEqual(92);
  });
  it("places undefined nodes in the left band (<=22%)", () => {
    const p = nodePosition("undefined", 1, "x");
    expect(p.xPct).toBeGreaterThanOrEqual(6);
    expect(p.xPct).toBeLessThanOrEqual(22);
  });
  it("places fresh experiment nodes in the center band", () => {
    const p = nodePosition("experiment", 0, "x");
    expect(p.xPct).toBeGreaterThanOrEqual(40);
    expect(p.xPct).toBeLessThanOrEqual(66);
  });
  it("pulls a drifting experiment node leftward as driftRatio rises", () => {
    const fresh = nodePosition("experiment", 0, "samekey");
    const drifted = nodePosition("experiment", 1, "samekey");
    expect(drifted.xPct).toBeLessThan(fresh.xPct);
  });
  it("keeps yPct within 12–88%", () => {
    const p = nodePosition("experiment", 0, "anything");
    expect(p.yPct).toBeGreaterThanOrEqual(12);
    expect(p.yPct).toBeLessThanOrEqual(88);
  });
});

describe("nodeStyle", () => {
  it("renders signal at full intensity", () => {
    expect(nodeStyle("signal", 0)).toEqual({ opacity: 1, scale: 1 });
  });
  it("dims an experiment node as it drifts", () => {
    expect(nodeStyle("experiment", 1).opacity).toBeLessThan(nodeStyle("experiment", 0).opacity);
  });
  it("renders undefined faded and smaller", () => {
    const s = nodeStyle("undefined", 1);
    expect(s.opacity).toBeLessThan(0.5);
    expect(s.scale).toBeLessThan(1);
  });
});
