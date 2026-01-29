import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";
import { Circle, Rect, Triangle, Star, Ellipse, Pie } from "@remotion/shapes";
import { useState, useEffect } from "react";

export const CyberpunkTechIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // COLORS
  const COLOR_NEON_BLUE = "#00f3ff";
  const COLOR_NEON_PURPLE = "#b967ff";
  const COLOR_NEON_PINK = "#ff2a6d";
  const COLOR_HOLOGRAM_BG = "rgba(0, 243, 255, 0.08)";
  const COLOR_TEXT = "#ffffff";
  const COLOR_CIRCUIT_LINE = "#00c6ff";
  const COLOR_GLOW = "rgba(0, 198, 255, 0.3)";

  // TEXT
  const TITLE_TEXT = "FUTURE STARTS NOW";

  // TIMING
  const SCAN_DURATION = 45;
  const PARTICLE_BEAT_INTERVAL = 30;
  const GLOW_PULSE_DURATION = 60;
  const TEXT_APPEAR_FRAME = 20;
  const CIRCUIT_ANIM_DURATION = 120;

  // LAYOUT
  const PADDING = 60;
  const CIRCUIT_WIDTH = 1920;
  const CIRCUIT_HEIGHT = 1080;
  const TEXT_SIZE = 72;
  const SCAN_LINE_HEIGHT = 8;

  // Circuit grid parameters
  const GRID_SPACING_X = 80;
  const GRID_SPACING_Y = 60;
  const GRID_OFFSET_X = 40;
  const GRID_OFFSET_Y = 30;

  // Particle burst logic
  const beatPhase = Math.floor(frame / PARTICLE_BEAT_INTERVAL) % 4;
  const isBeat = frame % PARTICLE_BEAT_INTERVAL < 6;
  const particleCount = isBeat ? 24 : 0;

  // Scan line position
  const scanProgress = interpolate(
    frame,
    [TEXT_APPEAR_FRAME, TEXT_APPEAR_FRAME + SCAN_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Text reveal progress (digital scan effect)
  const textRevealProgress = interpolate(
    frame,
    [TEXT_APPEAR_FRAME, TEXT_APPEAR_FRAME + SCAN_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Hologram glow pulse
  const glowPulse = spring({
    frame: frame % GLOW_PULSE_DURATION,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Circuit animation progress
  const circuitProgress = spring({
    frame: frame % CIRCUIT_ANIM_DURATION,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Particle positions
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    x: Math.random() * CIRCUIT_WIDTH,
    y: Math.random() * CIRCUIT_HEIGHT,
    size: Math.random() * 6 + 2,
    color: i % 3 === 0 ? COLOR_NEON_BLUE : i % 3 === 1 ? COLOR_NEON_PURPLE : COLOR_NEON_PINK,
    delay: i * 2,
  }));

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      {/* Circuit board background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.7,
        }}
      >
        {/* Grid lines */}
        {Array.from({ length: Math.ceil(CIRCUIT_HEIGHT / GRID_SPACING_Y) }).map((_, y) => (
          <div
            key={`h-${y}`}
            style={{
              position: "absolute",
              top: GRID_OFFSET_Y + y * GRID_SPACING_Y,
              left: 0,
              width: "100%",
              height: 1,
              backgroundColor: COLOR_CIRCUIT_LINE,
              opacity: 0.3 * circuitProgress,
            }}
          />
        ))}
        {Array.from({ length: Math.ceil(CIRCUIT_WIDTH / GRID_SPACING_X) }).map((_, x) => (
          <div
            key={`v-${x}`}
            style={{
              position: "absolute",
              top: 0,
              left: GRID_OFFSET_X + x * GRID_SPACING_X,
              width: 1,
              height: "100%",
              backgroundColor: COLOR_CIRCUIT_LINE,
              opacity: 0.3 * circuitProgress,
            }}
          />
        ))}

        {/* Circuit nodes */}
        {Array.from({ length: 40 }).map((_, i) => {
          const x = (i * 137) % CIRCUIT_WIDTH;
          const y = (i * 73) % CIRCUIT_HEIGHT;
          const size = Math.sin(frame * 0.05 + i) * 3 + 6;
          return (
            <div
              key={`node-${i}`}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: size,
                height: size,
                borderRadius: "50%",
                backgroundColor: COLOR_NEON_BLUE,
                boxShadow: `0 0 ${size * 2}px ${COLOR_NEON_BLUE}80`,
                opacity: 0.7 * circuitProgress,
              }}
            />
          );
        })}
      </div>

      {/* Glowing data streams */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {/* Horizontal stream */}
        <div
          style={{
            position: "absolute",
            top: "25%",
            left: 0,
            width: "100%",
            height: 2,
            background: `linear-gradient(90deg, ${COLOR_NEON_BLUE}, ${COLOR_NEON_PURPLE}, ${COLOR_NEON_BLUE})`,
            opacity: 0.6,
            transform: `translateX(${interpolate(frame, [0, 120], [-100, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%)`,
          }}
        />
        {/* Vertical stream */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "75%",
            width: 2,
            height: "100%",
            background: `linear-gradient(180deg, ${COLOR_NEON_PURPLE}, ${COLOR_NEON_PINK}, ${COLOR_NEON_PURPLE})`,
            opacity: 0.6,
            transform: `translateY(${interpolate(frame, [0, 120], [-100, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%)`,
          }}
        />
        {/* Diagonal stream */}
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "10%",
            width: "100%",
            height: 1,
            background: `linear-gradient(45deg, ${COLOR_NEON_BLUE}, ${COLOR_NEON_PURPLE})`,
            opacity: 0.4,
            transform: `rotate(45deg) translateX(${interpolate(frame, [0, 120], [-200, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%)`,
          }}
        />
      </div>

      {/* Hologram text container */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: TEXT_SIZE,
          color: COLOR_TEXT,
          letterSpacing: 4,
          textShadow: `
            0 0 15px ${COLOR_NEON_BLUE}80,
            0 0 30px ${COLOR_NEON_PURPLE}60,
            0 0 45px ${COLOR_NEON_BLUE}40,
            0 0 60px ${COLOR_NEON_PURPLE}30
          `,
          opacity: interpolate(frame, [TEXT_APPEAR_FRAME, TEXT_APPEAR_FRAME + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        {/* Individual characters with staggered reveal */}
        {TITLE_TEXT.split("").map((char, i) => {
          const charReveal = interpolate(
            frame,
            [
              TEXT_APPEAR_FRAME + i * 2,
              TEXT_APPEAR_FRAME + i * 2 + 10,
              TEXT_APPEAR_FRAME + i * 2 + 15,
            ],
            [0, 1, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const charScale = spring({
            frame: frame - i * 2,
            fps,
            config: { damping: 15, stiffness: 120 },
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: charReveal,
                transform: `scale(${charScale})`,
                filter: `blur(${interpolate(frame, [TEXT_APPEAR_FRAME + i * 2, TEXT_APPEAR_FRAME + i * 2 + 5], [2, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* Digital scan line */}
      <div
        style={{
          position: "absolute",
          top: `${scanProgress * 100}%`,
          left: 0,
          width: "100%",
          height: SCAN_LINE_HEIGHT,
          background: `linear-gradient(90deg, transparent, ${COLOR_NEON_BLUE}, ${COLOR_NEON_PURPLE}, transparent)`,
          opacity: 0.8,
          transform: `translateY(-${SCAN_LINE_HEIGHT / 2}px)`,
          boxShadow: `0 0 20px ${COLOR_NEON_BLUE}80`,
        }}
      />

      {/* Particle bursts */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}80`,
            opacity: interpolate(
              frame - p.delay,
              [0, 15],
              [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            ),
          }}
        />
      ))}

      {/* Hologram glow overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at 50% 50%, ${COLOR_HOLOGRAM_BG}, transparent 70%)`,
          opacity: 0.3 * glowPulse,
        }}
      />
    </AbsoluteFill>
  );
};