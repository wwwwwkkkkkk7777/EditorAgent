import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring } from "remotion";
import { useState, useEffect } from "react";

export const AbstractGradientBackground = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Constants
  const GRADIENT_COLOR_1 = "#1a1a2e";
  const GRADIENT_COLOR_2 = "#16213e";
  const GRADIENT_COLOR_3 = "#0f3460";
  const PARTICLE_COUNT = 48;
  const PARTICLE_MIN_SIZE = 2;
  const PARTICLE_MAX_SIZE = 12;
  const ANIMATION_DURATION = 240; // ~4 seconds at 60fps
  const FLOAT_SPEED = 0.3;

  // Generate particles with fixed positions and properties
  const [particles] = useState(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: PARTICLE_MIN_SIZE + Math.random() * (PARTICLE_MAX_SIZE - PARTICLE_MIN_SIZE),
      hue: 200 + Math.random() * 60,
      opacityBase: 0.2 + Math.random() * 0.5,
      speedX: (Math.random() - 0.5) * FLOAT_SPEED,
      speedY: (Math.random() - 0.5) * FLOAT_SPEED,
      rotationSpeed: (Math.random() - 0.5) * 0.5,
      delay: Math.random() * ANIMATION_DURATION,
    }));
  });

  // Animated gradient background
  const gradientOffset = interpolate(
    frame,
    [0, ANIMATION_DURATION],
    [0, 100],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Particle animation
  const particlesJSX = particles.map((p) => {
    const timeOffset = (frame + p.delay) % ANIMATION_DURATION;
    const progress = timeOffset / ANIMATION_DURATION;

    // Smooth floating motion using sine waves
    const floatX = Math.sin(progress * Math.PI * 4 + p.id * 0.7) * 80;
    const floatY = Math.cos(progress * Math.PI * 3 + p.id * 0.5) * 60;
    const floatZ = Math.sin(progress * Math.PI * 5 + p.id * 0.3) * 40;

    // Gentle pulsing opacity
    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.05 + p.id);

    // Rotation
    const rotation = (frame * p.rotationSpeed + p.id * 10) % 360;

    // Size variation
    const size = p.size * (0.8 + 0.4 * Math.sin(frame * 0.03 + p.id));

    return (
      <div
        key={p.id}
        style={{
          position: "absolute",
          left: p.x + floatX,
          top: p.y + floatY,
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: 'transparent',
          boxShadow: `0 0 ${size * 2}px hsla(${p.hue}, 80%, 70%, ${p.opacityBase * pulse * 0.8})`,
          transform: `rotate(${rotation}deg) translateZ(${floatZ}px)`,
          filter: "blur(1px)",
        }}
      />
    );
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      {/* Gradient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at ${50 + Math.sin(frame * 0.02) * 10}% ${50 + Math.cos(frame * 0.015) * 15}%, ${GRADIENT_COLOR_1}, ${GRADIENT_COLOR_2}, ${GRADIENT_COLOR_3})`,
          transform: `translateX(${gradientOffset}px) translateY(${gradientOffset * 0.5}px)`,
        }}
      />

      {/* Floating particles */}
      {particlesJSX}

      {/* Subtle light overlay for cinematic effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at ${30 + Math.sin(frame * 0.01) * 5}% ${70 + Math.cos(frame * 0.012) * 8}%, rgba(255,255,255,0.03), transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};