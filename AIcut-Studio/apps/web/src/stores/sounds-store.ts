import { create } from "zustand";
import type { SoundEffect, SavedSound } from "@/types/sounds";
import { toast } from "sonner";
import { useMediaStore } from "./media-store";
import { useTimelineStore } from "./timeline-store";
import { useProjectStore } from "./project-store";
import { usePlaybackStore } from "./playback-store";

interface SoundsStore {
  topSoundEffects: SoundEffect[];
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;

  // Filter state
  showCommercialOnly: boolean;
  toggleCommercialFilter: () => void;

  // Search state
  searchQuery: string;
  searchResults: SoundEffect[];
  isSearching: boolean;
  searchError: string | null;
  lastSearchQuery: string;
  scrollPosition: number;

  // Pagination state
  currentPage: number;
  hasNextPage: boolean;
  totalCount: number;
  isLoadingMore: boolean;

  // Saved sounds state (now in-memory only)
  savedSounds: SavedSound[];
  isSavedSoundsLoaded: boolean;
  isLoadingSavedSounds: boolean;
  savedSoundsError: string | null;

  // Timeline integration
  addSoundToTimeline: (sound: SoundEffect) => Promise<boolean>;

  setTopSoundEffects: (sounds: SoundEffect[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasLoaded: (loaded: boolean) => void;

  // Search actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SoundEffect[]) => void;
  setSearching: (searching: boolean) => void;
  setSearchError: (error: string | null) => void;
  setLastSearchQuery: (query: string) => void;
  setScrollPosition: (position: number) => void;

  // Pagination actions
  setCurrentPage: (page: number) => void;
  setHasNextPage: (hasNext: boolean) => void;
  setTotalCount: (count: number) => void;
  setLoadingMore: (loading: boolean) => void;
  appendSearchResults: (results: SoundEffect[]) => void;
  appendTopSounds: (results: SoundEffect[]) => void;
  resetPagination: () => void;

  // Saved sounds actions
  loadSavedSounds: () => Promise<void>;
  saveSoundEffect: (soundEffect: SoundEffect) => Promise<void>;
  removeSavedSound: (soundId: number) => Promise<void>;
  isSoundSaved: (soundId: number) => boolean;
  toggleSavedSound: (soundEffect: SoundEffect) => Promise<void>;
  clearSavedSounds: () => Promise<void>;
}

export const useSoundsStore = create<SoundsStore>((set, get) => ({
  topSoundEffects: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
  showCommercialOnly: true,

  toggleCommercialFilter: () => {
    set((state) => ({ showCommercialOnly: !state.showCommercialOnly }));
  },

  // Search state
  searchQuery: "",
  searchResults: [],
  isSearching: false,
  searchError: null,
  lastSearchQuery: "",
  scrollPosition: 0,

  // Pagination state
  currentPage: 1,
  hasNextPage: false,
  totalCount: 0,
  isLoadingMore: false,

  // Saved sounds state
  savedSounds: [],
  isSavedSoundsLoaded: false,
  isLoadingSavedSounds: false,
  savedSoundsError: null,

  setTopSoundEffects: (sounds) => set({ topSoundEffects: sounds }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setHasLoaded: (loaded) => set({ hasLoaded: loaded }),

  // Search actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) =>
    set({ searchResults: results, currentPage: 1 }),
  setSearching: (searching) => set({ isSearching: searching }),
  setSearchError: (error) => set({ searchError: error }),
  setLastSearchQuery: (query) => set({ lastSearchQuery: query }),
  setScrollPosition: (position) => set({ scrollPosition: position }),

  // Pagination actions
  setCurrentPage: (page) => set({ currentPage: page }),
  setHasNextPage: (hasNext) => set({ hasNextPage: hasNext }),
  setTotalCount: (count) => set({ totalCount: count }),
  setLoadingMore: (loading) => set({ isLoadingMore: loading }),
  appendSearchResults: (results) =>
    set((state) => ({
      searchResults: [...state.searchResults, ...results],
    })),
  appendTopSounds: (results) =>
    set((state) => ({
      topSoundEffects: [...state.topSoundEffects, ...results],
    })),
  resetPagination: () =>
    set({
      currentPage: 1,
      hasNextPage: false,
      totalCount: 0,
      isLoadingMore: false,
    }),

  // Saved sounds actions (now in-memory only, no persistence)
  loadSavedSounds: async () => {
    if (get().isSavedSoundsLoaded) return;
    // No persistence - just mark as loaded
    set({ isSavedSoundsLoaded: true, isLoadingSavedSounds: false });
  },

  saveSoundEffect: async (soundEffect: SoundEffect) => {
    try {
      // In-memory only
      const savedSound: SavedSound = {
        id: soundEffect.id,
        name: soundEffect.name,
        duration: soundEffect.duration,
        previewUrl: soundEffect.previewUrl,
        savedAt: new Date().toISOString(),
      };
      set((state) => ({
        savedSounds: [...state.savedSounds, savedSound],
      }));
      toast.success("Sound saved");
    } catch (error) {
      toast.error("Failed to save sound");
      console.error("Failed to save sound:", error);
    }
  },

  removeSavedSound: async (soundId: number) => {
    try {
      set((state) => ({
        savedSounds: state.savedSounds.filter((sound) => sound.id !== soundId),
      }));
    } catch (error) {
      toast.error("Failed to remove sound");
      console.error("Failed to remove sound:", error);
    }
  },

  isSoundSaved: (soundId: number) => {
    const { savedSounds } = get();
    return savedSounds.some((sound) => sound.id === soundId);
  },

  toggleSavedSound: async (soundEffect: SoundEffect) => {
    const { isSoundSaved, saveSoundEffect, removeSavedSound } = get();

    if (isSoundSaved(soundEffect.id)) {
      await removeSavedSound(soundEffect.id);
    } else {
      await saveSoundEffect(soundEffect);
    }
  },

  clearSavedSounds: async () => {
    set({
      savedSounds: [],
      savedSoundsError: null,
    });
  },

  addSoundToTimeline: async (sound) => {
    const activeProject = useProjectStore.getState().activeProject;
    if (!activeProject) {
      toast.error("No active project");
      return false;
    }

    const audioUrl = sound.previewUrl;
    if (!audioUrl) {
      toast.error("Sound file not available");
      return false;
    }

    try {
      // --- NEW: Download and persist on the server side to avoid CORS ---
      let persistentUrl = audioUrl;
      let localFilePath = "";

      // Check if it's already a local/proxied URL
      const isAlreadyLocal = audioUrl.startsWith("/api/media/serve") || audioUrl.startsWith("http://localhost");

      if (!isAlreadyLocal) {
        try {
          const formData = new FormData();
          formData.append("remoteUrl", audioUrl);
          formData.append("name", sound.name);
          formData.append("duration", sound.duration.toString());

          const uploadResponse = await fetch("/api/media/upload-local", {
            method: "POST",
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            if (uploadResult.success) {
              persistentUrl = uploadResult.url;
              const urlObj = new URL(uploadResult.url, window.location.origin);
              localFilePath = urlObj.searchParams.get("path") || "";
            }
          } else {
            throw new Error(await uploadResponse.text());
          }
        } catch (uploadError) {
          console.error("Failed to upload sound for persistence:", uploadError);
          throw new Error("Failed to download and localize audio file. Please try again.");
        }
      } else {
        // For local URLs, try to extract the file path if possible
        try {
          const urlObj = new URL(audioUrl, window.location.origin);
          localFilePath = urlObj.searchParams.get("path") || "";
        } catch (e) {
          // If relative URL, try to parse it as such
          if (audioUrl.includes("path=")) {
            const match = audioUrl.match(/path=([^&]+)/);
            if (match) localFilePath = decodeURIComponent(match[1]);
          }
        }
      }
      // -----------------------------------------------------------

      const addedMedia = await useMediaStore.getState().addMediaFile(activeProject.id, {
        name: sound.name,
        type: "audio",
        duration: sound.duration,
        url: persistentUrl,
        filePath: localFilePath,
      });

      if (!addedMedia) throw new Error("Failed to create media item");

      const success = useTimelineStore
        .getState()
        .addElementAtTime(addedMedia, usePlaybackStore.getState().currentTime);

      if (success) {
        return true;
      }
      throw new Error("Failed to add to timeline - check for overlaps");
    } catch (error) {
      console.error("Failed to add sound to timeline:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add sound to timeline",
        { id: `sound-${sound.id}` }
      );
      return false;
    }
  },
}));
