import { describe, expect, it } from "vitest";
import raw from "../data/bench-local-models.json";
import {
  type Dataset, CONTROL, decodeRows, memoryRows, ramRows, truncationRows,
} from "./benchLocalModels";

const d = raw as unknown as Dataset;

// Expected values are read off the committed results.json by hand, so a
// derivation bug (wrong run, wrong ctx, wrong field) fails here.
describe("bench-local-models derivations", () => {
  it("truncation: default server cuts llama-server models to ~2k, 32k server does not", () => {
    const rows = Object.fromEntries(truncationRows(d).map((r) => [r.label, r]));
    expect(rows["gpt-oss:20b"]).toMatchObject({ from: 2050, to: 20766 });
    expect(rows["qwen3:14b"]).toMatchObject({ from: 2050, to: 22483 });
    expect(rows["gemma4:latest"]).toMatchObject({ from: 17688, to: 17688 });
    expect(rows["devstral:24b"].to).toBeNull();
    expect(rows[CONTROL]).toMatchObject({ from: 2051, to: 4099 });
  });

  it("bars and memory come from the 32k cells of the full run only", () => {
    expect(decodeRows(d).map((r) => r.label)).toEqual(["gpt-oss:20b", "qwen3:14b", "gemma4:12b", "gemma4:latest"]);
    expect(decodeRows(d).find((r) => r.label === "gemma4:latest")?.value).toBe(123.7);
    expect(ramRows(d).find((r) => r.label === "qwen3:14b")?.value).toBe(13.81);
    expect(memoryRows(d).find((r) => r.label === "qwen3:14b")).toMatchObject({ from: 74, to: 2 });
  });

  it("dataset carries no local paths", () => {
    expect(JSON.stringify(raw)).not.toMatch(/\/Users\//);
  });
});
