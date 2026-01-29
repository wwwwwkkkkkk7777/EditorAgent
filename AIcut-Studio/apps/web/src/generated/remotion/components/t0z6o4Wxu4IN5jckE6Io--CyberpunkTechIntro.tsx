import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Circle, Rect } from "@remotion/shapes";

export const CyberpunkTechIntro = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Timing constants
  const DURATION = 3.5 * fps;
  const ZOOM_DURATION = DURATION;
  const SCAN_DURATION = DURATION * 0.7;
  const PARTICLE_DURATION = DURATION;

  // Color palette
  const COLOR_GRID_LINE = "#00ffff";
  const COLOR_GRID_LINE_ALT = "#ff00ff";
  const COLOR_PARTICLE = "#00ffff";
  const COLOR_PARTICLE_ALT = "#ff00ff";
  const COLOR_SCAN_LINE = "#00ffff";

  // Layout constants
  const GRID_SPACING = 40;
  const GRID_OFFSET = 20;
  const SCAN_LINE_HEIGHT = 4;
  const PARTICLE_COUNT = 80;
  const MIN_PARTICLE_SIZE = 2;
  const MAX_PARTICLE_SIZE = 6;

  // Zoom animation (smooth zoom-in)
  const zoomProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const scale = interpolate(zoomProgress, [0, 1], [1.0, 1.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Scan line position (top to bottom)
  const scanY = interpolate(frame, [0, SCAN_DURATION], [0, height], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Particle animation
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const seed = i * 17.3; // Prime for visual variety
    const x = (seed * 13.7) % width;
    const y = (seed * 23.9) % height;
    const size = MIN_PARTICLE_SIZE + ((seed * 7.1) % (MAX_PARTICLE_SIZE - MIN_PARTICLE_SIZE));
    const opacityBase = 0.3 + (seed * 0.1) % 0.4;
    
    // Floating motion with different frequencies
    const floatX = Math.sin(frame * 0.05 + seed * 0.3) * 20;
    const floatY = Math.cos(frame * 0.03 + seed * 0.7) * 15;
    
    // Pulsing opacity
    const pulse = Math.sin(frame * 0.1 + seed) * 0.5 + 0.5;
    const opacity = opacityBase * pulse * 0.7;
    
    // Color alternation
    const color = i % 3 === 0 ? COLOR_PARTICLE : COLOR_PARTICLE_ALT;
    
    return { x: x + floatX, y: y + floatY, size, opacity, color, id: i };
  });

  return (
    <AbsoluteFill style={{
      backgroundColor: 'transparent',
      overflow: "hidden",
      transform: `scale(${scale})`,
      transformOrigin: "center",
    }}>
      {/* Grid background */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: `
          linear-gradient(0deg, ${COLOR_GRID_LINE} 1px, transparent 1px),
          linear-gradient(90deg, ${COLOR_GRID_LINE} 1px, transparent 1px),
          linear-gradient(0deg, ${COLOR_GRID_LINE_ALT} 1px, transparent 1px),
          linear-gradient(90deg, ${COLOR_GRID_LINE_ALT} 1px, transparent 1px)
        `,
        backgroundSize: `${GRID_SPACING}px ${GRID_SPACING}px, ${GRID_SPACING}px ${GRID_SPACING}px, ${GRID_SPACING * 2}px ${GRID_SPACING * 2}px, ${GRID_SPACING * 2}px ${GRID_SPACING * 2}px`,
        backgroundPosition: `0 0, 0 0, ${GRID_OFFSET}px ${GRID_OFFSET}px, ${GRID_OFFSET}px ${GRID_OFFSET}px`,
        opacity: 0.15,
      }} />

      {/* Floating digital particles */}
      {particles.map((particle) => (
        <Circle
          key={particle.id}
          radius={particle.size / 2}
          center={[particle.x, particle.y]}
          fill={particle.color}
          style={{
            opacity: particle.opacity,
            filter: `blur(${particle.size * 0.3}px)`,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}80`,
          }}
        />
      ))}

      {/* Holographic scanning line */}
      <Rect
        x={0}
        y={scanY}
        width={width}
        height={SCAN_LINE_HEIGHT}
        fill={COLOR_SCAN_LINE}
        style={{
          opacity: 0.8,
          filter: `blur(2px)`,
          boxShadow: `0 0 15px ${COLOR_SCAN_LINE}aa`,
        }}
      />

      {/* Subtle light glow effect */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: width * 2,
          height: height * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(0,255,255,0.05) 0%, rgba(0,0,0,0) 70%)`,
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};