import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Data constants
  const DATA = [
    { label: "Q1", value: 800000, color: "#4f46e5" },
    { label: "Q2", value: 1200000, color: "#7c3aed" },
    { label: "Q3", value: 1500000, color: "#a855f7" },
    { label: "Q4", value: 1800000, color: "#d946ef" },
  ];
  const MAX_VALUE = Math.max(...DATA.map((d) => d.value));
  const BAR_WIDTH = 120;
  const BAR_GAP = 60;
  const CHART_HEIGHT = 500;
  const PADDING = 120;
  const LABEL_SIZE = 32;
  const VALUE_LABEL_SIZE = 24;

  // Format currency values
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `¥${(value / 1000000).toFixed(1)}M`;
    }
    return `¥${(value / 1000).toFixed(0)}K`;
  };

  return (
    <AbsoluteFill style={{
      backgroundColor: "transparent",
      padding: PADDING,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    }}>
      {/* Chart container */}
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: BAR_GAP,
        height: CHART_HEIGHT,
        width: "100%",
        maxWidth: 1200,
        justifyContent: "center",
      }}>
        {DATA.map((item, i) => {
          const delay = i * 12;
          const progress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 12, stiffness: 100 },
          });

          const height = Math.max(40, (item.value / MAX_VALUE) * (CHART_HEIGHT - 80) * progress);
          const barY = CHART_HEIGHT - height;

          return (
            <div key={i} style={{ textAlign: "center", position: "relative" }}>
              {/* Bar */}
              <div style={{
                width: BAR_WIDTH,
                height: height,
                backgroundColor: item.color,
                borderRadius: 8,
                boxShadow: `0 8px 24px ${item.color}30`,
                transform: `translateY(${barY}px)`,
                transition: "transform 0.3s ease-out",
              }} />
              
              {/* Label */}
              <div style={{
                color: "#ffffff",
                fontSize: LABEL_SIZE,
                marginTop: 24,
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                textShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}>
                {item.label}
              </div>
              
              {/* Value label */}
              <div style={{
                color: "#ffffff",
                fontSize: VALUE_LABEL_SIZE,
                marginTop: 12,
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                textShadow: "0 1px 2px rgba(0,0,0,0.2)",
              }}>
                {formatCurrency(item.value)}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};