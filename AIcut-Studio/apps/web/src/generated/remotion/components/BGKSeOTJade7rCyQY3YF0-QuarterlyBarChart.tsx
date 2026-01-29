import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring } from "remotion";
import { Rect, Text } from "@remotion/shapes";

export const QuarterlyBarChart = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Constants
  const BACKGROUND_COLOR = "#F8FAFC";
  const BAR_COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"];
  const TEXT_COLOR = "#1E293B";
  const SHADOW_COLOR = "rgba(0, 0, 0, 0.08)";
  const BAR_WIDTH = Math.max(80, Math.round(width * 0.08));
  const BAR_GAP = Math.max(40, Math.round(width * 0.06));
  const CHART_HEIGHT = Math.max(400, Math.round(height * 0.5));
  const MAX_VALUE = 360; // Q4 value in millions
  const PADDING_TOP = Math.max(120, Math.round(height * 0.15));
  const PADDING_BOTTOM = Math.max(80, Math.round(height * 0.1));
  const PADDING_SIDES = Math.max(60, Math.round(width * 0.05));
  const TITLE_FONT_SIZE = Math.max(48, Math.round(width * 0.03));
  const LABEL_FONT_SIZE = Math.max(28, Math.round(width * 0.02));
  const VALUE_FONT_SIZE = Math.max(32, Math.round(width * 0.022));
  const ANIMATION_DURATION = 90;

  // Data points (in CNY millions)
  const data = [
    { quarter: "Q1", value: 240, color: BAR_COLORS[0] },
    { quarter: "Q2", value: 310, color: BAR_COLORS[1] },
    { quarter: "Q3", value: 285, color: BAR_COLORS[2] },
    { quarter: "Q4", value: 360, color: BAR_COLORS[3] }
  ];

  // Calculate chart dimensions
  const chartWidth = width - PADDING_SIDES * 2;
  const barTotalWidth = BAR_WIDTH * data.length + BAR_GAP * (data.length - 1);
  const startX = (width - barTotalWidth) / 2;
  const yAxisTop = PADDING_TOP;
  const yAxisBottom = height - PADDING_BOTTOM;
  const yAxisHeight = yAxisBottom - yAxisTop;

  // Animation progress (0 to 1)
  const progress = Math.min(1, frame / ANIMATION_DURATION);

  return (
    <AbsoluteFill style={{ backgroundColor: BACKGROUND_COLOR, fontFamily: 'Inter, sans-serif' }}>
      {/* Title */}
      <Text
        text="Quarterly Sales Performance"
        x={width / 2}
        y={PADDING_TOP / 2}
        fontSize={TITLE_FONT_SIZE}
        fill={TEXT_COLOR}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          textShadow: `0 2px 8px ${SHADOW_COLOR}`,
          fontWeight: 700,
          letterSpacing: "-0.02em"
        }}
      />

      {/* Bars */}
      {data.map((item, index) => {
        const barX = startX + index * (BAR_WIDTH + BAR_GAP);
        const barHeight = interpolate(
          progress,
          [0, 1],
          [0, (item.value / MAX_VALUE) * yAxisHeight],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        
        const barY = yAxisBottom - barHeight;
        
        // Spring animation for upward growth
        const springValue = spring({
          frame: frame - index * 5,
          fps,
          config: {
            damping: 20,
            stiffness: 150,
            mass: 1
          }
        });

        const animatedBarHeight = barHeight * springValue;
        const animatedBarY = yAxisBottom - animatedBarHeight;

        return (
          <g key={index}>
            {/* Bar with soft shadow */}
            <Rect
              x={barX}
              y={animatedBarY}
              width={BAR_WIDTH}
              height={animatedBarHeight}
              fill={item.color}
              style={{
                filter: `drop-shadow(0 8px 20px ${SHADOW_COLOR})`,
                borderRadius: 8
              }}
            />
            
            {/* Quarter label */}
            <Text
              text={item.quarter}
              x={barX + BAR_WIDTH / 2}
              y={yAxisBottom + 40}
              fontSize={LABEL_FONT_SIZE}
              fill={TEXT_COLOR}
              textAnchor="middle"
              dominantBaseline="hanging"
              style={{
                textShadow: `0 1px 3px ${SHADOW_COLOR}`,
                fontWeight: 600
              }}
            />
            
            {/* Value label */}
            <Text
              text={`${item.value}万`}
              x={barX + BAR_WIDTH / 2}
              y={animatedBarY - 20}
              fontSize={VALUE_FONT_SIZE}
              fill={TEXT_COLOR}
              textAnchor="middle"
              dominantBaseline="baseline"
              style={{
                textShadow: `0 1px 3px ${SHADOW_COLOR}`,
                fontWeight: 700
              }}
            />
          </g>
        );
      })}
      
      {/* Subtle horizontal reference line at top */}
      <Rect
        x={PADDING_SIDES}
        y={PADDING_TOP}
        width={width - PADDING_SIDES * 2}
        height={1}
        fill="#E2E8F0"
      />
    </AbsoluteFill>
  );
};