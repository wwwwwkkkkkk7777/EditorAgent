import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring } from "remotion";
import { Circle, Rect, Triangle, Star, Ellipse, Pie } from "@remotion/shapes";

export const PuppyAnimation = () => {
	const frame = useCurrentFrame();
	const { width, height, fps } = useVideoConfig();

	// COLORS
	const COLOR_BODY = "#FFD1DC"; // soft pink
	const COLOR_EARS = "#FFB6C1"; // lighter pink
	const COLOR_NOSE = "#FF69B4"; // pink nose
	const COLOR_EYES_WHITE = "#FFFFFF";
	const COLOR_EYES_IRIS = "#4A90E2";
	const COLOR_EYES_PUPIL = "#2C3E50";
	const COLOR_TAIL = "#FFB6C1";
	const COLOR_SHADOW = "rgba(0, 0, 0, 0.15)";

	// LAYOUT
	const PUPPY_Y = 650;
	const BASE_SCALE = 0.8;
	const EYE_SPARKLE_SIZE = 8;
	const EAR_FLUFF_RADIUS = 12;
	const TAIL_WAG_SPEED = 3.5;
	const BOUNCE_FREQ = 2.2;
	const PULSE_FREQ = 4;

	// ANIMATION TIMING
	const bounceProgress = (frame / fps) * BOUNCE_FREQ;
	const tailWagProgress = (frame / fps) * TAIL_WAG_SPEED;
	const pulseProgress = (frame / fps) * PULSE_FREQ;

	// BOUNCE MOTION (subtle vertical bob)
	const bounceOffset = spring({
		frame,
		fps,
		config: {
			damping: 25,
			stiffness: 120,
			mass: 1,
		},
		from: 0,
		to: Math.sin(bounceProgress * Math.PI * 2) * 8,
	});

	// PULSE SCALE (gentle breathing effect)
	const pulseScale = 1 + Math.sin(pulseProgress * Math.PI * 2) * 0.03;

	// TAIL WAG (smooth oscillation)
	const tailAngle = Math.sin(tailWagProgress * Math.PI * 2) * 0.4;

	// EAR FLUTTER (subtle independent motion)
	const leftEarOffset = Math.sin((tailWagProgress + 0.3) * Math.PI * 2) * 3;
	const rightEarOffset = Math.sin((tailWagProgress + 0.7) * Math.PI * 2) * 3;

	// EYE SPARKLE TWINKLE (randomized per eye)
	const sparklePhaseLeft = (frame / fps) * 6.7;
	const sparklePhaseRight = (frame / fps) * 7.3;
	const sparkleOpacityLeft = 0.7 + Math.sin(sparklePhaseLeft * Math.PI * 2) * 0.3;
	const sparkleOpacityRight = 0.7 + Math.sin(sparklePhaseRight * Math.PI * 2) * 0.3;

	// POSITION & SCALE
	const finalScale = BASE_SCALE * pulseScale;
	const finalY = PUPPY_Y + bounceOffset;

	// EYE POSITIONS
	const eyeXOffset = width * 0.08;
	const eyeYOffset = height * 0.06;
	const eyeBaseXLeft = width / 2 - eyeXOffset;
	const eyeBaseXRight = width / 2 + eyeXOffset;
	const eyeBaseY = finalY - height * 0.12;

	// EAR BASE POSITIONS
	const earBaseY = finalY - height * 0.2;
	const earBaseXLeft = width / 2 - width * 0.12;
	const earBaseXRight = width / 2 + width * 0.12;
	const earSize = width * 0.14;

	// NOSE POSITION
	const noseX = width / 2;
	const noseY = finalY - height * 0.08;

	// TAIL BASE
	const tailBaseX = width / 2 + width * 0.08;
	const tailBaseY = finalY + height * 0.05;

	// TAIL END (calculated via rotation)
	const tailLength = width * 0.18;
	const tailEndX = tailBaseX + Math.sin(tailAngle) * tailLength;
	const tailEndY = tailBaseY - Math.cos(tailAngle) * tailLength;

	// SHADOW OFFSET
	const shadowX = width / 2;
	const shadowY = finalY + height * 0.03;

	return (
		<AbsoluteFill style={{ backgroundColor: "transparent" }}>
			{/* Soft drop shadow */}
			<Rect
				x={shadowX - width * 0.18}
				y={shadowY}
				width={width * 0.36}
				height={height * 0.02}
				radius={height * 0.01}
				fill={COLOR_SHADOW}
				style={{
					filter: "blur(8px)",
				}}
			/>

			{/* Puppy body (rounded oval) */}
			<Ellipse
				cx={width / 2}
				cy={finalY}
				rx={width * 0.16}
				ry={height * 0.12}
				fill={COLOR_BODY}
				scale={finalScale}
			/>

			{/* Left ear */}
			<Ellipse
				cx={earBaseXLeft}
				cy={earBaseY + leftEarOffset}
				rx={earSize * 0.6}
				ry={earSize * 0.8}
				fill={COLOR_EARS}
				rotation={-0.3}
				scale={finalScale}
			/>
			{/* Left ear inner */}
			<Ellipse
				cx={earBaseXLeft}
				cy={earBaseY + leftEarOffset}
				rx={earSize * 0.3}
				ry={earSize * 0.4}
				fill="#FFC0CB"
				rotation={-0.3}
				scale={finalScale}
			/>
			{/* Left ear fluff */}
			<Circle
				cx={earBaseXLeft - earSize * 0.2}
				cy={earBaseY + leftEarOffset - earSize * 0.3}
				r={EAR_FLUFF_RADIUS}
				fill={COLOR_EARS}
				scale={finalScale}
			/>
			<Circle
				cx={earBaseXLeft + earSize * 0.2}
				cy={earBaseY + leftEarOffset - earSize * 0.3}
				r={EAR_FLUFF_RADIUS}
				fill={COLOR_EARS}
				scale={finalScale}
			/>

			{/* Right ear */}
			<Ellipse
				cx={earBaseXRight}
				cy={earBaseY + rightEarOffset}
				rx={earSize * 0.6}
				ry={earSize * 0.8}
				fill={COLOR_EARS}
				rotation={0.3}
				scale={finalScale}
			/>
			{/* Right ear inner */}
			<Ellipse
				cx={earBaseXRight}
				cy={earBaseY + rightEarOffset}
				rx={earSize * 0.3}
				ry={earSize * 0.4}
				fill="#FFC0CB"
				rotation={0.3}
				scale={finalScale}
			/>
			{/* Right ear fluff */}
			<Circle
				cx={earBaseXRight - earSize * 0.2}
				cy={earBaseY + rightEarOffset - earSize * 0.3}
				r={EAR_FLUFF_RADIUS}
				fill={COLOR_EARS}
				scale={finalScale}
			/>
			<Circle
				cx={earBaseXRight + earSize * 0.2}
				cy={earBaseY + rightEarOffset - earSize * 0.3}
				r={EAR_FLUFF_RADIUS}
				fill={COLOR_EARS}
				scale={finalScale}
			/>

			{/* Eyes */}
			{/* Left eye white */}
			<Ellipse
				cx={eyeBaseXLeft}
				cy={eyeBaseY}
				rx={width * 0.035}
				ry={width * 0.045}
				fill={COLOR_EYES_WHITE}
				scale={finalScale}
			/>
			{/* Right eye white */}
			<Ellipse
				cx={eyeBaseXRight}
				cy={eyeBaseY}
				rx={width * 0.035}
				ry={width * 0.045}
				fill={COLOR_EYES_WHITE}
				scale={finalScale}
			/>
			{/* Left iris */}
			<Ellipse
				cx={eyeBaseXLeft}
				cy={eyeBaseY}
				rx={width * 0.02}
				ry={width * 0.025}
				fill={COLOR_EYES_IRIS}
				scale={finalScale}
			/>
			{/* Right iris */}
			<Ellipse
				cx={eyeBaseXRight}
				cy={eyeBaseY}
				rx={width * 0.02}
				ry={width * 0.025}
				fill={COLOR_EYES_IRIS}
				scale={finalScale}
			/>
			{/* Left pupil */}
			<Ellipse
				cx={eyeBaseXLeft}
				cy={eyeBaseY}
				rx={width * 0.01}
				ry={width * 0.012}
				fill={COLOR_EYES_PUPIL}
				scale={finalScale}
			/>
			{/* Right pupil */}
			<Ellipse
				cx={eyeBaseXRight}
				cy={eyeBaseY}
				rx={width * 0.01}
				ry={width * 0.012}
				fill={COLOR_EYES_PUPIL}
				scale={finalScale}
			/>
			{/* Left sparkle */}
			<Circle
				cx={eyeBaseXLeft - width * 0.008}
				cy={eyeBaseY - width * 0.008}
				r={EYE_SPARKLE_SIZE * 0.5}
				fill="#FFFFFF"
				opacity={sparkleOpacityLeft}
				scale={finalScale}
			/>
			{/* Right sparkle */}
			<Circle
				cx={eyeBaseXRight - width * 0.008}
				cy={eyeBaseY - width * 0.008}
				r={EYE_SPARKLE_SIZE * 0.5}
				fill="#FFFFFF"
				opacity={sparkleOpacityRight}
				scale={finalScale}
			/>

			{/* Nose */}
			<Ellipse
				cx={noseX}
				cy={noseY}
				rx={width * 0.018}
				ry={width * 0.012}
				fill={COLOR_NOSE}
				scale={finalScale}
			/>

			{/* Mouth (subtle smile curve) */}
			<Rect
				x={width / 2 - width * 0.025}
				y={noseY + height * 0.025}
				width={width * 0.05}
				height={height * 0.004}
				radius={height * 0.002}
				fill={COLOR_NOSE}
				rotation={0.1}
				scale={finalScale}
			/>

			{/* Tail base (fluffy puff) */}
			<Ellipse
				cx={tailBaseX}
				cy={tailBaseY}
				rx={width * 0.025}
				ry={width * 0.035}
				fill={COLOR_TAIL}
				scale={finalScale}
			/>
			{/* Tail line */}
			<Rect
				x={tailBaseX - width * 0.002}
				y={tailBaseY}
				width={width * 0.004}
				height={Math.sqrt(Math.pow(tailEndX - tailBaseX, 2) + Math.pow(tailEndY - tailBaseY, 2))}
				fill={COLOR_TAIL}
				rotation={Math.atan2(tailEndY - tailBaseY, tailEndX - tailBaseX)}
				scale={finalScale}
			/>
			{/* Tail tip puff */}
			<Ellipse
				cx={tailEndX}
				cy={tailEndY}
				rx={width * 0.018}
				ry={width * 0.022}
				fill={COLOR_TAIL}
				scale={finalScale}
			/>
		</AbsoluteFill>
	);
};