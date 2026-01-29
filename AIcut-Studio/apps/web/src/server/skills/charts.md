---
title: Charts & Data Visualization
impact: MEDIUM
tags: charts, graphs, bars, data
---

## Chart Layout

Use a clear baseline and readable spacing. Keep a consistent grid:

```tsx
<AbsoluteFill style={{ backgroundColor: "transparent", padding: 60 }}>
  <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
    {/* Bars here */}
  </div>
</AbsoluteFill>
```

## Animations

```tsx
const progress = spring({ frame, fps, config: { damping: 12, stiffness: 90 } });
const height = maxHeight * progress;
```

## Styling

- Use 2-4 colors max.
- Add subtle shadows for depth.
- Labels should use `fontFamily: "Inter, sans-serif"`.
