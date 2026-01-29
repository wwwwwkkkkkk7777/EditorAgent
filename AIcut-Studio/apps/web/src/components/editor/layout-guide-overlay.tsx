"use client";

import { useEditorStore, type PlatformLayout } from "@/stores/editor-store";

const LAYOUT_RATIOS: Record<PlatformLayout, { width: number; height: number }> = {
  "aspect-16-9": { width: 16, height: 9 },
  "aspect-9-16": { width: 9, height: 16 },
  "aspect-1-1": { width: 1, height: 1 },
  "aspect-4-3": { width: 4, height: 3 },
};

export function LayoutGuideOverlay() {
  const { layoutGuide } = useEditorStore();

  if (layoutGuide.platform === null) return null;
  const ratio = LAYOUT_RATIOS[layoutGuide.platform];
  if (!ratio) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div
        className="relative max-h-full max-w-full"
        style={{
          aspectRatio: `${ratio.width} / ${ratio.height}`,
          height: "100%",
          width: "auto",
        }}
      >
        <div className="absolute inset-0 rounded-sm border border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
      </div>
    </div>
  );
}
