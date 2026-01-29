---
title: Animation Principles
impact: HIGH
tags: motion, spring, easing, timing, staging
---

## Timing & Easing

Use Remotion's `spring()` for organic motion and `interpolate()` for precise linear transitions.

```tsx
const entrance = spring({
  frame,
  fps,
  config: { damping: 12, stiffness: 100 },
});

const fade = interpolate(
  frame,
  [0, 30],
  [0, 1],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);
```

## Staggered Reveals

Stagger elements to create rhythm and depth:

```tsx
const STAGGER = 6;
const progress = spring({
  frame: frame - i * STAGGER,
  fps,
});
```

## Motion Guidelines

- Always animate **something** over time.
- Avoid static scenes.
- Use subtle secondary motion (breathe, float, wobble).
