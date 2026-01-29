import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const TEXT = "（转录已完成）";
  const FONT_SIZE = 60;
  const DURATION_FRAMES = 4.152 * 30; // Assuming 30fps
  const TYPING_DURATION_FRAMES = 0.3 * 30;
  const TOTAL_FRAMES = 125; // 4.152s * ~30fps ≈ 125 frames

  const typedChars = Math.min(
    Math.floor(interpolate(frame, [0, TYPING_DURATION_FRAMES], [0, TEXT.length], { extrapolateRight: "clamp" })),
    TEXT.length
  );
  const typedText = TEXT.slice(0, typedChars);

  return (
    <AbsoluteFill style={{
      backgroundColor: 'transparent',
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: 900 - 1080 / 2, // Adjust to position at y=900 in 1920x1080
      display: "flex",
      flexDirection: "column",
      height: "100vh",
    }}>
      <div style={{
        fontFamily: "Inter, sans-serif",
        fontSize: FONT_SIZE,
        color: "#ffffff",
        textAlign: "center",
        lineHeight: 1.2,
      }}>
        {typedText}
      </div>
    </AbsoluteFill>
  );
};