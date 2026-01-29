import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring } from "remotion";
import { Circle, Rect } from "@remotion/shapes";

export const PuppyAnimation = () => {
	const frame = useCurrentFrame();
	const { width, height, fps } = useVideoConfig();

	// COLORS
	const COLOR_FUR_LIGHT = "#f8f3e6";
	const COLOR_FUR_DARK = "#e6d9c2";
	const COLOR_EYES = "#4a90e2";
	const COLOR_HIGHLIGHT = "#ffffff";
	const COLOR_NOSE = "#8b4513";
	const COLOR_TONGUE = "#ff9e9e";

	// TEXT & LAYOUT
	const PADDING = 80;
	const PUPPY_SCALE_BASE = 0.7;
	const HEAD_RADIUS = Math.max(120, Math.round(width * 0.18));
	const EYE_RADIUS = Math.max(18, Math.round(HEAD_RADIUS * 0.15));
	const NOSE_RADIUS = Math.max(12, Math.round(HEAD_RADIUS * 0.1));
	const TONGUE_WIDTH = Math.max(40, Math.round(HEAD_RADIUS * 0.33));
	const TONGUE_HEIGHT = Math.max(16, Math.round(HEAD_RADIUS * 0.13));

	// TIMING
	const FLOAT_CYCLE_FRAMES = 60;
	const TAIL_WAG_SPEED = 0.08;
	const HEAD_TILT_AMPLITUDE = 8; // degrees
	const FLOAT_AMPLITUDE = 12; // pixels

	// ANIMATION VALUES
	const floatProgress = (frame % FLOAT_CYCLE_FRAMES) / FLOAT_CYCLE_FRAMES;
	const floatY = interpolate(floatProgress, [0, 0.5, 1], [-FLOAT_AMPLITUDE, FLOAT_AMPLITUDE, -FLOAT_AMPLITUDE], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const headTilt = interpolate(floatProgress, [0, 0.5, 1], [-HEAD_TILT_AMPLITUDE, HEAD_TILT_AMPLITUDE, -HEAD_TILT_AMPLITUDE], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const tailWagAngle = Math.sin(frame * TAIL_WAG_SPEED) * 12;

	// Tail position relative to body
	const tailBaseX = 0;
	const tailBaseY = Math.max(60, Math.round(HEAD_RADIUS * 0.75));

	// Eye positions
	const eyeOffsetX = HEAD_RADIUS * 0.35;
	const eyeOffsetY = HEAD_RADIUS * 0.2;

	// Sparkle animation
	const sparkleOpacity = spring({
		fps,
		frame: frame % 30,
		config: {
			damping: 20,
			mass: 1,
			stiffness: 120,
		},
	});

	return (
		<AbsoluteFill style={{ backgroundColor: "transparent" }}>
			{/* Main puppy body (head + ears) */}
			<g
				transform={`translate(${width / 2}, ${height / 2 + floatY}) scale(${PUPPY_SCALE_BASE}) rotate(${headTilt})`}
			>
				{/* Head base */}
				<Rect
					x={-HEAD_RADIUS}
					y={-HEAD_RADIUS}
					width={HEAD_RADIUS * 2}
					height={HEAD_RADIUS * 2}
					rx={HEAD_RADIUS}
					ry={HEAD_RADIUS}
					fill={COLOR_FUR_LIGHT}
				/>

				{/* Left ear */}
				<Rect
					x={-HEAD_RADIUS * 1.3}
					y={-HEAD_RADIUS * 1.2}
					width={HEAD_RADIUS * 0.7}
					height={HEAD_RADIUS * 1.1}
					rx={HEAD_RADIUS * 0.35}
					ry={HEAD_RADIUS * 0.55}
					fill={COLOR_FUR_DARK}
					transform={`rotate(-25 ${-HEAD_RADIUS * 1.3 + HEAD_RADIUS * 0.35} ${-HEAD_RADIUS * 1.2 + HEAD_RADIUS * 0.55})`}
				/>
				{/* Right ear */}
				<Rect
					x={HEAD_RADIUS * 0.6}
					y={-HEAD_RADIUS * 1.2}
					width={HEAD_RADIUS * 0.7}
					height={HEAD_RADIUS * 1.1}
					rx={HEAD_RADIUS * 0.35}
					ry={HEAD_RADIUS * 0.55}
					fill={COLOR_FUR_DARK}
					transform={`rotate(25 ${HEAD_RADIUS * 0.6 + HEAD_RADIUS * 0.35} ${-HEAD_RADIUS * 1.2 + HEAD_RADIUS * 0.55})`}
				/>

				{/* Left eye */}
				<g transform={`translate(${-eyeOffsetX}, ${-eyeOffsetY})`}>
					<Circle cx={0} cy={0} r={EYE_RADIUS} fill={COLOR_EYES} />
					<Circle cx={-EYE_RADIUS * 0.3} cy={-EYE_RADIUS * 0.3} r={EYE_RADIUS * 0.25} fill={COLOR_HIGHLIGHT} />
				</g>

				{/* Right eye */}
				<g transform={`translate(${eyeOffsetX}, ${-eyeOffsetY})`}>
					<Circle cx={0} cy={0} r={EYE_RADIUS} fill={COLOR_EYES} />
					<Circle cx={-EYE_RADIUS * 0.3} cy={-EYE_RADIUS * 0.3} r={EYE_RADIUS * 0.25} fill={COLOR_HIGHLIGHT} />
				</g>

				{/* Nose */}
				<Rect
					x={-NOSE_RADIUS}
					y={HEAD_RADIUS * 0.2}
					width={NOSE_RADIUS * 2}
					height={NOSE_RADIUS * 1.4}
					rx={NOSE_RADIUS}
					ry={NOSE_RADIUS * 0.7}
					fill={COLOR_NOSE}
				/>

				{/* Tongue */}
				<Rect
					x={-TONGUE_WIDTH / 2}
					y={HEAD_RADIUS * 0.5}
					width={TONGUE_WIDTH}
					height={TONGUE_HEIGHT}
					rx={TONGUE_HEIGHT / 2}
					ry={TONGUE_HEIGHT / 2}
					fill={COLOR_TONGUE}
				/>

				{/* Tail */}
				<g transform={`translate(${tailBaseX}, ${tailBaseY}) rotate(${tailWagAngle})`}>
					<Rect
						x={-4}
						y={0}
						width={8}
						height={HEAD_RADIUS * 0.9}
						rx={4}
						ry={4}
						fill={COLOR_FUR_DARK}
					/>
					{/* Tail tip */}
					<Rect
						x={-6}
						y={HEAD_RADIUS * 0.9 - 6}
						width={12}
						height={12}
						rx={6}
						ry={6}
						fill={COLOR_FUR_LIGHT}
					/>
				</g>

				{/* Sparkles in eyes (subtle) */}
				<g opacity={sparkleOpacity * 0.7}>
					<Circle cx={-eyeOffsetX - EYE_RADIUS * 0.3} cy={-eyeOffsetY - EYE_RADIUS * 0.3} r={EYE_RADIUS * 0.08} fill={COLOR_HIGHLIGHT} />
					<Circle cx={eyeOffsetX - EYE_RADIUS * 0.3} cy={-eyeOffsetY - EYE_RADIUS * 0.3} r={EYE_RADIUS * 0.08} fill={COLOR_HIGHLIGHT} />
				</g>
			</g>
		</AbsoluteFill>
	);
};