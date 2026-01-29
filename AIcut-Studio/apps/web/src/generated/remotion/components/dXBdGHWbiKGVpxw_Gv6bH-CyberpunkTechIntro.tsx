import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useState, useEffect } from "react";

export const CyberpunkTechIntro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Color constants
  const COLOR_BACKGROUND = "#0a0a1a";
  const COLOR_CIRCUIT = "#00c8ff";
  const COLOR_WIREFRAME = "#00f0ff";
  const COLOR_SCAN_LINE = "#00aaff";
  
  // Timing constants
  const SCAN_DURATION = 60;
  const CUBE_ROTATION_SPEED = 0.5;
  const CIRCUIT_PULSE_DURATION = 40;
  const FLOAT_DURATION = 120;
  
  // Layout constants
  const CANVAS_WIDTH = 1920;
  const CANVAS_HEIGHT = 1080;
  const PADDING = 80;
  
  // Circuit line positions (glowing blue lines)
  const circuitLines = [
    { x1: PADDING, y1: PADDING, x2: CANVAS_WIDTH - PADDING, y2: PADDING, delay: 0 },
    { x1: CANVAS_WIDTH - PADDING, y1: PADDING, x2: CANVAS_WIDTH - PADDING, y2: CANVAS_HEIGHT - PADDING, delay: 5 },
    { x1: CANVAS_WIDTH - PADDING, y1: CANVAS_HEIGHT - PADDING, x2: PADDING, y2: CANVAS_HEIGHT - PADDING, delay: 10 },
    { x1: PADDING, y1: CANVAS_HEIGHT - PADDING, x2: PADDING, y2: PADDING, delay: 15 },
    { x1: PADDING + 100, y1: PADDING + 100, x2: CANVAS_WIDTH - PADDING - 100, y2: CANVAS_HEIGHT - PADDING - 100, delay: 20 },
    { x1: CANVAS_WIDTH - PADDING - 100, y1: PADDING + 100, x2: PADDING + 100, y2: CANVAS_HEIGHT - PADDING - 100, delay: 25 },
  ];
  
  // Calculate scan line position
  const scanY = interpolate(
    frame % SCAN_DURATION,
    [0, SCAN_DURATION],
    [0, CANVAS_HEIGHT],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  
  // Circuit pulse effect
  const circuitPulse = spring({
    frame: frame % CIRCUIT_PULSE_DURATION,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  
  // Floating animation for cube
  const floatOffset = Math.sin(frame * 0.03) * 20;
  
  // Cube rotation
  const rotationX = (frame * CUBE_ROTATION_SPEED) % 360;
  const rotationY = (frame * CUBE_ROTATION_SPEED * 1.3) % 360;
  
  return (
    <AbsoluteFill style={{
      backgroundColor: COLOR_BACKGROUND,
      overflow: "hidden",
    }}>
      {/* Circuit lines */}
      {circuitLines.map((line, i) => {
        const pulseOffset = i * 3;
        const pulseProgress = spring({
          frame: frame - line.delay + pulseOffset,
          fps,
          config: { damping: 12, stiffness: 70 },
        });
        
        const lineWidth = 2 + Math.sin(frame * 0.1 + i) * 1.5;
        const opacity = 0.7 + Math.sin(frame * 0.05 + i) * 0.3;
        
        return (
          <svg
            key={i}
            width="100%"
            height="100%"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          >
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={COLOR_CIRCUIT}
              strokeWidth={lineWidth}
              strokeOpacity={opacity * 0.8}
              strokeLinecap="round"
              filter={`url(#glow${i})`}
            />
            <defs>
              <filter id={`glow${i}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>
        );
      })}
      
      {/* Digital scan line effect */}
      <div
        style={{
          position: "absolute",
          top: scanY,
          left: 0,
          width: "100%",
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${COLOR_SCAN_LINE}, transparent)`,
          boxShadow: `0 0 15px ${COLOR_SCAN_LINE}80`,
          transform: `translateY(-1px)`,
        }}
      />
      
      {/* Floating 3D wireframe cube */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) translate(0, ${floatOffset}px) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
          width: 200,
          height: 200,
        }}
      >
        <ThreeCanvas
          scene={({ camera, gl }) => {
            // Simple wireframe cube using Three.js
            const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
            const cubeMaterial = new THREE.MeshBasicMaterial({
              color: COLOR_WIREFRAME,
              wireframe: true,
              transparent: true,
              opacity: 0.9,
            });
            const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            
            // Add subtle pulsing to the cube
            const pulseScale = 1 + Math.sin(frame * 0.02) * 0.05;
            cube.scale.set(pulseScale, pulseScale, pulseScale);
            
            return <primitive object={cube} />;
          }}
        />
      </div>
      
      {/* Additional circuit nodes/dots */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 300 + Math.sin(frame * 0.01 + i) * 50;
        const x = CANVAS_WIDTH / 2 + Math.cos(angle) * distance;
        const y = CANVAS_HEIGHT / 2 + Math.sin(angle) * distance;
        
        const size = 4 + Math.sin(frame * 0.05 + i) * 2;
        const opacity = 0.6 + Math.sin(frame * 0.03 + i) * 0.4;
        
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              backgroundColor: COLOR_CIRCUIT,
              borderRadius: "50%",
              boxShadow: `0 0 ${size * 3}px ${COLOR_CIRCUIT}80`,
              opacity: opacity,
            }}
          />
        );
      })}
      
      {/* Background grid pattern */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          opacity: 0.1,
        }}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={COLOR_CIRCUIT} strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </AbsoluteFill>
  );
};