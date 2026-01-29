import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const CyberpunkGrid = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Color palette
  const COLOR_NEON_BLUE = "#00f3ff";
  const COLOR_NEON_PURPLE = "#b967ff";
  const COLOR_NEON_PINK = "#ff00c8";
  const COLOR_GRID_LINE = "#0a1929";
  const COLOR_HOLOGRAM_BG = "rgba(0, 243, 255, 0.1)";
  const COLOR_TEXT = "#ffffff";

  // Timing constants
  const PULSE_DURATION = 60;
  const STREAM_SPEED = 0.5;
  const GRID_SIZE = 40;

  // Pulse animation for neon elements
  const pulseProgress = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  const pulseIntensity = interpolate(
    frame % PULSE_DURATION,
    [0, PULSE_DURATION / 2, PULSE_DURATION],
    [0.3, 1.0, 0.3],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Grid line opacity animation
  const gridOpacity = interpolate(
    frame,
    [0, 30, 60],
    [0.15, 0.3, 0.15],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Data stream position
  const streamOffset = (frame * STREAM_SPEED) % 1000;

  // Hologram element positions and sizes
  const hologramElements = [
    { id: 1, x: 20, y: 20, size: 120, delay: 0 },
    { id: 2, x: 80, y: 15, size: 80, delay: 15 },
    { id: 3, x: 45, y: 75, size: 100, delay: 30 },
    { id: 4, x: 15, y: 60, size: 60, delay: 45 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      {/* Digital Grid Background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `
            linear-gradient(${COLOR_GRID_LINE} ${GRID_SIZE}px, transparent ${GRID_SIZE}px),
            linear-gradient(90deg, ${COLOR_GRID_LINE} ${GRID_SIZE}px, transparent ${GRID_SIZE}px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          opacity: gridOpacity,
          filter: "blur(0.5px)",
        }}
      />

      {/* Flowing Data Stream Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${(i * 15 + streamOffset) % 100}%`,
              left: `${(i * 7) % 100}%`,
              fontSize: "12px",
              fontFamily: "monospace",
              color: COLOR_NEON_BLUE,
              opacity: interpolate(
                frame % 120,
                [i * 8, i * 8 + 40, i * 8 + 80],
                [0.2, 0.8, 0.2],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              ),
              textShadow: `0 0 8px ${COLOR_NEON_BLUE}, 0 0 16px ${COLOR_NEON_BLUE}`,
              transform: `translateY(${Math.sin(frame * 0.05 + i) * 20}px)`,
              whiteSpace: "nowrap",
              letterSpacing: "2px",
            }}
          >
            {`0x${Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, "0")} `}
            {`0x${Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, "0")} `}
            {`0x${Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, "0")} `}
            {`0x${Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, "0")} `}
          </div>
        ))}
      </div>

      {/* Holographic UI Elements */}
      {hologramElements.map((element) => {
        const elementProgress = spring({
          frame: frame - element.delay,
          fps,
          config: { damping: 12, stiffness: 110 },
        });

        return (
          <div
            key={element.id}
            style={{
              position: "absolute",
              top: `${element.y}%`,
              left: `${element.x}%`,
              width: `${element.size}px`,
              height: `${element.size}px`,
              borderRadius: "8px",
              backgroundColor: COLOR_HOLOGRAM_BG,
              border: `1px solid ${COLOR_NEON_BLUE}`,
              boxShadow: `
                0 0 15px ${COLOR_NEON_BLUE},
                0 0 30px ${COLOR_NEON_BLUE}80,
                inset 0 0 20px ${COLOR_NEON_BLUE}30
              `,
              transform: `scale(${0.8 + elementProgress * 0.4}) rotate(${(frame * 0.3 + element.id * 45) % 360}deg)`,
              opacity: pulseIntensity * 0.7,
              backdropFilter: "blur(2px)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "60%",
                height: "60%",
                borderRadius: "4px",
                backgroundColor: 'transparent',
                border: "1px solid rgba(0, 243, 255, 0.3)",
              }}
            />
          </div>
        );
      })}

      {/* Central Holographic Display */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "320px",
          height: "240px",
          borderRadius: "12px",
          backgroundColor: 'transparent',
          border: `2px solid ${COLOR_NEON_BLUE}`,
          boxShadow: `
            0 0 25px ${COLOR_NEON_BLUE},
            0 0 50px ${COLOR_NEON_BLUE}80,
            inset 0 0 30px ${COLOR_NEON_BLUE}20
          `,
          backdropFilter: "blur(4px)",
          opacity: pulseIntensity,
        }}
      >
        {/* Hologram grid pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `
              linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />
        
        {/* Status indicators */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            display: "flex",
            gap: "8px",
          }}
        >
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: i === 0 ? COLOR_NEON_GREEN : i === 1 ? COLOR_NEON_BLUE : COLOR_NEON_PURPLE,
                boxShadow: `0 0 8px ${i === 0 ? COLOR_NEON_GREEN : i === 1 ? COLOR_NEON_BLUE : COLOR_NEON_PURPLE}`,
                opacity: interpolate(
                  frame % 60,
                  [i * 15, i * 15 + 20, i * 15 + 40],
                  [0.3, 1.0, 0.3],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                ),
              }}
            />
          ))}
        </div>

        {/* Central data display */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            color: COLOR_NEON_BLUE,
            fontSize: "14px",
            fontFamily: "monospace",
            textShadow: `0 0 6px ${COLOR_NEON_BLUE}`,
            letterSpacing: "1px",
          }}
        >
          <div style={{ marginBottom: "4px" }}>CYBER-GRID</div>
          <div style={{ fontSize: "18px", fontWeight: "bold" }}>
            {Math.floor(frame / 30) % 1000}
          </div>
          <div style={{ fontSize: "10px", opacity: 0.7 }}>SECURE NODE</div>
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${Math.sin(frame * 0.02 + i) * 40 + 50}%`,
            left: `${Math.cos(frame * 0.03 + i * 0.5) * 40 + 50}%`,
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            backgroundColor: i % 3 === 0 ? COLOR_NEON_BLUE : i % 3 === 1 ? COLOR_NEON_PURPLE : COLOR_NEON_PINK,
            boxShadow: `0 0 6px ${i % 3 === 0 ? COLOR_NEON_BLUE : i % 3 === 1 ? COLOR_NEON_PURPLE : COLOR_NEON_PINK}`,
            opacity: interpolate(
              frame % 100,
              [i * 5, i * 5 + 25, i * 5 + 50],
              [0.2, 0.8, 0.2],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            ),
            transform: `scale(${0.5 + Math.sin(frame * 0.05 + i) * 0.3})`,
          }}
        />
      ))}

      {/* Cinematic lighting overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle at 30% 30%, rgba(0, 243, 255, 0.05) 0%, transparent 70%), radial-gradient(circle at 70% 70%, rgba(185, 103, 255, 0.03) 0%, transparent 70%)",
        }}
      />
    </AbsoluteFill>
  );
};