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

  return (
    <nav className={containerClass} aria-label="Project constellation" ref={rootRef}>
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
