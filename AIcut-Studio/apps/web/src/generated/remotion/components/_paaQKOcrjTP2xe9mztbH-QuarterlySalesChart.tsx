import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";

export const QuarterlySalesChart = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Constants
  const COLOR_BACKGROUND = "transparent";
  const COLOR_Q1 = "#3b82f6"; // blue
  const COLOR_Q2 = "#f97316"; // orange
  const COLOR_Q3 = "#10b981"; // green
  const COLOR_Q4 = "#8b5cf6"; // purple
  const COLOR_LABEL = "#ffffff";
  const COLOR_QUARTER_LABEL = "#6b7280";
  const FONT_FAMILY = "Inter, sans-serif";
  
  const CHART_DURATION = 3.5;
  const TOTAL_FRAMES = Math.round(fps * CHART_DURATION);
  
  // Data
  const DATA = [
    { quarter: "Q1", value: 1200000, color: COLOR_Q1 },
    { quarter: "Q2", value: 1800000, color: COLOR_Q2 },
    { quarter: "Q3", value: 1500000, color: COLOR_Q3 },
    { quarter: "Q4", value: 2400000, color: COLOR_Q4 },
  ];
  
  const MAX_VALUE = Math.max(...DATA.map(d => d.value));
  const BAR_WIDTH = 120;
  const BAR_GAP = 60;
  const CHART_HEIGHT = 500;
  const PADDING_TOP = 120;
  const PADDING_BOTTOM = 100;
  const PADDING_SIDES = 120;
  
  // Calculate chart dimensions
  const totalBarWidth = (BAR_WIDTH * DATA.length) + (BAR_GAP * (DATA.length - 1));
  const chartWidth = Math.max(1200, totalBarWidth + PADDING_SIDES * 2);
  
  // Animation timing
  const STAGGER_DELAY = 12;
  
  return (
    <AbsoluteFill style={{
      backgroundColor: COLOR_BACKGROUND,
      padding: `${PADDING_TOP}px ${PADDING_SIDES}px ${PADDING_BOTTOM}px ${PADDING_SIDES}px`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "center",
      fontFamily: FONT_FAMILY,
    }}>
      {/* Chart container */}
      <div style={{
        width: "100%",
        height: CHART_HEIGHT,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: BAR_GAP,
      }}>
        {DATA.map((item, i) => {
          const delay = i * STAGGER_DELAY;
          const progress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 15, stiffness: 120 },
          });

          // Calculate bar height proportionally
          const barHeight = Math.max(40, (item.value / MAX_VALUE) * (CHART_HEIGHT - 60) * progress);
          
          // Format value as ¥X.XM
          const formattedValue = `¥${(item.value / 1000000).toFixed(1)}M`;
          
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
                  height: barHeight,
                  backgroundColor: item.color,
                  borderRadius: "8px 8px 0 0",
                  boxShadow: `0 12px 24px ${item.color}40`,
                  transform: `translateY(${CHART_HEIGHT - barHeight}px)`,
                  transition: "transform 0.3s ease-out",
                }}
              />
              
              {/* Value label above bar */}
              <div 
                style={{
                  color: COLOR_LABEL,
                  fontSize: 28,
                  fontWeight: "600",
                  marginTop: 16,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  transform: `translateY(-${barHeight + 16}px)`,
                  opacity: progress,
                }}
              >
                {formattedValue}
              </div>
              
              {/* Quarter label below bar */}
              <div 
                style={{
                  color: COLOR_QUARTER_LABEL,
                  fontSize: 24,
                  fontWeight: "500",
                  marginTop: 24,
                  opacity: interpolate(
                    frame - delay,
                    [0, 15],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  ),
                }}
              >
                {item.quarter}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Title */}
      <div 
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 42,
          fontWeight: "700",
          color: "#1f2937",
          textShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        Quarterly Sales Performance
      </div>
    </AbsoluteFill>
  );
};