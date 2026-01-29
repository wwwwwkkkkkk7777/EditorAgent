import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring } from "remotion";
import { useState, useEffect } from "react";

export const FuturisticTechIntro = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  // Color constants
  const COLOR_BACKGROUND = "#0a0e17";
  const COLOR_CIRCUIT = "#00f0ff";
  const COLOR_GRID = "#0088aa";
  const COLOR_PARTICLE = "#00c0e0";
  
  // Timing constants
  const CIRCUIT_ANIMATION_DURATION = 90;
  const GRID_FADE_DURATION = 60;
  const PARTICLE_DRIFT_DURATION = 120;
  
  // Layout constants
  const PADDING = 40;
  const GRID_SPACING = 40;
  const CIRCUIT_THICKNESS = 3;
  const PARTICLE_COUNT = 40;
  
  // Circuit animation progress (center outward)
  const circuitProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  
  // Grid fade-in
  const gridOpacity = interpolate(
    frame,
    [CIRCUIT_ANIMATION_DURATION - 30, CIRCUIT_ANIMATION_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  
  // Particle drift calculation
  const particleDrift = (frame % PARTICLE_DRIFT_DURATION) / PARTICLE_DRIFT_DURATION;
  
  // Generate particles
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i * 137.5) % 360; // Golden angle for natural distribution
    const distance = Math.sqrt(i / PARTICLE_COUNT) * Math.min(width, height) * 0.4;
    const x = width / 2 + Math.cos(angle * Math.PI / 180) * distance * (0.5 + particleDrift * 0.5);
    const y = height / 2 + Math.sin(angle * Math.PI / 180) * distance * (0.5 + particleDrift * 0.5);
    
    return {
      id: i,
      x,
      y,
      size: interpolate(
        frame,
        [0, 30, 60],
        [1, 2.5, 1.5],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      ),
      opacity: interpolate(
        frame,
        [i * 2, i * 2 + 20, i * 2 + 40],
        [0, 1, 0.7],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      ),
      pulse: Math.sin(frame * 0.1 + i) * 0.2 + 1,
    };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BACKGROUND }}>
      {/* Holographic grid */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: gridOpacity,
          pointerEvents: "none",
        }}
      >
        {/* Vertical lines */}
        {Array.from({ length: Math.ceil(width / GRID_SPACING) + 1 }).map((_, i) => (
          <div
            key={`v-${i}`}
            style={{
              position: "absolute",
              top: 0,
              left: i * GRID_SPACING,
              width: 1,
              height: "100%",
              background: `linear-gradient(to bottom, transparent, ${COLOR_GRID}40, transparent)`,
              boxShadow: `0 0 8px ${COLOR_GRID}40`,
            }}
          />
        ))}
        
        {/* Horizontal lines */}
        {Array.from({ length: Math.ceil(height / GRID_SPACING) + 1 }).map((_, i) => (
          <div
            key={`h-${i}`}
            style={{
              position: "absolute",
              top: i * GRID_SPACING,
              left: 0,
              width: "100%",
              height: 1,
              background: `linear-gradient(to right, transparent, ${COLOR_GRID}40, transparent)`,
              boxShadow: `0 0 8px ${COLOR_GRID}40`,
            }}
          />
        ))}
      </div>
      
      {/* Circuit lines - radial pattern */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 0,
          height: 0,
        }}
      >
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 15) % 360;
          const rad = angle * Math.PI / 180;
          const length = interpolate(
            circuitProgress,
            [0, 1],
            [0, Math.max(width, height) * 0.4],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          
          const endX = Math.cos(rad) * length;
          const endY = Math.sin(rad) * length;
          
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 2,
                height: 2,
                background: COLOR_CIRCUIT,
                borderRadius: "50%",
                boxShadow: `0 0 12px ${COLOR_CIRCUIT}, 0 0 24px ${COLOR_CIRCUIT}80`,
                transform: `translate(-50%, -50%) translate(${endX}px, ${endY}px)`,
                transformOrigin: "center",
                opacity: interpolate(
                  frame,
                  [i * 3, i * 3 + 20],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                ),
              }}
            />
          );
        })}
        
        {/* Central node */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 24,
            height: 24,
            background: COLOR_CIRCUIT,
            borderRadius: "50%",
            boxShadow: `0 0 30px ${COLOR_CIRCUIT}, 0 0 60px ${COLOR_CIRCUIT}80`,
            transform: "translate(-50%, -50%)",
            opacity: interpolate(
              frame,
              [0, 30, 60],
              [0, 1, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            ),
          }}
        />
      </div>
      
      {/* Circuit lines - concentric circles */}
      {Array.from({ length: 6 }).map((_, i) => {
        const radius = interpolate(
          circuitProgress,
          [0, 1],
          [0, 120 + i * 40],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        
        return (
          <div
            key={`circle-${i}`}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: radius * 2,
              height: radius * 2,
              border: `${CIRCUIT_THICKNESS}px solid ${COLOR_CIRCUIT}`,
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              boxShadow: `0 0 16px ${COLOR_CIRCUIT}, 0 0 32px ${COLOR_CIRCUIT}80`,
              opacity: interpolate(
                frame,
                [i * 10, i * 10 + 20],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              ),
            }}
          />
        );
      })}
      
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: "absolute",
            top: particle.y,
            left: particle.x,
            width: particle.size,
            height: particle.size,
            background: COLOR_PARTICLE,
            borderRadius: "50%",
            boxShadow: `0 0 ${particle.size * 4}px ${COLOR_PARTICLE}, 0 0 ${particle.size * 8}px ${COLOR_PARTICLE}80`,
            opacity: particle.opacity * particle.pulse,
            transform: `scale(${particle.pulse})`,
          }}
        />
      ))}
      
      {/* Subtle glow overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at 50% 50%, ${COLOR_CIRCUIT}10 0%, transparent 70%)`,
          opacity: interpolate(
            frame,
            [0, 60, 120],
            [0.1, 0.3, 0.1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
        }}
      />
    </AbsoluteFill>
  );
};