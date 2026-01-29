import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { useState, useEffect } from "react";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Constants
  const BACKGROUND_COLOR = "#f5f5f5";
  const COLOR_BAR_Q1 = "#6366f1";
  const COLOR_BAR_Q2 = "#8b5cf6";
  const COLOR_BAR_Q3 = "#a78bfa";
  const COLOR_BAR_Q4 = "#c084fc";
  const COLOR_AXIS = "#374151";
  const COLOR_LABEL = "#1f2937";
  const FONT_FAMILY = "Inter, sans-serif";
  const PADDING = 80;
  const BAR_WIDTH = Math.max(60, Math.round(width * 0.08));
  const BAR_GAP = Math.max(40, Math.round(width * 0.06));
  const MAX_DATA_VALUE = 210; // Q4
  const CHART_HEIGHT = height - PADDING * 2 - 120;
  const Y_SCALE = CHART_HEIGHT / MAX_DATA_VALUE;
  const ANIMATION_DURATION = 60;

  // Data
  const DATA = [
    { label: "Q1", value: 85, color: COLOR_BAR_Q1 },
    { label: "Q2", value: 120, color: COLOR_BAR_Q2 },
    { label: "Q3", value: 150, color: COLOR_BAR_Q3 },
    { label: "Q4", value: 210, color: COLOR_BAR_Q4 },
  ];

  // Animation progress (0 to 1)
  const progress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  // Clamp progress between 0 and 1
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <AbsoluteFill style={{ backgroundColor: BACKGROUND_COLOR }}>
      {/* Chart container */}
      <div
        style={{
          position: "absolute",
          top: PADDING,
          left: PADDING,
          right: PADDING,
          bottom: PADDING + 60,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {/* Y-axis line */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: COLOR_AXIS,
          }}
        />

        {/* X-axis line */}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            right: 0,
            height: 2,
            backgroundColor: COLOR_AXIS,
          }}
        />

        {/* Bars */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: BAR_GAP,
            height: "100%",
            width: "100%",
            justifyContent: "center",
          }}
        >
          {DATA.map((item, i) => {
            const barHeight = item.value * Y_SCALE * clampedProgress;
            const delay = i * 8;
            const barProgress = spring({
              frame: frame - delay,
              fps,
              config: { damping: 15, stiffness: 120 },
            });
            const animatedBarHeight = item.value * Y_SCALE * Math.min(1, Math.max(0, barProgress));

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: BAR_WIDTH,
                }}
              >
                {/* Bar */}
                <div
                  style={{
                    width: BAR_WIDTH,
                    height: animatedBarHeight,
                    backgroundColor: item.color,
                    borderRadius: "8px 8px 0 0",
                    boxShadow: `0 4px 12px ${item.color}30`,
                    transition: "height 0.3s ease-out",
                  }}
                />
                {/* Value label above bar */}
                <div
                  style={{
                    marginTop: 12,
                    color: COLOR_LABEL,
                    fontSize: 24,
                    fontWeight: "600",
                    fontFamily: FONT_FAMILY,
                    whiteSpace: "nowrap",
                  }}
                >
                  ¥{item.value}K
                </div>
                {/* Quarter label below bar */}
                <div
                  style={{
                    marginTop: 8,
                    color: COLOR_AXIS,
                    fontSize: 22,
                    fontWeight: "500",
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Y-axis labels */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "0 16px",
            width: "auto",
          }}
        >
          {[0, 50, 100, 150, 200].map((val) => (
            <div
              key={val}
              style={{
                display: "flex",
                alignItems: "center",
                color: COLOR_AXIS,
                fontSize: 20,
                fontFamily: FONT_FAMILY,
                fontWeight: "500",
              }}
            >
              <div
                style={{
                  width: 24,
                  textAlign: "right",
                  marginRight: 8,
                }}
              >
                {val}
              </div>
              <div
                style={{
                  width: 4,
                  height: 4,
                  backgroundColor: COLOR_AXIS,
                  borderRadius: "50%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Y-axis title */}
        <div
          style={{
            position: "absolute",
            left: -PADDING,
            top: "50%",
            transform: "translateY(-50%) rotate(-90deg)",
            whiteSpace: "nowrap",
            color: COLOR_LABEL,
            fontSize: 24,
            fontWeight: "600",
            fontFamily: FONT_FAMILY,
          }}
        >
          Revenue (¥10K)
        </div>

        {/* X-axis title */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            color: COLOR_LABEL,
            fontSize: 24,
            fontWeight: "600",
            fontFamily: FONT_FAMILY,
          }}
        >
          Quarters
        </div>
      </div>
    </AbsoluteFill>
  );
};