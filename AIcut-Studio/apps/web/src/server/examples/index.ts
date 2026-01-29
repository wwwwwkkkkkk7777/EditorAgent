export interface RemotionExample {
  id: string;
  name: string;
  description: string;
  code: string;
  durationInFrames: number;
  fps: number;
  category: "Text" | "Charts" | "Animation" | "Characters" | "Other";
}

export const histogramExample: RemotionExample = {
  id: "histogram",
  name: "Animated Histogram",
  description: "Bar chart with staggered spring animations",
  category: "Charts",
  durationInFrames: 120,
  fps: 30,
  code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Data and styling constants
  const DATA = [
    { label: "Mon", value: 65, color: "#6366f1" },
    { label: "Tue", value: 85, color: "#8b5cf6" },
    { label: "Wed", value: 45, color: "#a855f7" },
    { label: "Thu", value: 95, color: "#d946ef" },
    { label: "Fri", value: 75, color: "#ec4899" },
  ];
  const MAX_VALUE = Math.max(...DATA.map((d) => d.value));
  const BAR_WIDTH = 80;
  const STAGGER_DELAY = 8;

  return (
    <AbsoluteFill style={{
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "flex-end",
      padding: 60,
      paddingBottom: 120,
    }}>
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 24,
        height: 400,
        width: "100%",
        justifyContent: "center",
      }}>
        {DATA.map((item, i) => {
          const delay = i * STAGGER_DELAY;
          const progress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 15, stiffness: 100 },
          });

          const height = Math.max(1, (item.value / MAX_VALUE) * 300 * progress);

          return (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                width: BAR_WIDTH,
                height,
                backgroundColor: item.color,
                borderRadius: 12,
                boxShadow: \`0 0 20px \${item.color}50\`,
              }} />
              <div style={{
                color: "#888",
                fontSize: 16,
                marginTop: 12,
                fontFamily: "Inter, sans-serif",
              }}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};`,
};

