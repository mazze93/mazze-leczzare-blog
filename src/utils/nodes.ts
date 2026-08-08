export type PieceType = "blog" | "signal" | "tesserae";

export interface RawEntry {
  id: string;
  type: PieceType;
  data: {
    title: string;
    project?: string;
    committed?: boolean;
    resolved?: boolean;
    pubDate: Date;
    updatedDate?: Date;
  };
}

export interface PieceRef {
  id: string;
  title: string;
  type: PieceType;
  pubDate: string; // ISO
}

export interface NodeRecord {
  slug: string;
  title: string;       // titleized slug (display name)
  lastTouched: string; // ISO — max(updatedDate ?? pubDate) across pieces
  committed: boolean;  // true if any piece is committed
  resolved: boolean;   // true if any piece is resolved — TERMINAL: the node
                       // is complete, archived with dignity, exempt from
                       // decay, and no longer competes with emerging work
  count: number;
  pieces: PieceRef[];  // newest-first
}

export function titleize(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function touchedAt(data: RawEntry["data"]): number {
  return (data.updatedDate ?? data.pubDate).getTime();
}

export function aggregateNodes(entries: RawEntry[]): NodeRecord[] {
  const groups = new Map<string, RawEntry[]>();
  for (const e of entries) {
    const slug = e.data.project;
    if (!slug) continue;
    const list = groups.get(slug);
    if (list) list.push(e);
    else groups.set(slug, [e]);
  }

  const nodes: NodeRecord[] = [];
  for (const [slug, group] of groups) {
    // Pieces are listed in publication order (pubDate); the node's lastTouched (below) uses updatedDate.
    const sorted = [...group].sort(
      (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
    );
    const lastTouchedMs = Math.max(...group.map((e) => touchedAt(e.data)));
    nodes.push({
      slug,
      title: titleize(slug),
      lastTouched: new Date(lastTouchedMs).toISOString(),
      committed: group.some((e) => e.data.committed === true),
      resolved: group.some((e) => e.data.resolved === true),
      count: group.length,
      pieces: sorted.map((e) => ({
        id: e.id,
        title: e.data.title,
        type: e.type,
        pubDate: e.data.pubDate.toISOString(),
      })),
    });
  }

  nodes.sort(
    (a, b) => new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime(),
  );
  return nodes;
}
