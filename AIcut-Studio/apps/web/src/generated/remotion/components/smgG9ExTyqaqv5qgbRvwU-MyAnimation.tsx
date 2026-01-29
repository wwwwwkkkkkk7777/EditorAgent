import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Constants
  const BACKGROUND_GRADIENT = "linear-gradient(135deg, #0a192f 0%, #112240 100%)";
  const TEXT_COLOR = "#ffffff";
  const LINE_COLOR = "#6366f1";
  const TEXT_CONTENT = "AIcut";
  const TEXT_SIZE = 80;
  const PARTICLE_COUNT = 120;
  const CONVERGENCE_DURATION = 60; // 2 seconds at 30fps
  const LINE_APPEAR_DURATION = 30; // 1 second
  const TOTAL_DURATION = 90; // 3 seconds at 30fps

  // Text entrance animation (ease-in-out)
  const textScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // Particle convergence
  const particleProgress = interpolate(
    frame,
    [0, CONVERGENCE_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Line appearance
  const lineOpacity = interpolate(
    frame,
    [CONVERGENCE_DURATION - 15, CONVERGENCE_DURATION + LINE_APPEAR_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Generate particles with cinematic positioning
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
    const distance = 400 + Math.sin(i * 0.3) * 100;
    const startX = Math.cos(angle) * distance + 960;
    const startY = Math.sin(angle) * distance + 540;
    const size = 2 + Math.sin(i * 0.7) * 1.5;
    
    return {
      id: i,
      x: interpolate(particleProgress, [0, 1], [startX, 960]),
      y: interpolate(particleProgress, [0, 1], [startY, 540]),
      size: interpolate(particleProgress, [0, 1], [size, size * 0.7]),
      opacity: interpolate(particleProgress, [0, 0.3, 1], [0.6, 0.8, 0.3]),
      blur: interpolate(particleProgress, [0, 1], [10, 2]),
    };
  });

  return (
    <AbsoluteFill style={{
      backgroundColor: "transparent",
      overflow: "hidden",
      background: BACKGROUND_GRADIENT,
    }}>
      {/* Glowing particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: 'transparent',
            borderRadius: "50%",
            opacity: p.opacity,
            boxShadow: `0 0 ${p.blur}px #6366f1, 0 0 ${p.blur * 2}px #4f46e5`,
            transform: `scale(${textScale})`,
          }}
        />
      ))}

      {/* Main text */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${textScale})`,
          fontFamily: "Inter, sans-serif",
          fontSize: TEXT_SIZE,
          fontWeight: 700,
          color: TEXT_COLOR,
          letterSpacing: "2px",
          textShadow: "0 0 20px rgba(100, 102, 241, 0.7), 0 0 40px rgba(100, 102, 241, 0.4)",
          whiteSpace: "nowrap",
        }}
      >
        {TEXT_CONTENT}
      </div>

      {/* Subtle horizontal line */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, 50%)",
          width: "200px",
          height: "2px",
          backgroundColor: LINE_COLOR,
          opacity: lineOpacity,
          boxShadow: `0 0 10px ${LINE_COLOR}80`,
        }}
      />

      {/* Cinematic vignette effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle at center, transparent 40%, rgba(10, 25, 47, 0.3) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};