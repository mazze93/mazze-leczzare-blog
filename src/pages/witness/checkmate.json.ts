import type { APIRoute } from "astro";
import raw from "../../data/checkmate-witness.json";
import { parseWitness, toLedgerJson } from "../../utils/checkmateWitness";

// checkmate's head as this site last witnessed it, in checkmate's own
// ledger.json shape. Built from the committed snapshot; see checkmateWitness.ts.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(toLedgerJson(parseWitness(raw)), null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
