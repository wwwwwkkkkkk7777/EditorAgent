"use client";

import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlayIcon,
  PauseIcon,
  HeartIcon,
  PlusIcon,
  ListFilter,
  UploadIcon,
  Music,
} from "lucide-react";
import { useSoundsStore } from "@/stores/sounds-store";
import { useSoundSearch } from "@/hooks/use-sound-search";
import { useMediaStore } from "@/stores/media-store";
import type { SoundEffect, SavedSound } from "@/types/sounds";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { toast } from "sonner";
import { useProjectStore } from "@/stores/project-store";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

export function SoundsView() {
  const { activeProject } = useProjectStore();
  const { mediaFiles, addMediaFile } = useMediaStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = async () => {
    const electronAPI = (window as any).electronAPI;

    if (electronAPI?.openFileDialog) {
      try {
        const result = await electronAPI.openFileDialog({
          properties: ["openFile", "multiSelections"],
          filters: [
            {
              name: "音频文件",
              extensions: ["mp3", "wav", "aac", "ogg", "flac", "m4a"],
            },
            { name: "所有文件", extensions: ["*"] },
          ],
        });

        if (result && result.filePaths && result.filePaths.length > 0) {
          uploadLocalFiles(result.filePaths);
        }
      } catch (e) {
        console.error("Electron dialog error:", e);
        fileInputRef.current?.click();
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const uploadLocalFiles = async (paths: string[]) => {
    if (!activeProject) return;
    toast.info(`正在链接 ${paths.length} 个本地音频...`);

    try {
      for (const filePath of paths) {
        const fileName = filePath.split(/[\\\/]/).pop() || "audio";
        const formData = new FormData();
        formData.append("originalPath", filePath);
        formData.append("name", fileName);

        const response = await fetch("/api/media/upload-local", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error(`链接失败: ${fileName}`);
        const result = await response.json();
        
        // Add to local store for immediate UI update
        if (result.success) {
           addMediaFile(activeProject.id, {
             name: fileName,
             type: "audio",
             url: result.url,
             filePath: filePath,
             duration: 0, // Duration will be processed by backend or analyzer later
           });
        }
      }
      toast.success("本地音频已链接成功");
    } catch (err) {
      console.error(err);
      toast.error("链接过程中出错");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeProject) return;

    toast.info(`正在上传 ${files.length} 个本地音频...`);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("audio/")) {
          toast.warning(`跳过非音频文件: ${file.name}`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name);

        // In Electron, browser files might have a path
        if ((file as any).path) {
          formData.append("originalPath", (file as any).path);
        }

        // Get duration
        let duration = 0;
        try {
          const { getMediaDuration } = await import("@/stores/media-store");
          duration = await getMediaDuration(file);
          formData.append("duration", duration.toString());
        } catch (err) {
          console.warn("Could not get duration for", file.name);
        }

        const response = await fetch("/api/media/upload-local", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error(`上传失败: ${file.name}`);
        const result = await response.json();

        // Add to local store for immediate UI update
        if (result.success) {
          addMediaFile(activeProject.id, {
            name: file.name,
            type: "audio",
            url: result.url,
            filePath: (file as any).path || "",
            duration: duration,
          });
        }
      }
      toast.success("本地音频已成功添加至素材库");
    } catch (err) {
      console.error(err);
      toast.error("上传过程中出错");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="h-full flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="audio/*"
        multiple
        onChange={handleFileChange}
      />
      <Tabs defaultValue="sound-effects" className="flex flex-col h-full">
        <div className="px-3 pt-4 pb-0 flex items-center justify-between gap-2">
          <TabsList className="flex-1 overflow-x-auto justify-start">
            <TabsTrigger value="sound-effects">音效</TabsTrigger>
            <TabsTrigger value="songs">音乐库</TabsTrigger>
            <TabsTrigger value="local">本地</TabsTrigger>
            <TabsTrigger value="saved">已保存</TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleUploadClick}
            title="上传本地背景音乐/音效"
          >
            <UploadIcon className="w-4 h-4" />
          </Button>
        </div>
        <Separator className="my-4" />
        <TabsContent
          value="sound-effects"
          className="p-5 pt-0 mt-0 flex-1 flex flex-col min-h-0"
        >
          <SoundEffectsView />
        </TabsContent>
        <TabsContent
          value="saved"
          className="p-5 pt-0 mt-0 flex-1 flex flex-col min-h-0"
        >
          <SavedSoundsView />
        </TabsContent>
        <TabsContent
          value="songs"
          className="p-5 pt-0 mt-0 flex-1 flex flex-col min-h-0"
        >
          <SongsView />
        </TabsContent>
        <TabsContent
          value="local"
          className="p-5 pt-0 mt-0 flex-1 flex flex-col min-h-0"
        >
          <LocalAudioView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SoundEffectsView() {
  const {
    topSoundEffects,
    isLoading,
    searchQuery,
    setSearchQuery,
    scrollPosition,
    setScrollPosition,
    loadSavedSounds,
    isSoundSaved,
    toggleSavedSound,
    showCommercialOnly,
    toggleCommercialFilter,
    hasLoaded,
    setTopSoundEffects,
    setLoading,
    setError,
    setHasLoaded,
    setCurrentPage,
    setHasNextPage,
    setTotalCount,
  } = useSoundsStore();
  const {
    results: searchResults,
    isLoading: isSearching,
    loadMore,
    hasNextPage,
    isLoadingMore,
  } = useSoundSearch(searchQuery, showCommercialOnly);

  // Audio playback state
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );

  const { scrollAreaRef, handleScroll } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: hasNextPage,
    isLoading: isLoadingMore || isSearching,
  });

  useEffect(() => {
    loadSavedSounds();

    if (!hasLoaded) {
      let ignore = false;

      const fetchTopSounds = async () => {
        try {
          if (!ignore) {
            setLoading(true);
            setError(null);
          }

          const response = await fetch(
            "/api/sounds/search?page_size=50&sort=downloads"
          );

          if (!ignore) {
            // Handle API not implemented (405) or not found (404) gracefully
            if (response.status === 405 || response.status === 404) {
              // API not implemented yet - just set empty results without error
              setTopSoundEffects([]);
              setHasLoaded(true);
              setLoading(false);
              return;
            }

            if (!response.ok) {
              throw new Error(`Failed to fetch: ${response.status}`);
            }

            const data = await response.json();
            setTopSoundEffects(data.results || []);
            setHasLoaded(true);

            setCurrentPage(1);
            setHasNextPage(!!data.next);
            setTotalCount(data.count || 0);
          }
        } catch (error) {
          if (!ignore) {
            // Silently handle network errors - sounds are optional feature
            console.warn("Sounds API not available:", error);
            setTopSoundEffects([]);
            setHasLoaded(true);
          }
        } finally {
          if (!ignore) {
            setLoading(false);
          }
        }
      };

      const timeoutId = setTimeout(fetchTopSounds, 100);

      return () => {
        clearTimeout(timeoutId);
        ignore = true;
      };
    }

    if (scrollAreaRef.current && scrollPosition > 0) {
      const timeoutId = setTimeout(() => {
        scrollAreaRef.current?.scrollTo({ top: scrollPosition });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [
    hasLoaded,
    setTopSoundEffects,
    setLoading,
    setError,
    setHasLoaded,
    setCurrentPage,
    setHasNextPage,
    setTotalCount,
  ]);

  const handleScrollWithPosition = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    setScrollPosition(scrollTop);
    handleScroll(event);
  };

  const displayedSounds = useMemo(() => {
    const sounds = searchQuery ? searchResults : topSoundEffects;
    return sounds;
  }, [searchQuery, searchResults, topSoundEffects]);

  const playSound = (sound: SoundEffect) => {
    if (playingId === sound.id) {
      audioElement?.pause();
      setPlayingId(null);
      return;
    }

    // Stop previous sound
    audioElement?.pause();

    if (sound.previewUrl) {
      const audio = new Audio(sound.previewUrl);
      audio.addEventListener("ended", () => {
        setPlayingId(null);
      });
      audio.addEventListener("error", (e) => {
        setPlayingId(null);
      });
      audio.play().catch((error) => {
        setPlayingId(null);
      });

      setAudioElement(audio);
      setPlayingId(sound.id);
    }
  };

  return (
    <div className="flex flex-col gap-5 mt-1 h-full">
      <div className="flex items-center gap-3">
        <Input
          placeholder="搜索音效"
          className="bg-panel-accent w-full"
          containerClassName="w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          showClearIcon
          onClear={() => setSearchQuery("")}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="text"
              size="icon"
              className={cn(showCommercialOnly && "text-primary")}
            >
              <ListFilter className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuCheckboxItem
              checked={showCommercialOnly}
              onCheckedChange={toggleCommercialFilter}
            >
              仅显示商业许可
            </DropdownMenuCheckboxItem>
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {showCommercialOnly
                ? "仅显示授权商业用途的音效"
                : "显示所有音效，无论其许可如何"}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative h-full overflow-hidden">
        <ScrollArea
          className="flex-1 h-full"
          ref={scrollAreaRef}
          onScrollCapture={handleScrollWithPosition}
        >
          <div className="flex flex-col gap-4">
            {isLoading && !searchQuery && (
              <div className="text-muted-foreground text-sm">
                正在加载音效...
              </div>
            )}
            {isSearching && searchQuery && (
              <div className="text-muted-foreground text-sm">正在搜索...</div>
            )}
            {displayedSounds.map((sound) => (
              <AudioItem
                key={sound.id}
                sound={sound}
                isPlaying={playingId === sound.id}
                onPlay={() => playSound(sound)}
                isSaved={isSoundSaved(sound.id)}
                onToggleSaved={() => toggleSavedSound(sound)}
              />
            ))}
            {!isLoading && !isSearching && displayedSounds.length === 0 && (
              <div className="text-muted-foreground text-sm">
                {searchQuery ? "未找到音效" : "暂无可用音效"}
              </div>
            )}
            {isLoadingMore && (
              <div className="text-muted-foreground text-sm text-center py-4">
                正在加载更多音效...
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function SavedSoundsView() {
  const {
    savedSounds,
    isLoadingSavedSounds,
    savedSoundsError,
    loadSavedSounds,
    isSoundSaved,
    toggleSavedSound,
    clearSavedSounds,
  } = useSoundsStore();

  // Audio playback state
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );

  // Clear confirmation dialog state
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Load saved sounds when tab becomes active
  useEffect(() => {
    loadSavedSounds();
  }, [loadSavedSounds]);

  const playSound = (sound: SavedSound) => {
    if (playingId === sound.id) {
      audioElement?.pause();
      setPlayingId(null);
      return;
    }

    // Stop previous sound
    audioElement?.pause();

    if (sound.previewUrl) {
      const audio = new Audio(sound.previewUrl);
      audio.addEventListener("ended", () => {
        setPlayingId(null);
      });
      audio.addEventListener("error", (e) => {
        setPlayingId(null);
      });
      audio.play().catch((error) => {
        setPlayingId(null);
      });

      setAudioElement(audio);
      setPlayingId(sound.id);
    }
  };

  // Convert SavedSound to SoundEffect for compatibility with AudioItem
  const convertToSoundEffect = (savedSound: SavedSound): SoundEffect => ({
    id: savedSound.id,
    name: savedSound.name,
    description: "",
    url: "",
    previewUrl: savedSound.previewUrl,
    downloadUrl: savedSound.downloadUrl,
    duration: savedSound.duration,
    filesize: 0,
    type: "audio",
    channels: 0,
    bitrate: 0,
    bitdepth: 0,
    samplerate: 0,
    username: savedSound.username,
    tags: savedSound.tags,
    license: savedSound.license,
    created: savedSound.savedAt,
    downloads: 0,
    rating: 0,
    ratingCount: 0,
  });

  if (isLoadingSavedSounds) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground text-sm">
          正在加载已保存音效...
        </div>
      </div>
    );
  }

  if (savedSoundsError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive text-sm">{savedSoundsError}</div>
      </div>
    );
  }

  if (savedSounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
        <HeartIcon className="w-10 h-10 text-muted-foreground/30" />
        <div className="text-muted-foreground text-sm">暂无已保存音效</div>
        <div className="text-muted-foreground/60 text-xs px-10">
          点击音效旁的图标将其保存到此处，以便快速访问
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {savedSounds.length} 个已保存音效
        </div>
        <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <DialogTrigger asChild>
            <Button variant="text" size="sm" className="h-7 text-xs">
              清空全部
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>清空所有已保存音效？</DialogTitle>
              <DialogDescription>
                此操作无法撤销。所有已保存的音效都将被移除。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowClearDialog(false)}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await clearSavedSounds();
                  setShowClearDialog(false);
                }}
              >
                清空全部
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative h-full overflow-hidden">
        <ScrollArea className="flex-1 h-full">
          <div className="flex flex-col gap-4">
            {savedSounds.map((sound) => (
              <AudioItem
                key={sound.id}
                sound={convertToSoundEffect(sound)}
                isPlaying={playingId === sound.id}
                onPlay={() => playSound(sound)}
                isSaved={isSoundSaved(sound.id)}
                onToggleSaved={() =>
                  toggleSavedSound(convertToSoundEffect(sound))
                }
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function LocalAudioView() {
  const { mediaFiles } = useMediaStore();
  const { isSoundSaved, toggleSavedSound } = useSoundsStore();

  const localAudioFiles = useMemo(() => {
    return mediaFiles.filter((item) => item.type === "audio" && !item.ephemeral);
  }, [mediaFiles]);

  // Audio playback state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const playSound = (item: any) => {
    if (audioElement) {
      audioElement.pause();
    }

    if (playingId === item.id) {
      setPlayingId(null);
      setAudioElement(null);
      return;
    }

    const audio = new Audio(item.url || "");
    audio.play();
    setAudioElement(audio);
    setPlayingId(item.id);

    audio.onended = () => {
      setPlayingId(null);
      setAudioElement(null);
    };
  };

  const convertToSoundEffect = (item: any): SoundEffect => {
    // Generate a consistent numeric ID from the string UUID for the SoundEffect interface
    const numericId = item.id.split('-').reduce((acc: number, part: string) => acc + parseInt(part, 16), 0) || Math.floor(Math.random() * 1000000);
    
    return {
      id: numericId,
      name: item.name,
      description: "",
      url: item.url || "",
      previewUrl: item.url || "",
      previews: { "preview-lq-mp3": item.url || "" },
      duration: item.duration || 0,
      filesize: 0,
      type: "audio",
      channels: 2,
      bitrate: 0,
      bitdepth: 0,
      samplerate: 0,
      username: "本地素材",
      tags: ["local"],
      license: "Private",
      created: "",
      downloads: 0,
      rating: 0,
      ratingCount: 0,
    };
  };

  if (localAudioFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center opacity-50 py-10">
        <Music className="w-10 h-10 mb-2" />
        <div className="text-sm">暂无本地音频</div>
        <div className="text-xs px-10">点击右上角上传按钮添加你自己的背景音乐或音效</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="text-xs text-muted-foreground">
        {localAudioFiles.length} 个本地音频
      </div>
      <ScrollArea className="flex-1 h-full">
        <div className="flex flex-col gap-4">
          {localAudioFiles.map((item) => {
            const soundEffect = convertToSoundEffect(item);
            return (
              <AudioItem
                key={item.id}
                sound={soundEffect}
                isPlaying={playingId === item.id}
                onPlay={() => playSound(item)}
                isSaved={isSoundSaved(soundEffect.id)}
                onToggleSaved={() => toggleSavedSound(soundEffect)}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function SongsView() {
  const {
    isLoading,
    searchQuery,
    loadSavedSounds,
    isSoundSaved,
    toggleSavedSound,
    showCommercialOnly,
  } = useSoundsStore();

  const {
    results: searchResults,
    isLoading: isSearching,
    loadMore,
    hasNextPage,
    isLoadingMore,
    error,
  } = useSoundSearch(searchQuery, showCommercialOnly, "music");

  // Audio playback state
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const { scrollAreaRef, handleScroll } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: hasNextPage,
    isLoading: isLoadingMore || isSearching,
  });

  useEffect(() => {
    loadSavedSounds();
  }, [loadSavedSounds]);

  const playSound = (sound: SoundEffect) => {
    if (audioElement) {
      audioElement.pause();
    }

    if (playingId === sound.id) {
      setPlayingId(null);
      setAudioElement(null);
      return;
    }

    const audio = new Audio(sound.previews?.["preview-lq-mp3"] || "");
    audio.play();
    setAudioElement(audio);
    setPlayingId(sound.id);

    audio.onended = () => {
      setPlayingId(null);
      setAudioElement(null);
    };
  };

  const convertToSoundEffect = (sound: SavedSound): SoundEffect => {
    return {
      ...sound,
      description: "",
      url: "",
      previews: { "preview-lq-mp3": sound.previewUrl || "" },
      filesize: 0,
      type: "music",
      channels: 2,
      bitrate: 0,
      bitdepth: 0,
      samplerate: 0,
      license: sound.license,
      created: "",
      downloads: 0,
      rating: 0,
      ratingCount: 0,
    };
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {error && <div className="text-destructive text-xs">{error}</div>}

      <div className="relative h-full overflow-hidden">
        <ScrollArea
          className="flex-1 h-full"
          onScroll={handleScroll}
          ref={scrollAreaRef}
        >
          <div className="flex flex-col gap-4">
            {searchResults.length > 0 ? (
              searchResults.map((sound) => (
                <AudioItem
                  key={sound.id}
                  sound={sound}
                  isPlaying={playingId === sound.id}
                  onPlay={() => playSound(sound)}
                  isSaved={isSoundSaved(sound.id)}
                  onToggleSaved={() => toggleSavedSound(sound)}
                />
              ))
            ) : isSearching ? (
              <div className="flex items-center justify-center h-20">
                <p className="text-muted-foreground text-sm">正在加载音乐...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                <PlayIcon className="w-8 h-8 mb-2" />
                <p className="text-sm">未找到相关音乐</p>
              </div>
            )}
            {isLoadingMore && (
              <div className="py-2 text-center text-xs text-muted-foreground">
                正在加载更多...
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

interface AudioItemProps {
  sound: SoundEffect;
  isPlaying: boolean;
  onPlay: () => void;
  isSaved: boolean;
  onToggleSaved: () => void;
}

function AudioItem({
  sound,
  isPlaying,
  onPlay,
  isSaved,
  onToggleSaved,
}: AudioItemProps) {
  const { addSoundToTimeline } = useSoundsStore();

  const handleClick = () => {
    onPlay();
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSaved();
  };

  const handleAddToTimeline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addSoundToTimeline(sound);
  };

  return (
    <div
      className="group flex items-center gap-3 opacity-100 hover:opacity-75 transition-opacity cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative w-12 h-12 bg-accent rounded-md flex items-center justify-center overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
        {isPlaying ? (
          <PauseIcon className="w-5 h-5" />
        ) : (
          <PlayIcon className="w-5 h-5" />
        )}
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="font-medium truncate text-sm">{sound.name}</p>
        <span className="text-xs text-muted-foreground truncate block">
          {sound.username}
        </span>
      </div>

      <div className="flex items-center gap-3 pr-2">
        <Button
          variant="text"
          size="icon"
          className="text-muted-foreground hover:text-foreground !opacity-100 w-auto"
          onClick={handleAddToTimeline}
          title="添加到时间轴"
        >
          <PlusIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="text"
          size="icon"
          className={`hover:text-foreground !opacity-100 w-auto ${isSaved
              ? "text-red-500 hover:text-red-600"
              : "text-muted-foreground"
            }`}
          onClick={handleSaveClick}
          title={isSaved ? "从已保存中移除" : "保存音效"}
        >
          <HeartIcon className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