export const cuteDogExample: RemotionExample = {
  id: "cute-dog",
  name: "Cute Cartoon Dog",
  description: "Animated cartoon dog with wagging tail and blinking eyes",
  category: "Characters",
  durationInFrames: 150,
  fps: 30,
  code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation values
  const entrance = spring({ frame, fps, config: { damping: 12 } });
  const tailWag = Math.sin(frame * 0.3) * 25;
  const breathe = Math.sin(frame * 0.08) * 0.02 + 1;
  
  // Eye blink every ~3 seconds
  const blinkProgress = interpolate(
    frame % 90,
    [0, 5, 10, 90],
    [1, 0, 1, 1],
    { extrapolateRight: "clamp" }
  );

  // Colors
  const BODY_COLOR = "#F5D6A8";
  const DARK_COLOR = "#D4A574";
  const EYE_COLOR = "#333333";
  const NOSE_COLOR = "#1a1a1a";
  const CHEEK_COLOR = "#FFB6C1";

  return (
    <AbsoluteFill style={{
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <div style={{
        transform: \`scale(\${entrance * breathe})\`,
        position: "relative",
      }}>
        {/* Body */}
        <div style={{
          width: 220,
          height: 160,
          backgroundColor: BODY_COLOR,
          borderRadius: "50%",
          position: "relative",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        }}>
          {/* Head */}
          <div style={{
            position: "absolute",
            top: -90,
            left: "50%",
            transform: "translateX(-50%)",
            width: 140,
            height: 120,
            backgroundColor: BODY_COLOR,
            borderRadius: "50%",
          }}>
            {/* Left Ear */}
            <div style={{
              position: "absolute",
              top: -25,
              left: 10,
              width: 35,
              height: 50,
              backgroundColor: DARK_COLOR,
              borderRadius: "50% 50% 0 0",
              transform: "rotate(-15deg)",
            }} />
            {/* Right Ear */}
            <div style={{
              position: "absolute",
              top: -25,
              right: 10,
              width: 35,
              height: 50,
              backgroundColor: DARK_COLOR,
              borderRadius: "50% 50% 0 0",
              transform: "rotate(15deg)",
            }} />
            
            {/* Left Eye */}
            <div style={{
              position: "absolute",
              top: 35,
              left: 30,
              width: 24,
              height: 24 * blinkProgress,
              backgroundColor: EYE_COLOR,
              borderRadius: "50%",
            }} />
            {/* Right Eye */}
            <div style={{
              position: "absolute",
              top: 35,
              right: 30,
              width: 24,
              height: 24 * blinkProgress,
              backgroundColor: EYE_COLOR,
              borderRadius: "50%",
            }} />
            
            {/* Nose */}
            <div style={{
              position: "absolute",
              top: 65,
              left: "50%",
              transform: "translateX(-50%)",
              width: 18,
              height: 12,
              backgroundColor: NOSE_COLOR,
              borderRadius: "50%",
            }} />
            
            {/* Mouth */}
            <div style={{
              position: "absolute",
              top: 78,
              left: "50%",
              transform: "translateX(-50%)",
              width: 30,
              height: 15,
              borderBottom: "3px solid #333",
              borderRadius: "0 0 50% 50%",
            }} />
            
            {/* Left Cheek */}
            <div style={{
              position: "absolute",
              top: 55,
              left: 15,
              width: 20,
              height: 12,
              backgroundColor: CHEEK_COLOR,
              borderRadius: "50%",
              opacity: 0.6,
            }} />
            {/* Right Cheek */}
            <div style={{
              position: "absolute",
              top: 55,
              right: 15,
              width: 20,
              height: 12,
              backgroundColor: CHEEK_COLOR,
              borderRadius: "50%",
              opacity: 0.6,
            }} />
          </div>
          
          {/* Tail */}
          <div style={{
            position: "absolute",
            right: -35,
            top: 40,
            width: 50,
            height: 18,
            backgroundColor: DARK_COLOR,
            borderRadius: "50%",
            transform: \`rotate(\${tailWag}deg)\`,
            transformOrigin: "left center",
          }} />
          
          {/* Front Legs */}
          <div style={{
            position: "absolute",
            bottom: -30,
            left: 40,
            width: 30,
            height: 40,
            backgroundColor: BODY_COLOR,
            borderRadius: "0 0 15px 15px",
          }} />
          <div style={{
            position: "absolute",
            bottom: -30,
            right: 40,
            width: 30,
            height: 40,
            backgroundColor: BODY_COLOR,
            borderRadius: "0 0 15px 15px",
          }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};`,
};

export const typewriterExample: RemotionExample = {
  id: "typewriter",
  name: "Typewriter Text",
  description: "Text appearing with typewriter effect and blinking cursor",
  category: "Text",
  durationInFrames: 120,
  fps: 30,
  code: `import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();

  // Text constants
  const FULL_TEXT = "Hello World";
  const CHARS_PER_FRAME = 0.15;
  const CURSOR_BLINK_FRAMES = 20;
  
  // Calculate typed characters
  const typedChars = Math.min(
    Math.floor(frame * CHARS_PER_FRAME),
    FULL_TEXT.length
  );
  const typedText = FULL_TEXT.slice(0, typedChars);
  const isTypingDone = typedChars >= FULL_TEXT.length;
  
  // Cursor blink (only after typing is done)
  const caretOpacity = isTypingDone
    ? interpolate(
        frame % CURSOR_BLINK_FRAMES,
        [0, CURSOR_BLINK_FRAMES / 2, CURSOR_BLINK_FRAMES],
        [1, 0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 1;

  return (
    <AbsoluteFill style={{
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <div style={{
        fontFamily: "monospace",
        fontSize: 64,
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
      }}>
        <span>{typedText}</span>
        <span style={{
          opacity: caretOpacity,
          marginLeft: 2,
          color: "#6366f1",
        }}>|</span>
      </div>
    </AbsoluteFill>
  );
};`,
};

export const bouncingShapesExample: RemotionExample = {
  id: "bouncing-shapes",
  name: "Bouncing Shapes",
  description: "Colorful shapes with spring animations",
  category: "Animation",
  durationInFrames: 120,
  fps: 30,
  code: `import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const shapes = [
    { color: "#6366f1", size: 80, x: 200, y: 200, delay: 0 },
    { color: "#ec4899", size: 60, x: 400, y: 300, delay: 5 },
    { color: "#22c55e", size: 100, x: 600, y: 250, delay: 10 },
    { color: "#f59e0b", size: 70, x: 300, y: 400, delay: 15 },
    { color: "#8b5cf6", size: 90, x: 500, y: 350, delay: 20 },
  ];

  return (
    <AbsoluteFill style={{
      backgroundColor: "transparent",
    }}>
      {shapes.map((shape, i) => {
        const scale = spring({
          frame: frame - shape.delay,
          fps,
          config: { damping: 8, stiffness: 100 },
        });
        
        const rotation = (frame - shape.delay) * 2;
        
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: shape.x,
              top: shape.y,
              width: shape.size,
              height: shape.size,
              backgroundColor: shape.color,
              borderRadius: i % 2 === 0 ? "50%" : "20%",
              transform: \`scale(\${scale}) rotate(\${rotation}deg)\`,
              boxShadow: \`0 0 30px \${shape.color}80\`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};`,
};

export const examples: RemotionExample[] = [
  histogramExample,
  cuteDogExample,
  typewriterExample,
  bouncingShapesExample,
];

export function getExampleById(id: string): RemotionExample | undefined {
  return examples.find((e) => e.id === id);
}

export function getExamplesByCategory(category: RemotionExample["category"]): RemotionExample[] {
  return examples.filter((e) => e.category === category);
}

export function getExampleCode(id: string): string {
  const example = getExampleById(id);
  return example?.code || "";
}
