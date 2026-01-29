import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Circle, Rect, Triangle } from "@remotion/shapes";

export const CyberpunkTechIntro = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Timing constants
  const SCAN_START_FRAME = 0;
  const SCAN_DURATION = 60; // 2 seconds at 30fps
  const TITLE_FADE_IN_FRAME = 75; // 2.5 seconds at 30fps
  const TITLE_FADE_DURATION = 30;

  // Color constants
  const COLOR_BACKGROUND = "#0a0a1a";
  const COLOR_NEON_BLUE = "#00c8ff";
  const COLOR_NEON_BLUE_DARK = "#004d66";
  const COLOR_GRID = "#0088aa";
  const COLOR_TITLE = "#00f0ff";

  // Layout constants
  const PADDING = 60;
  const GRID_SPACING = 40;
  const CIRCUIT_WIDTH = width - PADDING * 2;
  const CIRCUIT_HEIGHT = height - PADDING * 2;
  const SCAN_LINE_HEIGHT = 4;

  // Scan line position (top to bottom)
  const scanProgress = interpolate(
    frame,
    [SCAN_START_FRAME, SCAN_START_FRAME + SCAN_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const scanY = interpolate(
    frame,
    [SCAN_START_FRAME, SCAN_START_FRAME + SCAN_DURATION],
    [PADDING, height - PADDING],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Title fade in
  const titleOpacity = interpolate(
    frame,
    [TITLE_FADE_IN_FRAME, TITLE_FADE_IN_FRAME + TITLE_FADE_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Particle flow animation
  const particleOffset = (frame * 0.3) % 100;

  // Holographic grid lines
  const gridLines = [];
  for (let x = 0; x <= width; x += GRID_SPACING) {
    gridLines.push(
      <Rect
        key={`v-${x}`}
        x={x}
        y={0}
        width={2}
        height={height}
        fill={COLOR_GRID}
        opacity={0.3}
      />
    );
  }
  for (let y = 0; y <= height; y += GRID_SPACING) {
    gridLines.push(
      <Rect
        key={`h-${y}`}
        x={0}
        y={y}
        width={width}
        height={2}
        fill={COLOR_GRID}
        opacity={0.3}
      />
    );
  }

  // Circuit board traces (simplified geometric pattern)
  const circuitTraces = [];
  const traceCount = 12;
  for (let i = 0; i < traceCount; i++) {
    const angle = (i / traceCount) * Math.PI * 2;
    const radius = Math.min(width, height) * 0.3;
    const x1 = width / 2 + Math.cos(angle) * radius * 0.7;
    const y1 = height / 2 + Math.sin(angle) * radius * 0.7;
    const x2 = width / 2 + Math.cos(angle + 0.3) * radius;
    const y2 = height / 2 + Math.sin(angle + 0.3) * radius;
    
    const traceOpacity = interpolate(
      frame,
      [SCAN_START_FRAME + i * 3, SCAN_START_FRAME + i * 3 + 20],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    
    circuitTraces.push(
      <Rect
        key={`trace-${i}`}
        x={Math.min(x1, x2)}
        y={Math.min(y1, y2)}
        width={Math.abs(x2 - x1) + 2}
        height={Math.abs(y2 - y1) + 2}
        fill={COLOR_NEON_BLUE}
        opacity={traceOpacity * 0.7}
      />
    );
  }

  // Particles
  const particles = [];
  const particleCount = 40;
  for (let i = 0; i < particleCount; i++) {
    const size = 2 + Math.sin(frame * 0.05 + i) * 1.5;
    const x = (i * 37) % width + particleOffset;
    const y = (i * 23) % height + (frame * 0.5) % height;
    
    const particleOpacity = 0.2 + Math.sin(frame * 0.1 + i) * 0.1;
    
    particles.push(
      <Circle
        key={`particle-${i}`}
        cx={x}
        cy={y}
        r={size}
        fill={COLOR_NEON_BLUE}
        opacity={particleOpacity}
      />
    );
  }

  // Glowing effect for scan line
  const scanGlow = (
    <Rect
      x={PADDING}
      y={scanY - SCAN_LINE_HEIGHT / 2}
      width={CIRCUIT_WIDTH}
      height={SCAN_LINE_HEIGHT}
      fill={COLOR_NEON_BLUE}
      opacity={0.8}
      style={{
        filter: "blur(8px)",
      }}
    />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BACKGROUND }}>
      {/* Background grid */}
      {gridLines}

      {/* Circuit board base */}
      <Rect
        x={PADDING}
        y={PADDING}
        width={CIRCUIT_WIDTH}
        height={CIRCUIT_HEIGHT}
        fill={COLOR_NEON_BLUE_DARK}
        opacity={0.2}
      />

      {/* Circuit traces */}
      {circuitTraces}

      {/* Scan line glow */}
      {scanGlow}

      {/* Scan line */}
      <Rect
        x={PADDING}
        y={scanY - SCAN_LINE_HEIGHT / 2}
        width={CIRCUIT_WIDTH}
        height={SCAN_LINE_HEIGHT}
        fill={COLOR_NEON_BLUE}
      />

      {/* Particles */}
      {particles}

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: "Inter, sans-serif",
          fontSize: Math.max(80, width * 0.12),
          fontWeight: 800,
          color: COLOR_TITLE,
          textShadow: `0 0 20px ${COLOR_NEON_BLUE}, 0 0 40px ${COLOR_NEON_BLUE}`,
          opacity: titleOpacity,
          letterSpacing: "4px",
          textAlign: "center",
        }}
      >
        FUTURE
      </div>

      {/* Subtle corner highlights for cinematic lighting */}
      <Rect
        x={0}
        y={0}
        width={width * 0.3}
        height={height * 0.3}
        fill={COLOR_NEON_BLUE}
        opacity={0.03}
      />
      <Rect
        x={width * 0.7}
        y={height * 0.7}
        width={width * 0.3}
        height={height * 0.3}
        fill={COLOR_NEON_BLUE}
        opacity={0.03}
      />
    </AbsoluteFill>
  );
};