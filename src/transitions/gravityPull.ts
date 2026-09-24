// gravityPull — the transition:animate pair for a project node's click.
//
// Applied to the node element itself (ConstellationNodes.tsx, constellation.astro)
// and to the matching element on the landing page (project/[slug].astro's
// <h1>), both carrying the same `view-transition-name` (`node-${slug}`).
// Astro's ClientRouter morphs one into the other; this pair overrides the
// default linear crossfade-resize with an eased collapse/emerge so the node
// reads as being pulled toward its own centre and the title as erupting from
// that same point — gravity, not a slide.
//
// Keyframes (`gravity-collapse` / `gravity-emerge`) live in global.css, not
// here or in a component <style>: Astro scopes/hashes component keyframe
// names, and this name has to resolve identically on both sides of the
// navigation.
//
// Typed against the shape `transition:animate` expects (Astro's own
// TransitionAnimation/TransitionAnimationPair/TransitionDirectionalAnimations,
// astro/dist/types/public/view-transitions.d.ts) without importing that deep,
// version-specific path — the directive is checked structurally, not by
// import identity.
interface TransitionAnimation {
  name: string;
  delay?: number | string;
  duration?: number | string;
  easing?: string;
  fillMode?: string;
  direction?: string;
}
interface TransitionAnimationPair {
  old: TransitionAnimation | TransitionAnimation[];
  new: TransitionAnimation | TransitionAnimation[];
}
interface TransitionDirectionalAnimations {
  forwards: TransitionAnimationPair;
  backwards: TransitionAnimationPair;
}

const EASE_IN = "cubic-bezier(0.55, 0, 1, 0.45)"; // accelerating in — falling
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)"; // decelerating out — arriving

const pull: TransitionAnimationPair = {
  old: { name: "gravity-collapse", duration: "360ms", easing: EASE_IN, fillMode: "forwards" },
  new: { name: "gravity-emerge", duration: "460ms", delay: "70ms", easing: EASE_OUT, fillMode: "backwards" },
};

export const gravityPull: TransitionDirectionalAnimations = {
  forwards: pull,
  backwards: pull,
};
