import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Circle, Rect, Triangle } from "@remotion/shapes";

export const CyberpunkTechIntro = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Constants
  const DURATION = 3.5 * fps;
  const GRID_SPACING = 60;
  const GRID_OFFSET = 30;
  const PARTICLE_COUNT = 120;
  const BINARY_SPEED = 0.8;
  const BINARY_HEIGHT = 24;
  const HUD_OPACITY = 0.85;

  // Timing interpolations
  const progress = interpolate(frame, [0, DURATION], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const gridPulse = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const particleConvergence = spring({ frame, fps, config: { damping: 12, stiffness: 90 } });

  // Grid line positions
  const gridLines = [];
  for (let x = GRID_OFFSET; x < width; x += GRID_SPACING) {
    gridLines.push({ type: "vertical", pos: x });
  }
  for (let y = GRID_OFFSET; y < height; y += GRID_SPACING) {
    gridLines.push({ type: "horizontal", pos: y });
  }

  // Particle positions
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
    const distance = 400 + Math.sin(i * 0.3 + frame * 0.05) * 100;
    const startX = width / 2 + Math.cos(angle) * distance;
    const startY = height / 2 + Math.sin(angle) * distance;
    const endX = width / 2;
    const endY = height / 2;

    const x = interpolate(
      frame,
      [0, DURATION],
      [startX, endX],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    const y = interpolate(
      frame,
      [0, DURATION],
      [startY, endY],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const size = interpolate(
      frame,
      [0, DURATION * 0.7, DURATION],
      [2, 4, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    particles.push({ x, y, size, id: i });
  }

  // Binary stream
  const binaryChars = "0101010101010101010101010101010101010101010101010101010101010101";
  const binaryStream = [];
  const binaryOffset = (frame * BINARY_SPEED) % (binaryChars.length * 12);
  
  for (let i = 0; i < 15; i++) {
    const y = (i * BINARY_HEIGHT) + (frame * BINARY_SPEED * 0.5) % BINARY_HEIGHT;
    const charIndex = Math.floor((binaryOffset + i * 12) / 12) % binaryChars.length;
    
    binaryStream.push({
      text: binaryChars[charIndex],
      x: 20 + ((binaryOffset + i * 12) % (width + 100)) - 50,
      y: y + 100,
      opacity: interpolate(frame, [0, 30, DURATION], [0, 0.7, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    });
  }

  // HUD elements
  const hudElements = [
    { x: width - 200, y: 50, text: "SYSTEM ONLINE", size: 16 },
    { x: 100, y: 50, text: "CYBERNETIC INTERFACE v3.7", size: 16 },
    { x: width / 2, y: height - 80, text: "NEURAL LINK ESTABLISHED", size: 18 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      {/* Holographic Grid Background */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity: fadeIn * 0.3,
      }}>
        {gridLines.map((line, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              backgroundColor: 'transparent',
              opacity: 0.4 + Math.sin(frame * 0.05 + i) * 0.2,
              boxShadow: `0 0 15px #8b5cf6${Math.round(50 + Math.sin(frame * 0.1 + i) * 30).toString(16)}`,
              ...(line.type === "vertical" 
                ? { 
                    left: line.pos, 
                    top: 0, 
                    width: 1, 
                    height: "100%" 
                  } 
                : { 
                    top: line.pos, 
                    left: 0, 
                    height: 1, 
                    width: "100%" 
                  }),
            }}
          />
        ))}
      </div>

      {/* Floating Particles */}
      {particles.map((particle, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: particle.x - particle.size / 2,
            top: particle.y - particle.size / 2,
            width: particle.size,
            height: particle.size,
            backgroundColor: 'transparent',
            borderRadius: "50%",
            boxShadow: `0 0 ${particle.size * 3}px #4f46e5, 0 0 ${particle.size * 6}px #8b5cf6`,
            opacity: interpolate(
              frame,
              [0, DURATION * 0.3, DURATION],
              [0.2, 0.8, 0.4],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            ),
            transform: `scale(${1 + Math.sin(frame * 0.2 + i) * 0.2})`,
          }}
        />
      ))}

      {/* Binary/Data Stream */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}>
        {binaryStream.map((char, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: char.x,
              top: char.y,
              fontSize: BINARY_HEIGHT * 0.8,
              fontFamily: "monospace",
              color: "#0ea5e9",
              textShadow: `0 0 10px #0ea5e9, 0 0 20px #0ea5e9`,
              opacity: char.opacity,
              letterSpacing: "2px",
              fontWeight: "bold",
            }}
          >
            {char.text}
          </div>
        ))}
      </div>

      {/* Central Glowing Core */}
      <div
        style={{
          position: "absolute",
          left: width / 2 - 60,
          top: height / 2 - 60,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "radial-gradient(circle, #8b5cf6 0%, #4f46e5 50%, transparent 70%)",
          boxShadow: `0 0 60px #8b5cf6, 0 0 120px #4f46e5, 0 0 180px #0ea5e9`,
          opacity: interpolate(frame, [0, DURATION * 0.5, DURATION], [0.3, 0.9, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />

      {/* HUD Elements */}
      {hudElements.map((el, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: el.x,
            top: el.y,
            fontSize: el.size,
            fontFamily: "Inter, sans-serif",
            color: "#0ea5e9",
            textShadow: `0 0 8px #0ea5e9, 0 0 16px #4f46e5`,
            opacity: HUD_OPACITY,
            transform: `translateX(${interpolate(frame, [0, DURATION], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
            letterSpacing: "1px",
            fontWeight: "bold",
          }}
        >
          {el.text}
        </div>
      ))}

      {/* Corner Status Indicators */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          fontSize: 14,
          fontFamily: "monospace",
          color: "#0ea5e9",
          textShadow: "0 0 5px #0ea5e9",
          opacity: HUD_OPACITY,
        }}
      >
        STATUS: <span style={{ color: "#4ade80" }}>ACTIVE</span>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          fontSize: 14,
          fontFamily: "monospace",
          color: "#0ea5e9",
          textShadow: "0 0 5px #0ea5e9",
          opacity: HUD_OPACITY,
        }}
      >
        SECURE CONNECTION • ENCRYPTION: AES-256
      </div>

      {/* Glowing Border Effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "2px solid transparent",
          backgroundImage: "linear-gradient(45deg, #0ea5e9, #4f46e5, #8b5cf6, #0ea5e9)",
          backgroundSize: "300% 300%",
          animation: "borderAnimation 8s ease-in-out infinite",
          opacity: 0.4,
        }}
      />
      
      {/* CSS Animation for border */}
      <style>{`
        @keyframes borderAnimation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </AbsoluteFill>
  );
};