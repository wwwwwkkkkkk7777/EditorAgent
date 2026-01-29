import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring, Sequence } from "remotion";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { ThreeCanvas } from "@remotion/three";
import { useState, useEffect } from "react";

export const XianxiaTeaser = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Color palette
  const COLOR_SKY_CRIMSON = "#d32f2f";
  const COLOR_MIST_TEAL = "#2196f3";
  const COLOR_SCRIPT_GOLD = "#ffca28";
  const COLOR_MOUNTAIN_DARK = "#0d47a1";
  const COLOR_SHADOW = "#000000";

  // Timing constants
  const DURATION = 375; // 15s * 25fps
  const ZOOM_TRIGGER_FRAME = 187; // 7.5s * 25fps
  const ZOOM_DURATION = 60; // 2.4s zoom transition
  const FADE_IN_DURATION = 40;
  const FADE_OUT_DURATION = 40;

  // Camera & composition
  const BASE_SCALE = 1.0;
  const FINAL_SCALE = 1.8;
  const ZOOM_START_FRAME = ZOOM_TRIGGER_FRAME - ZOOM_DURATION / 2;
  const ZOOM_END_FRAME = ZOOM_TRIGGER_FRAME + ZOOM_DURATION / 2;

  // Zoom interpolation
  const zoomProgress = interpolate(
    frame,
    [ZOOM_START_FRAME, ZOOM_END_FRAME],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const currentScale = interpolate(
    zoomProgress,
    [0, 1],
    [BASE_SCALE, FINAL_SCALE],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Figure entrance & silhouette
  const figureEntrance = spring({
    frame: frame - 20,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  const figureOpacity = interpolate(
    frame,
    [0, FADE_IN_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Mist animation
  const mistOpacity = interpolate(
    frame,
    [0, 100, DURATION],
    [0.4, 0.7, 0.5],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Script floating animation
  const scriptFloat = Math.sin(frame * 0.05) * 15;
  const scriptScale = 0.8 + Math.sin(frame * 0.1) * 0.05;

  // Film grain effect
  const grainIntensity = 0.08 + Math.sin(frame * 0.3) * 0.02;

  // Layout constants
  const MOUNTAIN_HEIGHT = height * 0.6;
  const FIGURE_HEIGHT = height * 0.35;
  const FIGURE_Y = height * 0.55;
  const SCRIPT_Y = height * 0.3;

  return (
    <AbsoluteFill style={{
      backgroundColor: "transparent",
      overflow: "hidden",
      transform: `scale(${currentScale})`,
      transformOrigin: "center center",
    }}>
      {/* Background gradient sky */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at 50% 30%, ${COLOR_SKY_CRIMSON} 0%, #b71c1c 70%, #0d47a1 100%)`,
          opacity: 0.9,
        }}
      />

      {/* Misty mountains layer */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: `${MOUNTAIN_HEIGHT}px`,
          background: `linear-gradient(to top, ${COLOR_MOUNTAIN_DARK}, transparent)`,
          clipPath: "polygon(0% 100%, 100% 100%, 100% 60%, 75% 50%, 50% 45%, 25% 50%, 0% 60%)",
          opacity: mistOpacity,
        }}
      />

      {/* Additional mist layers */}
      <div
        style={{
          position: "absolute",
          bottom: `${MOUNTAIN_HEIGHT * 0.3}px`,
          left: 0,
          width: "100%",
          height: `${MOUNTAIN_HEIGHT * 0.4}px`,
          background: `radial-gradient(circle at 20% 50%, ${COLOR_MIST_TEAL}20, transparent 70%)`,
          opacity: mistOpacity * 0.6,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: `${MOUNTAIN_HEIGHT * 0.5}px`,
          left: "30%",
          width: "40%",
          height: `${MOUNTAIN_HEIGHT * 0.3}px`,
          background: `radial-gradient(circle at 50% 50%, ${COLOR_MIST_TEAL}30, transparent 80%)`,
          opacity: mistOpacity * 0.4,
        }}
      />

      {/* Glowing ancient script */}
      <div
        style={{
          position: "absolute",
          top: `${SCRIPT_Y + scriptFloat}px`,
          left: "50%",
          transform: `translateX(-50%) scale(${scriptScale})`,
          fontSize: `${Math.max(48, width * 0.04)}px`,
          fontFamily: "'Noto Serif SC', serif",
          color: COLOR_SCRIPT_GOLD,
          textShadow: `0 0 20px ${COLOR_SCRIPT_GOLD}aa, 0 0 40px ${COLOR_SCRIPT_GOLD}80`,
          letterSpacing: "4px",
          opacity: interpolate(
            frame,
            [0, 60, DURATION - 60, DURATION],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
          zIndex: 10,
        }}
      >
        仙 霞
      </div>

      {/* Silhouetted figure */}
      <div
        style={{
          position: "absolute",
          bottom: `${FIGURE_Y}px`,
          left: "50%",
          transform: `translateX(-50%) scale(${figureEntrance})`,
          width: `${width * 0.1}px`,
          height: `${FIGURE_HEIGHT}px`,
          backgroundColor: COLOR_SHADOW,
          borderRadius: "50% 50% 0 0",
          opacity: figureOpacity * 0.95,
          boxShadow: `0 0 60px ${COLOR_SHADOW}cc`,
          zIndex: 20,
        }}
      />

      {/* Figure details (robe folds) */}
      <div
        style={{
          position: "absolute",
          bottom: `${FIGURE_Y + 20}px`,
          left: "50%",
          transform: `translateX(-50%) scale(${figureEntrance})`,
          width: `${width * 0.08}px`,
          height: `${FIGURE_HEIGHT * 0.6}px`,
          backgroundColor: COLOR_SHADOW,
          clipPath: "polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)",
          opacity: figureOpacity * 0.8,
          zIndex: 15,
        }}
      />

      {/* Cinematic teal/orange color grade overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `radial-gradient(circle at 50% 50%, rgba(255, 152, 0, 0.15), transparent 70%), 
                       radial-gradient(circle at 30% 30%, rgba(33, 150, 243, 0.2), transparent 80%)`,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />

      {/* Film grain effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a' color-interpolation-filters='sRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)'/%3E%3C/svg%3E")`,
          opacity: grainIntensity,
          pointerEvents: "none",
        }}
      />

      {/* Dynamic zoom indicator (subtle) */}
      {frame >= ZOOM_START_FRAME && frame <= ZOOM_END_FRAME && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "20px",
            height: "20px",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.4,
            zIndex: 100,
          }}
        />
      )}

      {/* Subtle lens flare */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          right: "15%",
          width: "120px",
          height: "120px",
          background: `radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)`,
          borderRadius: "50%",
          opacity: interpolate(
            frame,
            [0, 100, DURATION],
            [0.1, 0.3, 0.1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
          zIndex: 5,
        }}
      />
    </AbsoluteFill>
  );
};