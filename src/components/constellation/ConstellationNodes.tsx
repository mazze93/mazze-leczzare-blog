import { useEffect, useRef, useState, type CSSProperties } from "react";
import { computeZone, type Zone } from "../../utils/decay";
import { nodePosition, nodeStyle } from "../../utils/layout";
import styles from "./ConstellationNodes.module.css";

interface ManifestNode {
  slug: string;
  title: string;
  lastTouched: string;
  committed: boolean;
  resolved?: boolean;
  count: number;
  pieces: { id: string; title: string; type: string; pubDate: string }[];
}

interface RenderNode {
  slug: string;
  title: string;
  zone: Zone;
  count: number;
  xPct: number;
  yPct: number;
  opacity: number;
  scale: number;
  delay: number | null;
  gold: boolean;
}

/** Decoupled bridge to the brand compass (Header listens for this). */
function setCompassState(state: "idle" | "focus" | "engaged"): void {
  window.dispatchEvent(new CustomEvent("compass:state", { detail: { state } }));
}

// Deterministic 0..1 from a string — same manifest, same sky (shared idiom
// with /constellation's plate).
function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

/** Callsign for the well readout — identity, never decoration. */
function callsign(slug: string): string {
  return (
    slug.split("-").map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 3) +
    "-" +
    Math.floor(hash01(slug, 21) * 4096).toString(16).toUpperCase().padStart(3, "0")
  );
}

const ISOLINE_RADII = [46, 84, 130, 184];

