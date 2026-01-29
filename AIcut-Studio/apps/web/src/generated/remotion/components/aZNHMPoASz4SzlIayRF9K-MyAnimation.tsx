import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Circle, Rect, Triangle, Star, Ellipse, Pie } from "@remotion/shapes";
import { useState, useEffect } from "react";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Constants
  const BACKGROUND_COLOR = "#0a0e17";
  const GLOW_CYAN = "#00f0ff";
  const ELECTRIC_BLUE = "#0066ff";
  const TEXT_COLOR = "#00f0ff";
  const SPHERE_RADIUS = 80;
  const PARTICLE_COUNT = 40;
  const TEXT_APPEAR_FRAME = Math.round(2.0 * fps);
  const DURATION_FRAMES = Math.round(3.5 * fps);

  // Circuit line animation (inward from corners)
  const cornerLineProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // Sphere rotation
  const sphereRotationX = (frame * 0.02) % (Math.PI * 2);
  const sphereRotationY = (frame * 0.03) % (Math.PI * 2);

  // Particle burst at 1.2s
  const particleBurstFrame = Math.round(1.2 * fps);
  const particleBurstActive = frame >= particleBurstFrame && frame <= particleBurstFrame + 15;
  const particleBurstProgress = particleBurstActive 
    ? interpolate(frame - particleBurstFrame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  // Text appearance and shimmer
  const textOpacity = interpolate(frame, [TEXT_APPEAR_FRAME - 15, TEXT_APPEAR_FRAME], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const textScale = spring({
    frame: frame - TEXT_APPEAR_FRAME + 15,
    fps,
    config: { damping: 18, stiffness: 150 },
  });
  const shimmerProgress = interpolate(frame, [TEXT_APPEAR_FRAME, TEXT_APPEAR_FRAME + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Pulse glow for text
  const pulseProgress = interpolate(frame, [TEXT_APPEAR_FRAME, TEXT_APPEAR_FRAME + 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulseScale = 1 + 0.05 * Math.sin(pulseProgress * Math.PI * 4);

  // Generate circuit lines from corners
  const generateCircuitLines = () => {
    const lines = [];
    const cornerPoints = [
      { x: 0, y: 0, color: GLOW_CYAN },
      { x: width, y: 0, color: ELECTRIC_BLUE },
      { x: 0, y: height, color: ELECTRIC_BLUE },
      { x: width, y: height, color: GLOW_CYAN },
    ];

    cornerPoints.forEach((corner, i) => {
      const progress = Math.min(cornerLineProgress, 1);
      const endX = width / 2;
      const endY = height / 2;
      const startX = corner.x;
      const startY = corner.y;

      // Create multiple segments for circuit effect
      for (let seg = 0; seg < 5; seg++) {
        const segmentLength = 40;
        const offsetX = (seg * segmentLength) * (endX - startX) / Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const offsetY = (seg * segmentLength) * (endY - startY) / Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        
        const x1 = startX + (endX - startX) * progress * (seg / 4);
        const y1 = startY + (endY - startY) * progress * (seg / 4);
        const x2 = startX + (endX - startX) * progress * ((seg + 0.5) / 4);
        const y2 = startY + (endY - startY) * progress * ((seg + 0.5) / 4);

        lines.push(
          <Rect
            key={`line-${i}-${seg}`}
            x={x1}
            y={y1}
            width={Math.abs(x2 - x1) + 2}
            height={Math.abs(y2 - y1) + 2}
            fill="none"
            stroke={corner.color}
            strokeWidth={2}
            style={{
              filter: `drop-shadow(0 0 8px ${corner.color}80) drop-shadow(0 0 16px ${corner.color}40)`,
              opacity: 0.7,
            }}
          />
        );
      }
    });

    return lines;
  };

  // Generate 3D wireframe sphere points
  const generateSpherePoints = () => {
    const points = [];
    const radius = SPHERE_RADIUS;
    
    // Draw wireframe circles
    for (let i = 0; i <= 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      
      // Equator circle
      points.push(
        <Circle
          key={`equator-${i}`}
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke={GLOW_CYAN}
          strokeWidth={1.5}
          style={{
            filter: `drop-shadow(0 0 6px ${GLOW_CYAN}80)`,
            transform: `rotate(${angle}rad)`,
            transformOrigin: `${width / 2}px ${height / 2}px`,
          }}
        />
      );
      
      // Meridian circles
      const meridianRadius = radius * Math.cos(angle - Math.PI/2);
      const meridianOffset = radius * Math.sin(angle - Math.PI/2);
      points.push(
        <Circle
          key={`meridian-${i}`}
          cx={width / 2}
          cy={height / 2 + meridianOffset}
          r={meridianRadius}
          fill="none"
          stroke={ELECTRIC_BLUE}
          strokeWidth={1.5}
          style={{
            filter: `drop-shadow(0 0 6px ${ELECTRIC_BLUE}80)`,
            transform: `rotate(${sphereRotationX}rad)`,
            transformOrigin: `${width / 2}px ${height / 2}px`,
          }}
        />
      );
    }
    
    return points;
  };

  // Generate particles for burst
  const generateParticles = () => {
    if (!particleBurstActive) return null;
    
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const distance = 20 + 80 * particleBurstProgress;
      const x = width / 2 + Math.cos(angle) * distance;
      const y = height / 2 + Math.sin(angle) * distance;
      const size = 2 + 4 * particleBurstProgress;
      const opacity = 1 - particleBurstProgress;
      
      particles.push(
        <Circle
          key={`particle-${i}`}
          cx={x}
          cy={y}
          r={size}
          fill={i % 2 === 0 ? GLOW_CYAN : ELECTRIC_BLUE}
          style={{
            filter: `drop-shadow(0 0 6px ${i % 2 === 0 ? GLOW_CYAN : ELECTRIC_BLUE}80)`,
            opacity,
          }}
        />
      );
    }
    
    return particles;
  };

  // Shimmer effect for text
  const shimmerOffset = 20 * Math.sin(shimmerProgress * Math.PI * 6);
  
  return (
    <AbsoluteFill style={{ backgroundColor: BACKGROUND_COLOR }}>
      {/* Circuit lines from corners */}
      {generateCircuitLines()}
      
      {/* 3D wireframe sphere */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(0.5px)",
        }}
      >
        {generateSpherePoints()}
      </div>
      
      {/* Particle burst */}
      {generateParticles()}
      
      {/* Holographic text */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${textScale})`,
          opacity: textOpacity,
          fontFamily: "Inter, sans-serif",
          fontSize: 120,
          fontWeight: 700,
          color: TEXT_COLOR,
          textShadow: `
            0 0 10px ${TEXT_COLOR}80,
            0 0 20px ${TEXT_COLOR}60,
            ${shimmerOffset}px 0 15px ${TEXT_COLOR}40,
            -${shimmerOffset}px 0 15px ${TEXT_COLOR}40,
            0 0 30px ${TEXT_COLOR}20
          `,
          letterSpacing: "4px",
          filter: `drop-shadow(0 0 20px ${TEXT_COLOR}40)`,
          transformOrigin: "center",
        }}
      >
        TECH
      </div>
      
      {/* Pulse glow overlay */}
      {frame >= TEXT_APPEAR_FRAME && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 400,
            height: 200,
            transform: `translate(-50%, -50%) scale(${pulseScale})`,
            background: `radial-gradient(circle, ${TEXT_COLOR}20, transparent 70%)`,
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
      )}
      
      {/* Motion blur effect (simulated with subtle opacity transitions) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at ${width/2}px ${height/2}px, transparent 0%, ${BACKGROUND_COLOR} 100%)`,
          opacity: 0.1,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};