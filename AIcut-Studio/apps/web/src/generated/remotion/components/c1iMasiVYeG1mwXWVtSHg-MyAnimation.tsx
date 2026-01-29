import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durationInFrames = 4.5 * fps;

  // Constants
  const BACKGROUND_GRADIENT = "linear-gradient(135deg, #0a192f, #112240, #1a3a6c)";
  const TEXT_COLOR = "#ffffff";
  const TEXT_CONTENT = "欢迎来到我的视频";
  const FONT_SIZE_BASE = 80;
  const PADDING = 80;
  const FADE_IN_START_FRAME = 0;
  const FADE_IN_DURATION_FRAMES = 60;
  const SCALE_UP_DURATION_FRAMES = 45;

  // Fade in interpolation
  const fadeProgress = interpolate(
    frame,
    [FADE_IN_START_FRAME, FADE_IN_START_FRAME + FADE_IN_DURATION_FRAMES],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Scale up spring animation
  const scaleProgress = spring({
    frame: Math.max(0, frame - (FADE_IN_START_FRAME + 15)),
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // Calculate responsive font size
  const width = 1920;
  const height = 1080;
  const fontSize = Math.max(64, Math.round(width * 0.042));

  // Particle glow effect (simulated with multiple semi-transparent elements)
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 40 + 10,
    opacity: Math.random() * 0.3 + 0.05,
    left: Math.random() * width,
    top: Math.random() * height,
    delay: i * 2,
  }));

  return (
    <AbsoluteFill style={{
      backgroundColor: "transparent",
      overflow: "hidden",
      backgroundImage: BACKGROUND_GRADIENT,
      backgroundSize: "200% 200%",
      animation: "gradientShift 15s ease infinite",
    }}>
      {/* Particle glow effect */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: "absolute",
            width: particle.size,
            height: particle.size,
            borderRadius: "50%",
            backgroundColor: TEXT_COLOR,
            opacity: particle.opacity * fadeProgress,
            left: particle.left,
            top: particle.top,
            boxShadow: `0 0 ${particle.size}px ${TEXT_COLOR}80`,
            transform: `scale(${interpolate(
              frame - particle.delay,
              [0, 30],
              [0.8, 1.2],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )})`,
            animation: `pulse ${8 + particle.id * 0.5}s ease-in-out infinite`,
          }}
        />
      ))}

      {/* Main text */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${Math.min(1, scaleProgress * 1.2)})`,
          opacity: fadeProgress,
          fontFamily: "Inter, sans-serif",
          fontSize: fontSize,
          fontWeight: 300,
          color: TEXT_COLOR,
          textAlign: "center",
          letterSpacing: "2px",
          textShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
          padding: `${PADDING}px`,
          maxWidth: width - PADDING * 2,
        }}
      >
        {TEXT_CONTENT}
      </div>

      {/* CSS for gradient animation and pulse effect */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(0.95); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
      `}</style>
    </AbsoluteFill>
  );
};