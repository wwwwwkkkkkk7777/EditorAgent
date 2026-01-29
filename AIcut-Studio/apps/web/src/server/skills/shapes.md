---
title: Shapes & Geometry
impact: MEDIUM
tags: shapes, geometry, icons
---

## Shapes with CSS

```tsx
<div style={{
  width: 120,
  height: 120,
  backgroundColor: "#6366f1",
  borderRadius: "50%",
}} />
```

## Motion

Use springs for scale and rotation:

```tsx
const scale = spring({ frame, fps, config: { damping: 12 } });
const rotate = frame * 2;
```
