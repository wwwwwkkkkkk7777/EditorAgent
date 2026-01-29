import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Circle, Rect, Triangle, Star, Ellipse, Pie } from "@remotion/shapes";

export const CyberpunkAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Timing constants
  const TOTAL_DURATION = 120;
  const ZOOM_DURATION = 60;
  const BURST_START = 40;
  const BURST_DURATION = 30;

  // Layout constants
  const PADDING = 120;
  const GRID_SPACING = 80;
  const LINE_WIDTH = 2;
  const CIRCUIT_RADIUS = 200;
  const HOLOGRAM_OPACITY = 0.7;
  const PARTICLE_COUNT = 120;

  // Zoom effect
  const zoomProgress = interpolate(
    frame,
    [0, ZOOM_DURATION],
    [1, 1.8],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Circuit line animation
  const circuitPhase = (frame * 0.05) % (Math.PI * 2);
  const circuitPulse = 0.5 + 0.5 * Math.sin(frame * 0.1);

  // Digital rain effect
  const rainOpacity = interpolate(
    frame,
    [0, 20, 40, TOTAL_DURATION],
    [0.1, 0.3, 0.4, 0.2],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Particle burst animation
  const burstProgress = interpolate(
    frame,
    [BURST_START, BURST_START + BURST_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Holographic UI elements
  const hologramScale = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Generate circuit points
  const generateCircuitPoints = () => {
    const points = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Main circular circuit
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + circuitPhase;
      const radius = CIRCUIT_RADIUS * (0.8 + 0.2 * Math.sin(frame * 0.03 + i));
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      points.push({ x, y });
    }
    
    return points;
  };

  const circuitPoints = generateCircuitPoints();

  // Generate digital rain drops
  const generateRainDrops = () => {
    const drops = [];
    for (let i = 0; i < 40; i++) {
      const offset = (frame * 0.3 + i * 15) % height;
      const x = (i * GRID_SPACING) % width;
      const length = 20 + Math.sin(frame * 0.05 + i) * 10;
      drops.push({ x, y: offset, length, opacity: rainOpacity * (0.5 + Math.sin(i) * 0.3) });
    }
    return drops;
  };

  const rainDrops = generateRainDrops();

  // Generate particles for burst effect
  const generateParticles = () => {
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const distance = 100 + Math.sin(frame * 0.02 + i) * 50;
      const x = width / 2 + Math.cos(angle) * distance * burstProgress;
      const y = height / 2 + Math.sin(angle) * distance * burstProgress;
      const size = 2 + Math.sin(frame * 0.1 + i) * 1.5;
      const opacity = burstProgress * (0.3 + Math.sin(frame * 0.05 + i) * 0.2);
      particles.push({ x, y, size, opacity });
    }
    return particles;
  };

  const particles = generateParticles();

  return (
    <AbsoluteFill style={{ 
      backgroundColor: 'transparent',
      overflow: "hidden",
      transform: `scale(${zoomProgress})`,
      transformOrigin: "center center"
    }}>
      {/* Digital Rain */}
      {rainDrops.map((drop, i) => (
        <div
          key={`rain-${i}`}
          style={{
            position: "absolute",
            left: drop.x,
            top: drop.y,
            width: LINE_WIDTH,
            height: drop.length,
            backgroundColor: 'transparent',
            borderRadius: "2px",
            boxShadow: `0 0 10px rgba(0, 255, 200, ${drop.opacity * 0.8})`,
          }}
        />
      ))}

      {/* Circuit Lines */}
      {circuitPoints.map((point, i) => {
        const nextPoint = circuitPoints[(i + 1) % circuitPoints.length];
        const colorIntensity = 0.3 + 0.7 * Math.sin(frame * 0.02 + i);
        const glowIntensity = 0.5 + 0.5 * Math.sin(frame * 0.04 + i * 2);
        
        return (
          <div
            key={`circuit-${i}`}
            style={{
              position: "absolute",
              left: point.x,
              top: point.y,
              width: Math.sqrt(Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)),
              height: LINE_WIDTH,
              backgroundColor: 'transparent',
              transform: `rotate(${Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x)}rad)`,
              transformOrigin: "left center",
              boxShadow: `0 0 15px rgba(0, 200, 255, ${glowIntensity * 0.6})`,
              borderRadius: "1px",
            }}
          />
        );
      })}

      {/* Central Holographic UI Elements */}
      <div
        style={{
          position: "absolute",
          left: width / 2,
          top: height / 2,
          transform: `translate(-50%, -50%) scale(${hologramScale})`,
          opacity: HOLOGRAM_OPACITY,
        }}
      >
        {/* Central hexagon */}
        <div
          style={{
            width: 120,
            height: 120,
            border: `${LINE_WIDTH}px solid rgba(100, 200, 255, 0.8)`,
            borderRadius: "20px",
            boxShadow: "0 0 30px rgba(100, 200, 255, 0.6)",
            transform: "rotate(30deg)",
          }}
        />
        
        {/* Inner circle */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 60,
            height: 60,
            border: `${LINE_WIDTH}px solid rgba(0, 255, 200, 0.9)`,
            borderRadius: "50%",
            boxShadow: "0 0 25px rgba(0, 255, 200, 0.7)",
          }}
        />
        
        {/* Radial lines */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <div
            key={`radial-${i}`}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 100,
              height: LINE_WIDTH,
              backgroundColor: `rgba(0, 255, 200, ${0.4 + 0.3 * Math.sin(frame * 0.03 + i)})`,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              transformOrigin: "center center",
              boxShadow: `0 0 10px rgba(0, 255, 200, ${0.3 + 0.2 * Math.sin(frame * 0.03 + i)})`,
            }}
          />
        ))}
      </div>

      {/* Particle Burst */}
      {particles.map((particle, i) => (
        <div
          key={`particle-${i}`}
          style={{
            position: "absolute",
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: 'transparent',
            borderRadius: "50%",
            boxShadow: `0 0 ${particle.size * 3}px rgba(100, 200, 255, ${particle.opacity * 0.8})`,
          }}
        />
      ))}

      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `
            linear-gradient(rgba(0, 100, 200, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 100, 200, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SPACING}px ${GRID_SPACING}px`,
        }}
      />

      {/* Edge glow effects */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 10,
          background: "linear-gradient(to bottom, rgba(0, 200, 255, 0.3), transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 10,
          background: "linear-gradient(to top, rgba(0, 200, 255, 0.3), transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 10,
          background: "linear-gradient(to right, rgba(0, 200, 255, 0.3), transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 10,
          background: "linear-gradient(to left, rgba(0, 200, 255, 0.3), transparent)",
        }}
      />
    </AbsoluteFill>
  );
};