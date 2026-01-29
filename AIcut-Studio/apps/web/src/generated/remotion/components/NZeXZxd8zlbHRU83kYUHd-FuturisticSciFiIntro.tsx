import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Circle, Rect, Triangle, Star, Ellipse, Pie } from "@remotion/shapes";
import { ThreeCanvas } from "@remotion/three";
import { useState, useEffect } from "react";

export const FuturisticSciFiIntro = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Timing constants
  const DURATION = 90; // 4 seconds at 22.5fps (to match 1920x1080 cinematic timing)
  const CAMERA_PUSH_DURATION = DURATION;
  const ROTATION_DURATION = DURATION * 2;

  // Color constants
  const COLOR_GRID_START = "#00cfff"; // cyan
  const COLOR_GRID_END = "#ff00cc"; // magenta
  const COLOR_WIREFRAME = "#00ffff";
  const COLOR_PARTICLE = "#ffffff";

  // Layout constants
  const GRID_SPACING = 80;
  const GRID_SIZE = Math.max(width, height) * 1.5;
  const SPHERE_RADIUS = 120;
  const PARTICLE_COUNT = 120;
  const DEPTH_OF_FIELD_STRENGTH = 0.7;

  // Camera animation
  const cameraZ = interpolate(
    frame,
    [0, CAMERA_PUSH_DURATION],
    [1200, 600],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Rotation animation
  const sphereRotationX = interpolate(
    frame,
    [0, ROTATION_DURATION],
    [0, Math.PI * 2],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const sphereRotationY = interpolate(
    frame,
    [0, ROTATION_DURATION],
    [0, Math.PI * 3],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Particle animation
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const phase = (i * 0.3) % (Math.PI * 2);
    const speed = 0.8 + (i % 3) * 0.2;
    const depth = interpolate(
      frame,
      [0, DURATION],
      [0, 1000],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    const z = depth - (i * 15) % 1000;
    
    const x = Math.sin(phase + frame * 0.02 * speed) * (200 + (i % 5) * 50);
    const y = Math.cos(phase * 0.7 + frame * 0.015 * speed) * (150 + (i % 4) * 40);
    
    const scale = interpolate(
      z,
      [0, 300, 1000],
      [0.8, 1.2, 0.2],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    
    const opacity = interpolate(
      z,
      [0, 200, 1000],
      [0.2, 1, 0.1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    
    return { x, y, z, scale, opacity, i };
  });

  // Lens flare effect
  const flareOpacity = interpolate(
    frame,
    [0, 20, 40, DURATION],
    [0.1, 0.4, 0.7, 0.3],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Chromatic aberration strength
  const chromaStrength = interpolate(
    frame,
    [0, DURATION],
    [0.002, 0.008],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Grid animation
  const gridOffset = frame * 0.5;

  return (
    <AbsoluteFill style={{ 
      backgroundColor: "transparent",
      overflow: "hidden",
      fontFamily: "Inter, sans-serif"
    }}>
      {/* Gradient Grid Background */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: `radial-gradient(circle at 50% 50%, ${COLOR_GRID_START} 0%, ${COLOR_GRID_END} 100%)`,
        opacity: 0.3,
      }} />
      
      {/* Animated Grid Overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: `
          linear-gradient(rgba(0, 207, 255, 0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 0, 204, 0.15) 1px, transparent 1px)
        `,
        backgroundSize: `${GRID_SPACING}px ${GRID_SPACING}px`,
        transform: `translate(${gridOffset}px, ${gridOffset * 0.7}px)`,
        opacity: 0.4,
      }} />
      
      {/* Holographic Wireframe Sphere */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: `${SPHERE_RADIUS * 2}px`,
        height: `${SPHERE_RADIUS * 2}px`,
        transform: `
          translate(-50%, -50%) 
          translateZ(${cameraZ - 800}px)
          rotateX(${sphereRotationX}rad) 
          rotateY(${sphereRotationY}rad)
          scale(${1 + Math.sin(frame * 0.05) * 0.05})
        `,
        filter: `drop-shadow(0 0 20px ${COLOR_WIREFRAME}80)`,
      }}>
        {/* Wireframe sphere using multiple circles */}
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const radius = SPHERE_RADIUS * Math.cos(angle * 0.5);
          const offset = SPHERE_RADIUS * Math.sin(angle * 0.5);
          
          return (
            <Circle
              key={i}
              radius={radius}
              stroke={COLOR_WIREFRAME}
              strokeWidth={1.5}
              fill="none"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) translateY(${offset}px)`,
                opacity: 0.7 + Math.sin(frame * 0.03 + i) * 0.2,
              }}
            />
          );
        })}
        
        {/* Equator circle */}
        <Circle
          radius={SPHERE_RADIUS}
          stroke={COLOR_WIREFRAME}
          strokeWidth={2.5}
          fill="none"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.9,
          }}
        />
      </div>
      
      {/* Digital Particle Stream */}
      {particles.map((particle) => (
        <div
          key={particle.i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: `${4 * particle.scale}px`,
            height: `${4 * particle.scale}px`,
            backgroundColor: COLOR_PARTICLE,
            borderRadius: "50%",
            transform: `
              translate(-50%, -50%) 
              translate3d(${particle.x}px, ${particle.y}px, ${particle.z}px)
              scale(${particle.scale})
            `,
            opacity: particle.opacity * 0.8,
            boxShadow: `0 0 ${8 * particle.scale}px ${COLOR_PARTICLE}80`,
            filter: `blur(${0.5 * particle.scale}px)`,
          }}
        />
      ))}
      
      {/* Lens Flare Effect */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "20%",
        width: "100px",
        height: "100px",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${COLOR_WIREFRAME}00, ${COLOR_WIREFRAME}40, ${COLOR_GRID_END}80)`,
        opacity: flareOpacity * 0.3,
        filter: "blur(20px)",
      }} />
      
      <div style={{
        position: "absolute",
        top: "70%",
        right: "15%",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${COLOR_GRID_START}00, ${COLOR_GRID_START}40, ${COLOR_WIREFRAME}80)`,
        opacity: flareOpacity * 0.2,
        filter: "blur(15px)",
      }} />
      
      {/* Chromatic Aberration Effect (simulated with layered elements) */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "linear-gradient(45deg, transparent 49%, rgba(0,207,255,0.02) 50%, transparent 51%), linear-gradient(-45deg, transparent 49%, rgba(255,0,204,0.02) 50%, transparent 51%)",
        backgroundSize: "2px 2px",
        opacity: chromaStrength * 0.5,
      }} />
      
      {/* Depth of Field Blur Effect */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.1) 80%)",
        opacity: DEPTH_OF_FIELD_STRENGTH * 0.2,
      }} />
    </AbsoluteFill>
  );
};