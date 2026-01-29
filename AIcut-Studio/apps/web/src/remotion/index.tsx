/**
 * Remotion Root - Entry point for Remotion rendering
 * This file defines all compositions that can be rendered
 */

import { registerRoot, Composition } from "remotion";
import React from "react";
import { ExportComposition } from "./export-composition";
import { MotionDynamicComp } from "./motion-dynamic-comp";

// Default composition settings
const FPS = 30;
const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="AIcutExport"
                component={ExportComposition}
                durationInFrames={300} // Will be overridden by inputProps
                fps={FPS}
                width={DEFAULT_WIDTH}
                height={DEFAULT_HEIGHT}
                defaultProps={{
                    projectData: null,
                }}
            />
            <Composition
                id="MotionGraphicsDynamic"
                component={MotionDynamicComp}
                durationInFrames={180}
                fps={FPS}
                width={DEFAULT_WIDTH}
                height={DEFAULT_HEIGHT}
                defaultProps={{
                    code: "import { AbsoluteFill } from \"remotion\";\nexport const MyAnimation = () => <AbsoluteFill style={{ backgroundColor: \"#000\" }} />;",
                    durationInFrames: 180,
                    fps: FPS,
                    width: DEFAULT_WIDTH,
                    height: DEFAULT_HEIGHT,
                }}
                calculateMetadata={({ props }) => ({
                    durationInFrames: (props as any).durationInFrames as number,
                    fps: (props as any).fps as number,
                    width: (props as any).width as number,
                    height: (props as any).height as number,
                })}
            />
        </>
    );
};

// Register the root component - REQUIRED for Remotion
registerRoot(RemotionRoot);
