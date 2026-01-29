export type MediaType = "image" | "video" | "audio";

// What's stored in media library
export interface MediaFile {
  id: string;
  name: string;
  type: MediaType;
  file?: File;
  url?: string; // Object URL for preview
  thumbnailUrl?: string; // For video thumbnails
  duration?: number; // For video/audio duration
  width?: number; // For video/image width
  height?: number; // For video/image height
  fps?: number; // For video frame rate
  filePath?: string; // Absolute path on disk (Electron only)
  originalPath?: string; // Linked file source path (Electron only)
  isLinked?: boolean; // True when linked to external file path
  // Ephemeral items are used by timeline directly and should not appear in the media library or be persisted
  ephemeral?: boolean;
}
