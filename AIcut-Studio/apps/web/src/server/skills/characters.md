---
title: Characters & Illustrations
impact: HIGH
tags: characters, cartoon, cute, animals, illustrations
---

## Background Rule for Characters

**Root container uses transparent background, character elements use solid colors:**

```tsx
<AbsoluteFill style={{ backgroundColor: "transparent" }}>
  {/* Character with solid colors */}
  <div style={{ backgroundColor: "#F5D6A8" }}>...</div>
</AbsoluteFill>
```

## Building Cartoon Characters with CSS

Use nested divs with border-radius for organic shapes:

```tsx
// Cute animal body structure
<div style={{ position: "relative" }}>
  {/* Body */}
  <div style={{
    width: 200,
    height: 150,
    backgroundColor: "#F5D6A8",
    borderRadius: "50%",
    position: "relative"
  }}>
    {/* Head */}
    <div style={{
      position: "absolute",
      top: -80,
      left: "50%",
      transform: "translateX(-50%)",
      width: 120,
      height: 100,
      backgroundColor: "#F5D6A8",
      borderRadius: "50%"
    }}>
      {/* Eyes */}
      <div style={{
        position: "absolute",
        top: 30,
        left: 25,
        width: 20,
        height: 20,
        backgroundColor: "#333",
        borderRadius: "50%"
      }} />
    </div>
  </div>
</div>
```

## Color Palettes for Characters

**Warm Animals (dogs, cats, bears):**
- Body: #F5D6A8, #D4A574, #E8C39E
- Eyes: #333333, #1a1a1a
- Nose: #1a1a1a, #4a3728
- Cheeks: #FFB6C1, #FFC0CB
- Tongue: #E63946, #FF6B6B

**Cool Characters (birds, fish):**
- Body: #74b9ff, #0984e3, #81ecec
- Eyes: #2d3436
- Beak/Fins: #fdcb6e, #e17055

## Animated Features

```tsx
// Blinking eyes
const blinkProgress = interpolate(
  frame % 90,
  [0, 5, 10, 90],
  [1, 0, 1, 1],
  { extrapolateRight: "clamp" }
);
const eyeScaleY = blinkProgress;

<div style={{ transform: \`scaleY(${eyeScaleY})\` }}>
  {/* Eye content */}
</div>

// Tail wagging
const tailWag = Math.sin(frame * 0.3) * 25;
<div style={{
  transform: \`rotate(${tailWag}deg)\`,
  transformOrigin: "left center"
}} />

// Breathing/idle animation
const breathe = Math.sin(frame * 0.1) * 0.03 + 1;
<div style={{ transform: \`scale(${breathe})\` }} />
```

## Expression Variations

```tsx
// Happy - curved mouth
<div style={{
  width: 40,
  height: 20,
  borderBottom: "4px solid #333",
  borderRadius: "0 0 50% 50%"
}} />

// Surprised - open mouth
<div style={{
  width: 30,
  height: 30,
  backgroundColor: "#333",
  borderRadius: "50%"
}} />

// Blush marks
<div style={{
  width: 25,
  height: 15,
  backgroundColor: "#FFB6C1",
  borderRadius: "50%",
  opacity: 0.7
}} />
```
