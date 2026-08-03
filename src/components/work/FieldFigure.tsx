import { useEffect, useRef, useState } from "react";
import styles from "./FieldFigure.module.css";

/**
 * FieldFigure — the masthead field-line plate, promoted from wallpaper.
 *
 * Geometry is the publication-surface plate ("the thesis is the axis"):
 * concentric rings around a point on a vertical axis, field lines bending
 * away from it to the right, flat horizon lines running in from the left.
 * In the source HTML it sat at 0.10–0.18 opacity and was effectively
 * invisible. Here it draws itself in, breathes, and leans toward the
 * pointer — which is what earns the hydration.
 */

const AXIS_X = 560;
const AXIS_Y = 280;
const RINGS = [70, 130, 196, 268, 348];
const RIGHT_COUNT = 8; // field lines per side of the axis
const FAR_COUNT = 4; // horizon lines per side
const GOLD_INDEX = 3; // the one line that carries the accent

/**
 * One field line, springing from just right of the axis and relaxing toward
 * the horizontal at the right edge. `dir` is -1 above the axis, +1 below.
 * Coefficients are lifted from the hand-drawn plate so the curve family is
 * identical to the original — only the render is new.
 */
function fieldLine(i: number, dir: 1 | -1): string {
  const y0 = AXIS_Y + dir * 30 * i;
  const c1x = 638.1 + (i - 1) * 28.6;
  const c1y = AXIS_Y + dir * 36 * i;
  const c2y = AXIS_Y + dir * 18.6 * i;
  const endY = AXIS_Y + dir * (2 + 4.6 * i);
  return `M 568 ${y0} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, 950 ${c2y.toFixed(
    1,
  )}, 1140 ${endY.toFixed(1)}`;
}

/** A horizon line on the left, stopping short of the rings. */
function horizon(j: number, dir: 1 | -1): { y: number; x: number } {
  return { y: AXIS_Y + dir * 56 * j, x: 546 - 26 * j };
}

const SIDES: (1 | -1)[] = [-1, 1];

export default function FieldFigure() {
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<SVGGElement>(null);
  const ringsRef = useRef<SVGGElement>(null);
  const [still, setStill] = useState(false);
  const [lit, setLit] = useState(false);

  // Reduced motion renders the finished plate and nothing else moves.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Light the plate one frame after mount so the draw-in always plays from
  // its start state rather than being skipped by the initial paint.
  useEffect(() => {
    const id = requestAnimationFrame(() => setLit(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Pointer lean — the field responds to where you are on the header. Values
  // are smoothed in a rAF loop and written straight to transforms, so React
  // never re-renders on pointer move.
  useEffect(() => {
    if (still) return;
    const root = rootRef.current;
    if (!root) return;

    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      if (!r.width || !r.height) return;
      targetX = (e.clientX - r.left) / r.width - 0.5;
      targetY = (e.clientY - r.top) / r.height - 0.5;
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const tick = () => {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      if (fieldRef.current) {
        fieldRef.current.style.transform = `translate(${(curX * 26).toFixed(
          2,
        )}px, ${(curY * 18).toFixed(2)}px)`;
      }
      if (ringsRef.current) {
        ringsRef.current.style.transform = `translate(${(curX * -12).toFixed(
          2,
        )}px, ${(curY * -8).toFixed(2)}px)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [still]);

  // `plate-bleed` is an unhashed hook so the host page can position the plate
  // (work.astro takes it full-bleed); everything visual stays in the module.
  const cls = [
    "plate-bleed",
    styles.plate,
    lit ? styles.lit : "",
    still ? styles.still : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} ref={rootRef} aria-hidden="true">
      <svg
        className={styles.fig}
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <g className={styles.rings} ref={ringsRef}>
          {RINGS.map((r, i) => (
            <circle
              key={r}
              className={styles.ring}
              cx={AXIS_X}
              cy={AXIS_Y}
              r={r}
              pathLength={1}
              style={{ animationDelay: `${120 + i * 90}ms` }}
            />
          ))}
        </g>

        <g className={styles.field} ref={fieldRef}>
          {SIDES.map((dir) =>
            Array.from({ length: RIGHT_COUNT }, (_, n) => {
              const i = n + 1;
              const gold = i === GOLD_INDEX && dir === -1;
              return (
                <path
                  key={`f${dir}${i}`}
                  className={gold ? styles.gold : styles.line}
                  d={fieldLine(i, dir)}
                  pathLength={1}
                  style={{ animationDelay: `${260 + i * 70}ms` }}
                />
              );
            }),
          )}
        </g>

        <g className={styles.horizons}>
          {SIDES.map((dir) =>
            Array.from({ length: FAR_COUNT }, (_, n) => {
              const j = n + 1;
              const { y, x } = horizon(j, dir);
              return (
                <path
                  key={`h${dir}${j}`}
                  className={styles.far}
                  d={`M 0 ${y} H ${x}`}
                  pathLength={1}
                  style={{ animationDelay: `${200 + j * 80}ms` }}
                />
              );
            }),
          )}
          <path
            className={styles.far}
            d={`M 0 ${AXIS_Y} H 546`}
            pathLength={1}
            style={{ animationDelay: "180ms" }}
          />
          <path
            className={styles.far}
            d={`M 574 ${AXIS_Y} H 1132`}
            pathLength={1}
            style={{ animationDelay: "180ms" }}
          />
        </g>

        <path
          className={styles.axis}
          d={`M ${AXIS_X} 26 V 534`}
          pathLength={1}
        />
      </svg>
    </div>
  );
}
