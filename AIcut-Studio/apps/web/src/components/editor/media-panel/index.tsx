"use client";

import { TabBar } from "./tabbar";
import { MediaView } from "./views/media";
import { useMediaPanelStore, Tab } from "./store";
import { TextView } from "./views/text";
import { SoundsView } from "./views/sounds";
import { StickersView } from "./views/stickers";
import { Separator } from "@/components/ui/separator";
import { SettingsView } from "./views/settings";
import { TransitionsView } from "./views/transitions";
import { Captions } from "./views/captions";
import { ChatView } from "./views/chat";
import { VideoAgentView } from "./views/videoagent";

export function MediaPanel() {
  const { activeTab } = useMediaPanelStore();

  const viewMap: Record<Tab, React.ReactNode> = {
    media: <MediaView />,
    chat: <ChatView />,
    videoagent: <VideoAgentView />,
    sounds: <SoundsView />,
    text: <TextView />,
    stickers: <StickersView />,
    effects: (
      <div className="p-4 text-muted-foreground">
        特效功能即将推出...
      </div>
    ),
    transitions: <TransitionsView />,
    captions: <Captions />,
    filters: (
      <div className="p-4 text-muted-foreground">
        滤镜功能即将推出...
      </div>
    ),
    settings: <SettingsView />,
  };

  return (
    <div className="h-full flex bg-panel">
      <TabBar />
      <Separator orientation="vertical" />
      <div className="flex-1 overflow-hidden">{viewMap[activeTab]}</div>
    </div>
  );
}
