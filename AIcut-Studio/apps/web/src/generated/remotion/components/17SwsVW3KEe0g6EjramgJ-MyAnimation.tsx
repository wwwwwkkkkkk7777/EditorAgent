import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";
import { Circle } from "@remotion/shapes";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Constants
  const BACKGROUND_COLOR = "#0a0a1a";
  const GOLD_COLOR = "#FFD700";
  const WHITE_COLOR = "#FFFFFF";
  const TEXT_CONTENT = "震撼启程";
  const FONT_SIZE = Math.max(80, Math.round(width * 0.12));
  const PARTICLE_COUNT = 120;
  const ZOOM_DURATION = 90;
  const TEXT_APPEAR_FRAME = 45;
  const GLOW_INTENSITY = 12;
  const PARTICLE_RADIUS = 2;

  // Zoom animation
  const zoomProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const scale = 1 + (zoomProgress * 0.3);

  // Text opacity and glow
  const textOpacity = interpolate(
    frame,
    [TEXT_APPEAR_FRAME - 15, TEXT_APPEAR_FRAME],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const glowSize = interpolate(
    frame,
    [TEXT_APPEAR_FRAME - 20, TEXT_APPEAR_FRAME + 10],
    [0, GLOW_INTENSITY],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Particle burst animation
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
    const distance = interpolate(
      frame,
      [0, 60],
      [0, 300],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    // Stagger particle timing
    const delay = (i % 12) * 2;
    const particleProgress = spring({
      frame: frame - delay,
      fps,
      config: { damping: 18, stiffness: 120 },
    });

    return {
      x: x * particleProgress,
      y: y * particleProgress,
      size: PARTICLE_RADIUS * (0.5 + particleProgress * 0.5),
      opacity: interpolate(
        frame - delay,
        [0, 15, 30],
        [1, 0.8, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      ),
      color: i % 3 === 0 ? GOLD_COLOR : WHITE_COLOR,
    };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BACKGROUND_COLOR }}>
      {/* Particle burst */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}>
        {particles.map((p, i) => (
          <Circle
            key={i}
            radius={p.size}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              backgroundColor: p.color,
              opacity: p.opacity,
              filter: `blur(${Math.max(0.5, p.size * 0.3)}px)`,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}80`,
            }}
          />
        ))}
      </div>

      {/* Glowing text */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          textAlign: "center",
          fontFamily: "Noto Serif SC, Noto Sans CJK SC, serif",
          fontSize: FONT_SIZE,
          fontWeight: "bold",
          color: WHITE_COLOR,
          textShadow: `
            0 0 ${glowSize * 0.8}px ${GOLD_COLOR},
            0 0 ${glowSize * 1.2}px ${GOLD_COLOR},
            0 0 ${glowSize * 2}px ${GOLD_COLOR}80,
            0 0 ${glowSize * 3}px ${GOLD_COLOR}60,
            0 0 ${glowSize * 4}px ${GOLD_COLOR}40
          `,
          opacity: textOpacity,
          letterSpacing: "4px",
          filter: "blur(0.3px)",
        }}
      >
        {TEXT_CONTENT}
      </div>

      {/* Film grain overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.03) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.02) 0%, transparent 50%)",
          pointerEvents: "none",
          opacity: 0.4,
        }}
      />
    </AbsoluteFill>
  );
};