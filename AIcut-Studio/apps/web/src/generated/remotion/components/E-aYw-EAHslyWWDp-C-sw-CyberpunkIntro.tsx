import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const CyberpunkIntro = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Timing constants
  const DURATION = 105; // 3.5 seconds at 30fps
  const EXPAND_DURATION = 60;
  const GLOW_PULSE_DURATION = 45;

  // Color constants
  const COLOR_NEON_BLUE = "#00f3ff";
  const COLOR_NEON_PURPLE = "#b967ff";
  const COLOR_DARK_BG = "#0a0a1a";

  // Layout constants
  const GRID_SPACING = 40;
  const LINE_WIDTH = 2;
  const GLOW_INTENSITY = 15;
  const MAX_RADIUS = Math.max(width, height) * 0.8;

  // Animation progress
  const expandProgress = spring({
    frame: frame,
    fps,
    config: { damping: 18, stiffness: 120 },
  });

  const pulseProgress = interpolate(
    frame % GLOW_PULSE_DURATION,
    [0, GLOW_PULSE_DURATION / 2, GLOW_PULSE_DURATION],
    [0.7, 1.0, 0.7],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const glowIntensity = GLOW_INTENSITY * pulseProgress;
  const currentRadius = MAX_RADIUS * Math.min(expandProgress, 1);

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_DARK_BG }}>
      {/* Grid lines */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: currentRadius * 2,
          height: currentRadius * 2,
        }}
      >
        {/* Horizontal grid lines */}
        {Array.from({ length: Math.ceil((currentRadius * 2) / GRID_SPACING) }).map((_, i) => {
          const y = (i - Math.floor(currentRadius / GRID_SPACING)) * GRID_SPACING;
          const opacity = interpolate(
            Math.abs(y),
            [0, currentRadius * 0.3, currentRadius],
            [1, 0.7, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          
          return (
            <div
              key={`h-${i}`}
              style={{
                position: "absolute",
                top: `${y + currentRadius}px`,
                left: 0,
                width: "100%",
                height: LINE_WIDTH,
                background: `linear-gradient(90deg, ${COLOR_NEON_BLUE}, ${COLOR_NEON_PURPLE})`,
                opacity,
                boxShadow: `0 0 ${glowIntensity}px ${COLOR_NEON_BLUE}, 0 0 ${glowIntensity * 0.7}px ${COLOR_NEON_PURPLE}`,
              }}
            />
          );
        })}
        
        {/* Vertical grid lines */}
        {Array.from({ length: Math.ceil((currentRadius * 2) / GRID_SPACING) }).map((_, i) => {
          const x = (i - Math.floor(currentRadius / GRID_SPACING)) * GRID_SPACING;
          const opacity = interpolate(
            Math.abs(x),
            [0, currentRadius * 0.3, currentRadius],
            [1, 0.7, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          
          return (
            <div
              key={`v-${i}`}
              style={{
                position: "absolute",
                left: `${x + currentRadius}px`,
                top: 0,
                width: LINE_WIDTH,
                height: "100%",
                background: `linear-gradient(${COLOR_NEON_PURPLE}, ${COLOR_NEON_BLUE})`,
                opacity,
                boxShadow: `0 0 ${glowIntensity}px ${COLOR_NEON_PURPLE}, 0 0 ${glowIntensity * 0.7}px ${COLOR_NEON_BLUE}`,
              }}
            />
          );
        })}
      </div>

      {/* Center circuit node */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLOR_NEON_BLUE} 0%, ${COLOR_NEON_PURPLE} 100%)`,
          boxShadow: `0 0 ${glowIntensity * 2}px ${COLOR_NEON_BLUE}, 0 0 ${glowIntensity * 3}px ${COLOR_NEON_PURPLE}`,
          zIndex: 10,
        }}
      />

      {/* Circuit connection lines from center */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const endX = Math.cos(rad) * currentRadius * 0.7;
        const endY = Math.sin(rad) * currentRadius * 0.7;
        const lineLength = Math.sqrt(endX * endX + endY * endY);
        
        const opacity = interpolate(
          lineLength,
          [0, currentRadius * 0.3, currentRadius * 0.7],
          [1, 0.8, 0.3],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={`circuit-${i}`}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              width: lineLength,
              height: LINE_WIDTH,
              background: `linear-gradient(90deg, ${COLOR_NEON_BLUE}, ${COLOR_NEON_PURPLE})`,
              opacity,
              boxShadow: `0 0 ${glowIntensity * 0.5}px ${COLOR_NEON_BLUE}, 0 0 ${glowIntensity * 0.3}px ${COLOR_NEON_PURPLE}`,
              transformOrigin: "left center",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};