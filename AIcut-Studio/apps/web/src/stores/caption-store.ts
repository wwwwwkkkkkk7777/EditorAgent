import { create } from "zustand";

export interface CaptionSegment {
  id: string;
  text: string;
  startTime: number;
  duration: number;
  elementId?: string; // 关联的视频元素ID
  mediaId?: string;   // 关联的媒体ID
}

interface CaptionStore {
  segments: CaptionSegment[];
  isTranscribing: boolean;
  transcriptionProgress: string;
  
  // 添加转录片段
  addSegments: (segments: CaptionSegment[]) => void;
  
  // 清除所有转录
  clearSegments: () => void;
  
  // 清除特定元素的转录
  clearSegmentsForElement: (elementId: string) => void;
  
  // 设置转录状态
  setTranscribing: (isTranscribing: boolean, progress?: string) => void;
  
  // 获取特定元素的转录
  getSegmentsForElement: (elementId: string) => CaptionSegment[];
}

export const useCaptionStore = create<CaptionStore>((set, get) => ({
  segments: [],
  isTranscribing: false,
  transcriptionProgress: "",
  
  addSegments: (segments) => {
    set((state) => ({
      segments: [...state.segments, ...segments]
    }));
  },
  
  clearSegments: () => {
    set({ segments: [] });
  },
  
  clearSegmentsForElement: (elementId) => {
    set((state) => ({
      segments: state.segments.filter(s => s.elementId !== elementId)
    }));
  },
  
  setTranscribing: (isTranscribing, progress = "") => {
    set({ isTranscribing, transcriptionProgress: progress });
  },
  
  getSegmentsForElement: (elementId) => {
    return get().segments.filter(s => s.elementId === elementId);
  },
}));
