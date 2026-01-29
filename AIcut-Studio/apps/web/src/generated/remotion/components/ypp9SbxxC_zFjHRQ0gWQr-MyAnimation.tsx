import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Constants
  const TITLE_TEXT = "欢迎来到直播间";
  const FONT_SIZE = 72;
  const CENTER_X = 960;
  const CENTER_Y = 520;
  const DURATION_FRAMES = Math.round(2.5 * fps);
  const COLOR_TEXT = "#ffffff";
  const COLOR_GLOW = "#ffffff";

  // Spring scale animation: 0 → 1.1 → 1.0 with bounce
  const scale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 1 },
  });

  // Fade in opacity: 0 → 1
  const opacity = interpolate(
    frame,
    [0, Math.round(DURATION_FRAMES * 0.3), DURATION_FRAMES],
    [0, 1, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Glow intensity (subtle pulse)
  const glowIntensity = interpolate(
    frame,
    [0, DURATION_FRAMES],
    [0.3, 0.8],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Slight vertical bounce at end for organic feel
  const bounceOffset = interpolate(
    frame,
    [Math.round(DURATION_FRAMES * 0.8), DURATION_FRAMES],
    [0, -4],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <div
        style={{
          position: "absolute",
          left: CENTER_X,
          top: CENTER_Y + bounceOffset,
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity: opacity,
          fontFamily: "Inter, sans-serif",
          fontSize: FONT_SIZE,
          fontWeight: 700,
          color: COLOR_TEXT,
          textShadow: `
            0 0 10px ${COLOR_GLOW}${Math.round(glowIntensity * 255).toString(16).padStart(2, '0')},
            0 0 20px ${COLOR_GLOW}${Math.round(glowIntensity * 180).toString(16).padStart(2, '0')},
            0 0 30px ${COLOR_GLOW}${Math.round(glowIntensity * 120).toString(16).padStart(2, '0')},
            0 0 40px ${COLOR_GLOW}${Math.round(glowIntensity * 80).toString(16).padStart(2, '0')}
          `,
          textAlign: "center",
          letterSpacing: "2px",
        }}
      >
        {TITLE_TEXT}
      </div>
    </AbsoluteFill>
  );
};