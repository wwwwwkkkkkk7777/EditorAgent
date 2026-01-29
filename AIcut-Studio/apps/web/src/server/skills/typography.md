---
title: Typography & Text Animation
impact: MEDIUM
tags: text, typewriter, titles
---

## Text Styling

Use a clean font and high contrast:

```tsx
<div style={{
  fontFamily: "Inter, sans-serif",
  fontSize: 64,
  color: "#ffffff",
}}>
  Title
</div>
```

## Typewriter Effect

```tsx
const typedChars = Math.min(Math.floor(frame * 0.15), FULL_TEXT.length);
const typedText = FULL_TEXT.slice(0, typedChars);
```

## Reveal Motion

```tsx
const y = interpolate(frame, [0, 20], [20, 0], { extrapolateRight: "clamp" });
```