export default function ConstellationNodes() {
  const [nodes, setNodes] = useState<RenderNode[]>([]);
  const [reduced, setReduced] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(prefersReduced);

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/nodes-manifest.json");
        if (!res.ok) return;
        const data: { nodes: ManifestNode[] } = await res.json();
        if (cancelled || !data.nodes?.length) return;

        const now = Date.now();
        const rendered: RenderNode[] = data.nodes.map((n) => {
          const { zone, driftRatio } = computeZone(
            new Date(n.lastTouched).getTime(),
            n.committed,
            now,
            n.resolved === true,
          );
          const { xPct, yPct } = nodePosition(zone, driftRatio, n.slug);
          const { opacity, scale } = nodeStyle(zone, driftRatio);
          return {
            slug: n.slug,
            title: n.title,
            zone,
            count: n.count,
            xPct,
            yPct,
            opacity,
            scale,
            delay: prefersReduced ? null : Math.random() * 600,
            gold: false,
          };
        });
        // The gravity well: heaviest live signal node (recency breaks ties).
        // Derived, never curated — same rule as the /constellation plate.
        const live = rendered
          .filter((r) => r.zone === "signal")
          .sort((a, b) => b.count - a.count || b.slug.localeCompare(a.slug));
        if (live.length > 0) live[0].gold = true;
        setNodes(rendered);
      } catch {
        /* network failure → hero CTAs remain the fallback */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Cursor gravity — ported constant-for-constant from BreathingHero's
  // canvas (dist < 150 → force = (150-dist)/150; pull 0.03/frame; spring
  // return 0.03). Truth nodes lean toward the cursor exactly like the
  // ambient field does. Skipped entirely under reduced motion.
  useEffect(() => {
    if (reduced || nodes.length === 0) return;
    const root = rootRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLAnchorElement>("a"));
    const state = els.map(() => ({ x: 0, y: 0 }));
    const mouse = { x: -9999, y: -9999 };
    let raf = 0;

    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      els.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2 - state[i].x;
        const cy = r.top + r.height / 2 - state[i].y;
        const dx = mouse.x - cx;
        const dy = mouse.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0.001) {
          const force = (150 - dist) / 150;
          state[i].x += dx * force * 0.03;
          state[i].y += dy * force * 0.03;
        }
        state[i].x *= 0.97;
        state[i].y *= 0.97;
        el.style.setProperty("--gx", `${state[i].x.toFixed(2)}px`);
        el.style.setProperty("--gy", `${state[i].y.toFixed(2)}px`);
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [reduced, nodes.length]);

  // Empty container while unfilled (fetch pending/failed/no nodes).
  // :not(:empty) in the stylesheet keeps it inert until it has nodes.
  if (nodes.length === 0) {
    return <div className={styles.constellationNodes} />;
  }

  const containerClass = reduced
    ? styles.constellationNodes
    : `${styles.constellationNodes} ${styles.animate}`;

  // Survey furniture — the plate's ordering vocabulary (archive seam, zone
  // captions, meta labels, well isolines, asterism, callsign readout)
  // adapted to the living hero. Anchored to base positions; gravity moves
  // the nodes, the survey stays fixed — instruments don't chase the sky.
  const gold = nodes.find((n) => n.gold);
  const signalOthers = nodes.filter((n) => n.zone === "signal" && !n.gold);

  return (
    <nav className={containerClass} aria-label="Project constellation" ref={rootRef}>
      <svg className={styles.cnSurvey} aria-hidden="true">
        <defs>
          <radialGradient id="cn-well-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8b64c" stopOpacity="0.4" />
            <stop offset="45%" stopColor="#e8b64c" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#e8b64c" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* archive seam — the archive band ends at 13% along the axis */}
        <line className={styles.svySeam} x1="13%" y1="8%" x2="13%" y2="90%" />
        <g className={styles.svyCaptions}>
          <text x="11%" y="96%" textAnchor="middle">ARCHIVE</text>
          <text x="24%" y="96%" textAnchor="middle">ERASURE</text>
          <text x="50%" y="96%" textAnchor="middle">EMERGENCE</text>
          <text x="86%" y="96%" textAnchor="middle">SIGNAL</text>
        </g>
        <g className={styles.svyMeta}>
          <text x="98.5%" y="34" textAnchor="end">LAT 35.9940° N · LON 78.8986° W</text>
          <text x="98.5%" y="52" textAnchor="end" className={gold ? styles.svyAcquired : undefined}>
            {gold ? "[ SIGNAL: ACQUIRED ]" : "[ SIGNAL: SEARCHING ]"}
          </text>
        </g>
        {gold && (
          <g className={styles.svyIso}>
            {ISOLINE_RADII.map((r) => (
              <circle key={r} cx={`${gold.xPct}%`} cy={`${gold.yPct}%`} r={r} />
            ))}
            <circle
              className={styles.svyHalo}
              cx={`${gold.xPct}%`} cy={`${gold.yPct}%`} r="120"
              fill="url(#cn-well-glow)"
            />
          </g>
        )}
        {gold && (
          <g className={styles.svyAsterism}>
            {signalOthers.map((n) => (
              <line
                key={n.slug}
                x1={`${gold.xPct}%`} y1={`${gold.yPct}%`}
                x2={`${n.xPct}%`} y2={`${n.yPct}%`}
              />
            ))}
          </g>
        )}
        {gold && (
          <text className={styles.svyReadout} x={`${gold.xPct}%`} y={`${gold.yPct}%`} dy="46" textAnchor="middle">
            {callsign(gold.slug)} · MASS {gold.count} · LOCKED
          </text>
        )}
      </svg>
      {nodes.map((n) => {
        const style = {
          "--x": `${n.xPct}%`,
          "--y": `${n.yPct}%`,
          "--opacity": n.opacity,
          "--scale": n.scale,
          ...(n.delay !== null ? { "--delay": `${n.delay}ms` } : {}),
        } as CSSProperties;
        const pieceWord = n.count === 1 ? "piece" : "pieces";
        return (
          <a
            key={n.slug}
            className={styles.cnNode}
            href={`/project/${n.slug}/`}
            data-zone={n.zone}
            data-gold={n.gold || undefined}
            style={style}
            aria-label={`${n.title} — ${n.gold ? "the gravity well, " : ""}${n.zone} zone, ${n.count} ${pieceWord}`}
            onMouseEnter={() => setCompassState("focus")}
            onMouseLeave={() => setCompassState("idle")}
            onFocus={() => setCompassState("focus")}
            onBlur={() => setCompassState("idle")}
            onClick={() => setCompassState("engaged")}
          >
            <span className={styles.cnDot} aria-hidden="true" />
            <span className={styles.cnLabel}>{n.title}</span>
          </a>
        );
      })}
    </nav>
  );
}
