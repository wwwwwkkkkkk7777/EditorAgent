import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring, Sequence } from "remotion";
import { fade } from "@remotion/transitions/fade";
import { ThreeCanvas } from "@remotion/three";
import { useState, useEffect } from "react";

export const CyberpunkTechIntro = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Constants
  const BACKGROUND_GRADIENT_START = "#0a0f2c";
  const BACKGROUND_GRADIENT_END = "#00c9ff";
  const TEXT_COLOR = "#ffffff";
  const GLOW_COLOR = "#00c9ff";
  const GRID_COLOR = "rgba(0, 201, 255, 0.15)";
  const BINARY_CHARACTERS = "01";
  const TITLE_TEXT = "TECH FUTURE";
  const FONT_FAMILY = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  
  // Timing constants
  const TOTAL_DURATION = 90; // 3 seconds at 30fps
  const ZOOM_IN_DURATION = 45; // 1.5 seconds
  const ROTATION_DURATION = 45;
  const FADE_OUT_START = 75;
  const FADE_OUT_DURATION = 15;

  // Zoom and rotation animation
  const zoomProgress = interpolate(
    frame,
    [0, ZOOM_IN_DURATION],
    [1, 1.025],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  
  const rotationProgress = interpolate(
    frame,
    [0, ROTATION_DURATION],
    [0, 0.5],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Fade out effect
  const fadeOutOpacity = interpolate(
    frame,
    [FADE_OUT_START, FADE_OUT_START + FADE_OUT_DURATION],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Binary stream generation
  const binaryRows = 25;
  const binaryCols = 80;
  const binaryStream = Array.from({ length: binaryRows }, (_, i) => {
    return Array.from({ length: binaryCols }, () => 
      BINARY_CHARACTERS[Math.floor(Math.random() * BINARY_CHARACTERS.length)]
    ).join('');
  });

  // Create flickering effect for binary characters
  const getFlickerOpacity = (rowIndex: number, colIndex: number) => {
    const baseFlicker = Math.sin(frame * 0.1 + rowIndex * 0.3 + colIndex * 0.2) * 0.3 + 0.7;
    const randomFlicker = Math.sin(frame * 0.5 + rowIndex * 1.7 + colIndex * 2.3) * 0.2 + 0.8;
    return Math.min(1, Math.max(0.3, baseFlicker * randomFlicker));
  };

  // Wireframe grid points
  const gridSize = 20;
  const gridSpacing = 80;
  const gridPoints = [];
  for (let x = -gridSize; x <= gridSize; x++) {
    for (let z = -gridSize; z <= gridSize; z++) {
      if (x === -gridSize || x === gridSize || z === -gridSize || z === gridSize) {
        gridPoints.push({ x, z });
      }
    }
  }

  // Perspective rotation for grid
  const perspectiveRotation = interpolate(
    frame,
    [0, TOTAL_DURATION],
    [0, 360],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ 
      backgroundColor: "transparent",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    }}>
      {/* Gradient Background */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${BACKGROUND_GRADIENT_START}, ${BACKGROUND_GRADIENT_END})`,
        zIndex: 0,
      }} />

      {/* Binary Code Stream */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        overflow: "hidden",
      }}>
        {binaryStream.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              position: "absolute",
              top: `${rowIndex * 24}px`,
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "monospace",
              fontSize: 14,
              fontWeight: "bold",
              color: GLOW_COLOR,
              textShadow: "0 0 8px rgba(0, 201, 255, 0.8)",
              opacity: 0.7,
              letterSpacing: "2px",
              lineHeight: "24px",
            }}
          >
            {row.split('').map((char, colIndex) => (
              <span
                key={colIndex}
                style={{
                  opacity: getFlickerOpacity(rowIndex, colIndex),
                  animation: `pulse ${Math.random() * 2 + 1}s infinite alternate`,
                }}
              >
                {char}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* 3D Wireframe Grid */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "100%",
        height: "100%",
        transform: `translate(-50%, -50%) rotateX(${interpolate(frame, [0, TOTAL_DURATION], [0, 15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}deg) rotateY(${interpolate(frame, [0, TOTAL_DURATION], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}deg)`,
        zIndex: 2,
      }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {gridPoints.map((point, index) => {
            const scale = 1 + Math.sin(frame * 0.02 + index * 0.1) * 0.05;
            const x = (point.x * gridSpacing) + width / 2;
            const y = (point.z * gridSpacing) + height / 2;
            const opacity = 0.15 + Math.sin(frame * 0.03 + index * 0.2) * 0.05;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={1.5 * scale}
                fill={GRID_COLOR}
                opacity={opacity}
              />
            );
          })}
          
          {/* Grid lines */}
          {Array.from({ length: gridSize * 2 + 1 }).map((_, i) => {
            const pos = (i - gridSize) * gridSpacing;
            return (
              <g key={i}>
                <line
                  x1={pos + width / 2}
                  y1={-100}
                  x2={pos + width / 2}
                  y2={height + 100}
                  stroke={GRID_COLOR}
                  strokeWidth="0.5"
                  strokeDasharray="2,4"
                />
                <line
                  x1={-100}
                  y1={pos + height / 2}
                  x2={width + 100}
                  y2={pos + height / 2}
                  stroke={GRID_COLOR}
                  strokeWidth="0.5"
                  strokeDasharray="2,4"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Title Text */}
      <div style={{
        position: "relative",
        zIndex: 3,
        transform: `scale(${zoomProgress}) rotate(${rotationProgress}deg)`,
        transformOrigin: "center",
        transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      }}>
        <h1
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 84,
            fontWeight: 800,
            color: TEXT_COLOR,
            textTransform: "uppercase",
            letterSpacing: "4px",
            margin: 0,
            textShadow: `
              0 0 12px ${GLOW_COLOR},
              0 0 24px ${GLOW_COLOR},
              0 0 36px rgba(0, 201, 255, 0.6),
              0 0 48px rgba(0, 201, 255, 0.4)
            `,
            textAlign: "center",
            maxWidth: "80%",
          }}
        >
          {TITLE_TEXT}
        </h1>
      </div>

      {/* Radial Light Fade Out Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at center, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, ${1 - fadeOutOpacity}) 70%)`,
          zIndex: 10,
          opacity: fadeOutOpacity,
        }}
      />

      {/* Style for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>
    </AbsoluteFill>
  );
};