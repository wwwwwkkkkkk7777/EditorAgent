import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { useState, useEffect } from "react";

export const NeonWireframeHologram = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  // Constants
  const COLOR_BACKGROUND = "#0a0a1a";
  const COLOR_CYAN = "#00f0ff";
  const COLOR_PURPLE = "#b967ff";
  const COLOR_CYAN_DIM = "#008080";
  const COLOR_PURPLE_DIM = "#6a33aa";
  
  const SCAN_LINE_DURATION = 45;
  const PARTICLE_COUNT = 120;
  const HOLOGRAM_DURATION = 90;
  const CONVERGENCE_DURATION = 60;
  
  // Scan line animation
  const scanProgress = interpolate(
    frame,
    [0, SCAN_LINE_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  
  // Hologram grid pulse
  const hologramPulse = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  
  // Particle convergence
  const convergenceProgress = interpolate(
    frame,
    [0, CONVERGENCE_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  
  // Create particles
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
    const distance = 300 + Math.sin(frame * 0.05 + i) * 50;
    const x = width / 2 + Math.cos(angle) * distance * (1 - convergenceProgress);
    const y = height / 2 + Math.sin(angle) * distance * (1 - convergenceProgress);
    
    const size = interpolate(
      frame,
      [i * 0.3, i * 0.3 + 20],
      [2, 6],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    
    const opacity = interpolate(
      frame,
      [i * 0.5, i * 0.5 + 15, i * 0.5 + 30],
      [0, 1, 0.7],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    
    const color = i % 3 === 0 ? COLOR_CYAN : i % 3 === 1 ? COLOR_PURPLE : COLOR_CYAN;
    
    return { x, y, size, opacity, color, id: i };
  });
  
  // Wireframe grid points
  const gridSize = 12;
  const gridPoints = [];
  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      const x = (i / gridSize) * width;
      const y = (j / gridSize) * height;
      const pulse = Math.sin(frame * 0.1 + i * 0.3 + j * 0.5) * 0.3 + 0.7;
      gridPoints.push({ x, y, pulse, i, j });
    }
  }
  
  // Scan line effect
  const scanLineY = interpolate(
    frame % SCAN_LINE_DURATION,
    [0, SCAN_LINE_DURATION],
    [0, height],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  
  // Glowing effect parameters
  const glowIntensity = Math.sin(frame * 0.03) * 0.3 + 0.7;
  const cyanGlow = `${COLOR_CYAN}80`;
  const purpleGlow = `${COLOR_PURPLE}80`;
  
  return (
    <AbsoluteFill style={{ 
      backgroundColor: COLOR_BACKGROUND,
      overflow: "hidden",
      fontFamily: "Inter, sans-serif"
    }}>
      {/* Background particles */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
      }}>
        {Array.from({ length: 80 }).map((_, i) => {
          const size = Math.random() * 2 + 0.5;
          const x = Math.random() * width;
          const y = Math.random() * height;
          const opacity = Math.random() * 0.3 + 0.1;
          const delay = Math.random() * 10;
          
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: size,
                height: size,
                backgroundColor: Math.random() > 0.5 ? COLOR_CYAN_DIM : COLOR_PURPLE_DIM,
                borderRadius: "50%",
                opacity: opacity * interpolate(frame - delay, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                boxShadow: `0 0 ${size * 4}px ${Math.random() > 0.5 ? cyanGlow : purpleGlow}`,
                animation: `pulse ${3 + Math.random() * 4}s infinite alternate`,
              }}
            />
          );
        })}
      </div>
      
      {/* Grid wireframe */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 2,
      }}>
        {/* Horizontal lines */}
        {Array.from({ length: gridSize + 1 }).map((_, i) => {
          const y = (i / gridSize) * height;
          const opacity = 0.3 + Math.sin(frame * 0.05 + i * 0.7) * 0.2;
          return (
            <div
              key={`h-${i}`}
              style={{
                position: "absolute",
                top: y,
                left: 0,
                width: "100%",
                height: "1px",
                background: `linear-gradient(90deg, ${COLOR_CYAN}00, ${COLOR_CYAN}, ${COLOR_PURPLE}, ${COLOR_PURPLE}00)`,
                opacity: opacity * hologramPulse * 0.7,
                boxShadow: `0 0 10px ${cyanGlow}`,
              }}
            />
          );
        })}
        
        {/* Vertical lines */}
        {Array.from({ length: gridSize + 1 }).map((_, i) => {
          const x = (i / gridSize) * width;
          const opacity = 0.3 + Math.sin(frame * 0.07 + i * 0.9) * 0.2;
          return (
            <div
              key={`v-${i}`}
              style={{
                position: "absolute",
                left: x,
                top: 0,
                width: "1px",
                height: "100%",
                background: `linear-gradient(${COLOR_CYAN}00, ${COLOR_CYAN}, ${COLOR_PURPLE}, ${COLOR_PURPLE}00)`,
                opacity: opacity * hologramPulse * 0.7,
                boxShadow: `0 0 10px ${purpleGlow}`,
              }}
            />
          );
        })}
        
        {/* Grid points */}
        {gridPoints.map((point) => (
          <div
            key={`p-${point.i}-${point.j}`}
            style={{
              position: "absolute",
              left: point.x - 2,
              top: point.y - 2,
              width: "4px",
              height: "4px",
              backgroundColor: point.i === 0 || point.j === 0 || point.i === gridSize || point.j === gridSize 
                ? COLOR_CYAN 
                : COLOR_PURPLE,
              borderRadius: "50%",
              boxShadow: `0 0 ${4 * point.pulse}px ${point.i === 0 || point.j === 0 || point.i === gridSize || point.j === gridSize ? cyanGlow : purpleGlow}`,
              transform: `scale(${point.pulse})`,
              opacity: 0.8 * point.pulse,
            }}
          />
        ))}
      </div>
      
      {/* Converging particles */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 3,
      }}>
        {particles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: "absolute",
              left: particle.x - particle.size / 2,
              top: particle.y - particle.size / 2,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: "50%",
              boxShadow: `0 0 ${particle.size * 3}px ${particle.color}80`,
              opacity: particle.opacity * glowIntensity,
              filter: "blur(0.5px)",
              transform: `scale(${0.5 + particle.opacity * 0.5})`,
            }}
          />
        ))}
      </div>
      
      {/* Scan line effect */}
      <div
        style={{
          position: "absolute",
          top: scanLineY,
          left: 0,
          width: "100%",
          height: "2px",
          background: `linear-gradient(90deg, ${COLOR_CYAN}00, ${COLOR_CYAN}, ${COLOR_PURPLE}, ${COLOR_PURPLE}00)`,
          boxShadow: `0 0 15px ${cyanGlow}, 0 0 25px ${purpleGlow}`,
          zIndex: 4,
          opacity: 0.8,
        }}
      />
      
      {/* Central convergence ring */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "200px",
          height: "200px",
          marginLeft: "-100px",
          marginTop: "-100px",
          border: `2px solid ${COLOR_CYAN}`,
          borderRadius: "50%",
          boxShadow: `0 0 30px ${cyanGlow}, inset 0 0 20px ${COLOR_CYAN}30`,
          transform: `scale(${0.5 + convergenceProgress * 0.8}) rotate(${frame * 2}deg)`,
          opacity: 0.7,
          zIndex: 5,
        }}
      />
      
      {/* Inner convergence circle */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "80px",
          height: "80px",
          marginLeft: "-40px",
          marginTop: "-40px",
          border: `1px solid ${COLOR_PURPLE}`,
          borderRadius: "50%",
          boxShadow: `0 0 20px ${purpleGlow}, inset 0 0 15px ${COLOR_PURPLE}30`,
          transform: `scale(${0.3 + convergenceProgress * 0.9})`,
          opacity: 0.9,
          zIndex: 6,
        }}
      />
      
      {/* Title text - subtle holographic effect */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          color: COLOR_CYAN,
          fontSize: "24px",
          fontWeight: "bold",
          letterSpacing: "4px",
          textTransform: "uppercase",
          fontFamily: "Inter, sans-serif",
          textShadow: `0 0 10px ${cyanGlow}, 0 0 20px ${purpleGlow}`,
          opacity: interpolate(frame, [HOLOGRAM_DURATION - 30, HOLOGRAM_DURATION], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          zIndex: 7,
        }}
      >
        FUTURISTIC TECH
      </div>
      
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "50%",
          transform: "translateX(-50%)",
          color: COLOR_PURPLE,
          fontSize: "18px",
          fontWeight: "normal",
          letterSpacing: "2px",
          fontFamily: "Inter, sans-serif",
          textShadow: `0 0 8px ${purpleGlow}`,
          opacity: interpolate(frame, [HOLOGRAM_DURATION - 20, HOLOGRAM_DURATION], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          zIndex: 7,
        }}
      >
        SYSTEM INITIALIZATION
      </div>
      
      {/* Motion blur effect overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at ${width/2}px ${height/2}px, transparent 0%, ${COLOR_BACKGROUND}80 70%)`,
          zIndex: 8,
          opacity: 0.3,
        }}
      />
      
      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.3; transform: scale(1); }
          100% { opacity: 0.8; transform: scale(1.2); }
        }
        div[style*="pulse"] {
          animation: pulse 3s infinite alternate;
        }
      `}</style>
    </AbsoluteFill>
  );
};