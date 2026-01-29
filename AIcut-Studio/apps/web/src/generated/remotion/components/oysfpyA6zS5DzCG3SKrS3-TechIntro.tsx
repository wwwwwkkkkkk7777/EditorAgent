import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Circle, Rect } from "@remotion/shapes";

export const TechIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timing constants (in seconds)
  const LASER_TIME = 0.5;
  const GRID_UNFOLD_TIME = 1.0;
  const PARTICLES_CONVERGE_TIME = 2.0;
  const LOGO_EMERGE_TIME = 3.0;

  // Color constants
  const BACKGROUND_COLOR = "#0a0e17";
  const NEON_BLUE = "#00eeff";
  const ELECTRIC_PURPLE = "#b300ff";
  const GLOW_COLOR = "#00eeff80";

  // Layout constants
  const CANVAS_WIDTH = 1920;
  const CANVAS_HEIGHT = 1080;
  const PADDING = 80;
  const GRID_SIZE = 12;
  const GRID_SPACING = 120;
  const PARTICLE_COUNT = 48;
  const LOGO_SIZE = 320;

  // Convert seconds to frames
  const laserFrame = LASER_TIME * fps;
  const gridFrame = GRID_UNFOLD_TIME * fps;
  const particlesFrame = PARTICLES_CONVERGE_TIME * fps;
  const logoFrame = LOGO_EMERGE_TIME * fps;

  // Laser pulse animation
  const laserProgress = interpolate(
    frame,
    [laserFrame - 15, laserFrame, laserFrame + 15],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Grid unfolding animation
  const gridProgress = spring({
    frame: frame - gridFrame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // Particles convergence animation
  const particlesProgress = spring({
    frame: frame - particlesFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Logo emergence animation
  const logoProgress = spring({
    frame: frame - logoFrame,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  // Generate grid points in 3D perspective
  const generateGridPoints = () => {
    const points = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const x = (i - GRID_SIZE / 2) * GRID_SPACING;
        const y = (j - GRID_SIZE / 2) * GRID_SPACING;
        const z = Math.sin(i * 0.3 + frame * 0.02) * Math.cos(j * 0.3 + frame * 0.03) * 80;
        points.push({ x, y, z });
      }
    }
    return points;
  };

  // Generate floating particles
  const generateParticles = () => {
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const radius = 400 + Math.sin(frame * 0.05 + i) * 100;
      const x = Math.cos(angle) * radius + Math.sin(frame * 0.03 + i) * 100;
      const y = Math.sin(angle) * radius * 0.6 + Math.cos(frame * 0.04 + i) * 80;
      particles.push({ x, y, size: 2 + Math.sin(frame * 0.1 + i) * 1.5 });
    }
    return particles;
  };

  const gridPoints = generateGridPoints();
  const particles = generateParticles();

  return (
    <AbsoluteFill style={{ backgroundColor: BACKGROUND_COLOR }}>
      {/* Grid lines */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: interpolate(gridProgress, [0, 1], [0, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        {gridPoints.map((point, i) => {
          const scale = 1 + point.z * 0.002;
          const opacity = Math.max(0.1, 0.6 - Math.abs(point.z) * 0.003);
          const color = i % 3 === 0 ? NEON_BLUE : ELECTRIC_PURPLE;
          
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${point.x}px`,
                top: `${point.y}px`,
                width: `${4 * scale}px`,
                height: `${4 * scale}px`,
                backgroundColor: color,
                borderRadius: "50%",
                boxShadow: `0 0 ${15 * scale}px ${GLOW_COLOR}`,
                opacity: opacity * gridProgress,
              }}
            />
          );
        })}
      </div>

      {/* Laser pulse scan */}
      <div
        style={{
          position: "absolute",
          top: `${interpolate(laserProgress, [0, 1], [0, CANVAS_HEIGHT], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px`,
          left: 0,
          width: "100%",
          height: "4px",
          background: `linear-gradient(90deg, transparent, ${NEON_BLUE}, ${ELECTRIC_PURPLE}, transparent)`,
          boxShadow: `0 0 20px ${NEON_BLUE}80`,
          opacity: laserProgress,
        }}
      />

      {/* Floating data particles */}
      {particles.map((particle, i) => {
        const targetX = 0;
        const targetY = 0;
        const x = interpolate(particlesProgress, [0, 1], [particle.x, targetX], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const y = interpolate(particlesProgress, [0, 1], [particle.y, targetY], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const size = interpolate(particlesProgress, [0, 1], [particle.size, 3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const opacity = interpolate(particlesProgress, [0, 0.3, 1], [0.7, 0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${CANVAS_WIDTH / 2 + x}px`,
              top: `${CANVAS_HEIGHT / 2 + y}px`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: i % 2 === 0 ? NEON_BLUE : ELECTRIC_PURPLE,
              borderRadius: "50%",
              boxShadow: `0 0 ${10 + size * 2}px ${i % 2 === 0 ? NEON_BLUE : ELECTRIC_PURPLE}80`,
              opacity: opacity * particlesProgress,
            }}
          />
        );
      })}

      {/* Holographic logo */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${interpolate(logoProgress, [0, 1], [0.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
          opacity: interpolate(logoProgress, [0, 0.5, 1], [0, 0.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        {/* Logo base */}
        <div
          style={{
            width: `${LOGO_SIZE}px`,
            height: `${LOGO_SIZE}px`,
            background: `radial-gradient(circle at 30% 30%, ${NEON_BLUE}, transparent 70%), radial-gradient(circle at 70% 70%, ${ELECTRIC_PURPLE}, transparent 70%)`,
            borderRadius: "20%",
            boxShadow: `0 0 ${60}px ${NEON_BLUE}80, 0 0 ${80}px ${ELECTRIC_PURPLE}80`,
            position: "relative",
          }}
        >
          {/* Inner circuit pattern */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              height: "80%",
              border: `2px solid ${NEON_BLUE}`,
              borderRadius: "50%",
              boxShadow: `inset 0 0 20px ${NEON_BLUE}50`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(45deg)",
              width: "60%",
              height: "60%",
              border: `1px solid ${ELECTRIC_PURPLE}`,
              borderRadius: "50%",
              boxShadow: `inset 0 0 15px ${ELECTRIC_PURPLE}50`,
            }}
          />
          {/* Central dot */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "20px",
              height: "20px",
              backgroundColor: 'transparent',
              borderRadius: "50%",
              boxShadow: `0 0 20px #ffffff, 0 0 40px ${NEON_BLUE}`,
            }}
          />
        </div>
      </div>

      {/* Cinematic lighting effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at 30% 30%, transparent 0%, transparent 40%, rgba(0, 238, 255, 0.05) 70%, transparent 100%), radial-gradient(circle at 70% 70%, transparent 0%, transparent 40%, rgba(179, 0, 255, 0.05) 70%, transparent 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};