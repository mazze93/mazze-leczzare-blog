// Pure derivations from src/data/bench-local-models.json (exported by
// dotfiles bench/export-blog.py). Charts in the post read only from here, so
// every plotted number is a field of a committed results.json — no hand-typed
// values. Tested in benchLocalModels.test.ts.

export interface Cell {
  model: string;
  ctx: string;
  gpu_pct?: number;
  ram_gb?: number;
  load_s?: number;
  decode_tps?: number;
  prefill_tps?: number;
  prompt_tokens_seen_20k?: number;
  loaded_ctx?: number;
  needle_3k?: boolean;
  needle_20k?: boolean;
  tools_short_n?: number;
  tools_long_n?: number;
  tools_long_min_input?: number;
  baseline_free_pct?: number;
  min_free_pct?: number;
  swapouts_delta?: number;
  comfortable?: boolean;
  skipped?: string;
}
export interface Run { what: string; harness_sha256: string; ollama_version: string; cells: Cell[];
  hw: { cpu: string; ram_gb: number }; rule: string; valid: boolean | null }
export interface Verify { file: string; model: string; exit: number | null; harness_sha256: string | null;
  control_seen?: number; control_logged?: number; test_seen?: number; test_logged?: number; failure: string | null }
export interface Dataset { runs: Record<string, Run>; verify: Verify[]; sources: Record<string, string> }

export const FULL = "20261126T195953";
export const SMOKE2 = "smoke2-20261126T195134";
export const CONTROL = "gemma:latest";
/** Display order: the four that reached 32k, then devstral, then the control. */
export const ORDER = ["gpt-oss:20b", "qwen3:14b", "gemma4:12b", "gemma4:latest", "devstral:24b", CONTROL];

export function cell(d: Dataset, run: string, model: string, ctx: string): Cell | undefined {
  return d.runs[run]?.cells.find((c) => c.model === model && c.ctx === ctx);
}

export interface DumbbellRow { label: string; from: number | null; to: number | null; note?: string }
export interface BarRow { label: string; value: number; note?: string }

/** Prompt tokens the model actually received for the ~20k prompt: default server vs 32k server. */
export function truncationRows(d: Dataset): DumbbellRow[] {
  return ORDER.map((m) => {
    const a = cell(d, FULL, m, "default")?.prompt_tokens_seen_20k ?? null;
    let b = cell(d, FULL, m, "32768")?.prompt_tokens_seen_20k ?? null;
    let note: string | undefined;
    if (b === null && m === CONTROL) {
      b = cell(d, SMOKE2, m, "32768")?.prompt_tokens_seen_20k ?? null;
      note = "32k value from smoke run 2; capped by its own 8k native context";
    }
    if (b === null && m === "devstral:24b") note = "32k run stopped: memory";
    // Coincident dots hide the hollow one; say what the eye can't see.
    if (a !== null && a === b) note = "same at both settings: never truncated";
    return { label: m, from: a, to: b, note };
  });
}

const AT32 = ORDER.filter((m) => m !== "devstral:24b" && m !== CONTROL);

export function decodeRows(d: Dataset): BarRow[] {
  return AT32.map((m) => ({ label: m, value: cell(d, FULL, m, "32768")?.decode_tps ?? 0 }));
}

export function ramRows(d: Dataset): BarRow[] {
  return AT32.map((m) => ({ label: m, value: cell(d, FULL, m, "32768")?.ram_gb ?? 0 }));
}

/** Free memory before the model loaded vs the lowest point during the cell, at 32k. */
export function memoryRows(d: Dataset): DumbbellRow[] {
  return AT32.map((m) => {
    const c = cell(d, FULL, m, "32768");
    return { label: m, from: c?.baseline_free_pct ?? null, to: c?.min_free_pct ?? null };
  });
}

export function fmtInt(n: number | null | undefined): string {
  return n === null || n === undefined ? "—" : Math.round(n).toLocaleString("en-US");
}
