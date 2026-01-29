```javascript
import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring } from "remotion";
import { Circle, Rect, Triangle, Ellipse, Pie } from "@remotion/shapes";

export const PuppyAnimation = () => {
	const frame = useCurrentFrame();
	const { width, height, fps } = useVideoConfig();

	// Constants
	const BACKGROUND_COLOR = "#f0f8ff"; // Soft pastel blue
	const PUPPY_FUR_COLOR = "#f5f0e6"; // Light beige
	const EYE_COLOR = "#ffffff"; // White sclera
	const EYE_IRIS_COLOR = "#4a90e2"; // Sparkling blue iris
	const EYE_HIGHLIGHT_COLOR = "#ffffff"; // Bright highlight
	const NOSE_COLOR = "#ffb6c1"; // Soft pink nose
	const TONGUE_COLOR = "#ffb6c1"; // Matching pink tongue
	const EAR_INSIDE_COLOR = "#ffdab9"; // Peach ear interior

	// Timing constants
	const WAG_SPEED = 3;
	const BLINK_DURATION = 8;
	const EAR_BOUNCE_SPEED = 2.5;
	const STEP_CYCLE = 24; // Full walk cycle in frames

	// Calculate progress for cyclic animations
	const wagProgress = (frame * WAG_SPEED) % 360;
	const blinkProgress = (frame % 120); // Blink every ~4 seconds
	const earProgress = (frame * EAR_BOUNCE_SPEED) % 360;
	const stepProgress = (frame % STEP_CYCLE);

	// Tail wag: smooth left-right oscillation
	const tailAngle = interpolate(
		wagProgress,
		[0, 90, 180, 270, 360],
		[-15, 0, 15, 0, -15],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
	);

	// Ear bounce: subtle vertical movement
	const earBounce = spring({
		fps,
		frame: earProgress,
		config: {
			damping: 20,
			mass: 0.8,
			stiffness: 120,
		},
	});

	// Blink animation: smooth open/closed cycle
	const isBlinking = blinkProgress < BLINK_DURATION || blinkProgress > 120 - BLINK_DURATION;
	const eyeHeight = isBlinking 
		? interpolate(blinkProgress, [0, BLINK_DURATION], [1, 0.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
		: 1;

	// Walking motion: gentle up-down and paw movement
	const bodyYOffset = interpolate(
		stepProgress,
		[0, 6, 12, 18, 24],
		[0, -8, 0, 8, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
	);
	const frontPawRotation = interpolate(
		stepProgress,
		[0, 6, 12, 18, 24],
		[-10, 0, 10, 0, -10],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
	);
	const backPawRotation = interpolate(
		stepProgress,
		[0, 6, 12, 18, 24],
		[10, 0, -10, 0, 10],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
	);

	// Puppy size and positioning
	const puppyScale = 0.8;
	const puppyWidth = width * 0.4 * puppyScale;
	const puppyHeight = height * 0.5 * puppyScale;
	const centerX = width / 2;
	const centerY = height / 2 + 40;

	// Head position with subtle bounce
	const headY = centerY - 80 + bodyYOffset * 0.4;

	return (
		<AbsoluteFill style={{ backgroundColor: BACKGROUND_COLOR }}>
			{/* Puppy Body */}
			<Rect
				x={centerX - puppyWidth * 0.4}
				y={centerY + 20 + bodyYOffset}
				width={puppyWidth * 0.8}
				height={puppyHeight * 0.4}
				radius={puppyWidth * 0.2}
				fill={PUPPY_FUR_COLOR}
				style={{ transform: `scale(${puppyScale})` }}
			/>

			{/* Head */}
			<Rect
				x={centerX - puppyWidth * 0.3}
				y={headY}
				width={puppyWidth * 0.6}
				height={puppyHeight * 0.45}
				radius={puppyWidth * 0.25}
				fill={PUPPY_FUR_COLOR}
				style={{ transform: `scale(${puppyScale})` }}
			/>

			{/* Left Ear */}
			<Rect
				x={centerX - puppyWidth * 0.45}
				y={headY - 15 + (earBounce * 8)}
				width={puppyWidth * 0.2}
				height={puppyHeight * 0.25}
				radius={puppyWidth * 0.1}
				fill={PUPPY_FUR_COLOR}
				style={{
					transform: `rotate(-25deg) scale(${puppyScale})`,
					transformOrigin: "bottom center",
				}}
			/>
			{/* Left Ear Interior */}
			<Rect
				x={centerX - puppyWidth * 0.43}
				y={headY - 10 + (earBounce * 8)}
				width={puppyWidth * 0.14}
				height={puppyHeight * 0.2}
				radius={puppyWidth * 0.08}
				fill={EAR_INSIDE_COLOR}
				style={{
					transform: `rotate(-25deg) scale(${puppyScale})`,
					transformOrigin: "bottom center",
				}}
			/>

			{/* Right Ear */}
			<Rect
				x={centerX + puppyWidth * 0.25}
				y={headY - 15 + (earBounce * 8)}
				width={puppyWidth * 0.2}
				height={puppyHeight * 0.25}
				radius={puppyWidth * 0.1}
				fill={PUPPY_FUR_COLOR}
				style={{
					transform: `rotate(25deg) scale(${puppyScale})`,
					transformOrigin: "bottom center",
				}}
			/>
			{/* Right Ear Interior */}
			<Rect
				x={centerX + puppyWidth * 0.27}
				y={headY - 10 + (earBounce * 8)}
				width={puppyWidth * 0.14}
				height={puppyHeight * 0.2}
				radius={puppyWidth * 0.08}
				fill={EAR_INSIDE_COLOR}
				style={{
					transform: `rotate(25deg) scale(${puppyScale})`,
					transformOrigin: "bottom center",
				}}
			/>

			{/* Eyes */}
			{/* Left Eye */}
			<Rect
				x={centerX - puppyWidth * 0.22}
				y={headY + 25}
				width={puppyWidth * 0.12}
				height={puppyHeight * 0.12 * eyeHeight}
				radius={puppyWidth * 0.06}
				fill={EYE_COLOR}
				style={{ transform: `scale(${puppyScale})` }}
			/>
			<Circle
				cx={centerX - puppyWidth * 0.18}
				cy={headY + 30}
				r={puppyWidth * 0.03}
				fill={EYE_IRIS_COLOR}
				style={{ transform: `scale(${puppyScale})` }}
			/>
			<Circle
				cx={centerX - puppyWidth * 0.19}
				cy={headY + 28}
				r={puppyWidth * 0.01}
				fill={EYE_HIGHLIGHT_COLOR}
				style={{ transform: `scale(${puppyScale})` }}
			/>

			{/* Right Eye */}
			<Rect
				x={centerX + puppyWidth * 0.1}
				y={headY + 25}
				width={puppyWidth * 0.12}
				height={puppyHeight * 0.12 * eyeHeight}
				radius={puppyWidth * 0.06}
				fill={EYE_COLOR}
				style={{ transform: `scale(${puppyScale})` }}
			/>
			<Circle
				cx={centerX + puppyWidth * 0.14}
				cy={headY + 30}
				r={puppyWidth * 0.03}
				fill={EYE_IRIS_COLOR}
				style={{ transform: `scale(${puppyScale})` }}
			/>
			<Circle
				cx={centerX + puppyWidth * 0.13}
				cy={headY + 28}
				r={puppyWidth * 0.01}
				fill={EYE_HIGHLIGHT_COLOR}
				style={{ transform: `scale(${puppyScale})` }}
			/>

			{/* Nose */}
			<Rect
				x={centerX - puppyWidth * 0.08}
				y={headY + 55}
				width={puppyWidth * 0.16}
				height={puppyHeight * 0.08}
				radius={puppyWidth * 0.08}
				fill={NOSE_COLOR}
				style={{ transform: `scale(${puppyScale})` }}
			/>

			{/* Tongue */}
			<Rect
				x={centerX - puppyWidth * 0.06}
				y={headY + 65}
				width={puppyWidth * 0.12}
				height={puppyHeight * 0.06}
				radius={puppyWidth * 0.06}
				fill={TONGUE_COLOR}
				style={{ transform: `scale(${puppyScale})` }}
			/>

			{/* Tail */}
			<Rect
				x={centerX + puppyWidth * 0.35}
				y={centerY + 35 + bodyYOffset}
				width={puppyWidth * 0.04}
				height={puppyHeight * 0.25}
				radius={puppyWidth * 0.02}
				fill={PUPPY_FUR_COLOR}
				style={{
					transform: `rotate(${tailAngle}deg) scale(${puppyScale})`,
					transformOrigin: "top center",
				}}
			/>
			{/* Tail Tip */}
			<Rect
				x={centerX + puppyWidth * 0.35}
				y={centerY + 60 + bodyYOffset}
				width={puppyWidth * 0.06}
				height={puppyHeight * 0.06}
				radius={puppyWidth * 0.03}
				fill={PUPPY_FUR_COLOR}
				style={{
					transform: `rotate(${tailAngle}deg) scale(${puppyScale})`,
					transformOrigin: "top center",
				}}
			/>

			{/* Front Left Paw */}
			<Rect
				x={centerX - puppyWidth * 0.3}
				y={centerY + 65 + bodyYOffset}
				width={puppyWidth * 0.12}
				height={puppyHeight * 0.08}
				radius={puppyWidth * 0.04}
				fill={PUPPY_FUR_COLOR}
				style={{
					transform: `rotate(${frontPawRotation}deg) scale(${puppyScale})`,
					transformOrigin: "top center",
				}}
			/>

			{/* Front Right Paw */}
			<Rect
				x={centerX + puppyWidth * 0.18}
				y={centerY + 65 + bodyYOffset}
				width={puppyWidth * 0.12}
				height={puppyHeight * 0.08}
				radius={puppyWidth * 0.04}
				fill={PUPPY_FUR_COLOR}
				style={{
					transform: `rotate(${-frontPawRotation}deg) scale(${puppyScale})`,
					transformOrigin: "top center",
				}}
			/>

			{/* Back Left Paw */}
			<Rect
				x={centerX - puppyWidth * 0.2}
				y={centerY + 75 + bodyYOffset}
				width={puppyWidth * 0.12}
				height={puppyHeight * 0.08}
				radius={puppyWidth * 0.04}
				fill={PUPPY_FUR_COLOR}
				style={{
					transform: `rotate(${backPawRotation}deg) scale(${puppyScale})`,
					transformOrigin: "top center",
				}}
			/>

			{/* Back Right Paw */}
			<Rect
				x={centerX + puppyWidth * 0.08}
				y={centerY + 75 + bodyYOffset}
				width={puppyWidth * 0.12}
				height={puppyHeight * 0.08}
				radius={puppyWidth * 0.04}
				fill={PUPPY_FUR_COLOR}
				style={{
					transform: `rotate(${-backPawRotation}deg) scale(${puppyScale})`,
					transformOrigin: "top center",
				}}
			/>
		</AbsoluteFill>
	);
};
```