import sys
import os
import time
import json

# 确保能找到 aicut_sdk
sdk_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "tools", "core"))
if sdk_path not in sys.path:
    sys.path.append(sdk_path)
from aicut_sdk import AIcutClient

def main():
    client = AIcutClient("http://localhost:3000")
    source_dir = r"D:\Desktop\AIcut\source"
    
    print(f"🎬 开始处理素材...")
    
    # 0. 先清空当前所有轨道，保证从零开始
    print("🧹 清空当前轨道...")
    try:
        empty_snap = client.get_snapshot()
        empty_snap["tracks"] = [{
            "id": "main-track",
            "name": "Main Track",
            "type": "media",
            "elements": [],
            "muted": False,
            "isMain": True
        }]
        empty_snap["assets"] = []
        client.update_snapshot(empty_snap)
    except Exception as e:
        print(f"⚠️ 清空轨道失败: {e}")

    # 动态寻找音频工具函数
    def find_audio():
        music_dir = os.path.join(source_dir, "music")
        tts_dir = os.path.join("D:\\Desktop\\AIcut\\exports", "tts")
        bgm = None
        narration = None

        potential_bgms = [
            os.path.join(music_dir, "SeeYouAgain.mp3"),
            os.path.join(source_dir, "SeeYouAgain.mp3")
        ]
        for p in potential_bgms:
            if os.path.exists(p):
                bgm = p
                break
        
        narr_paths = [
            os.path.join(source_dir, "旁白.mp3"),
            os.path.join(source_dir, "narration.wav")
        ]
        for p in narr_paths:
            if os.path.exists(p):
                narration = p
                break
        
        if not narration and os.path.exists(tts_dir):
            tts_files = sorted([os.path.join(tts_dir, f) for f in os.listdir(tts_dir) if f.endswith(".mp3")])
            if tts_files:
                narration = tts_files[0]
        
        return narration, bgm

    narration_path, bgm_path = find_audio()
    
    if not bgm_path:
        print("❌ 错误: 找不到任何背景音乐素材 (SeeYouAgain.mp3)")
        return

    print("📏 计算素材时长...")
    # client._get_media_duration 是内部方法，但在 SDK 环境中可用
    narration_duration = client._get_media_duration(narration_path) if narration_path else 20.0
    bgm_duration = client._get_media_duration(bgm_path)
    
    print(f"   主要时长: {narration_duration}s")
    print(f"   BGM时长: {bgm_duration}s")

    # 1. 导入旁白
    if narration_path:
        print(f"🎙️  导入旁白: {os.path.basename(narration_path)}")
        client.import_media(
            file_path=narration_path,
            media_type="audio",
            name="narration",
            start_time=0,
            duration=narration_duration, 
            track_name="Narration Track"
        )
    
    # 2. 导入背景音乐
    print(f"🎶 导入背景音乐: {os.path.basename(bgm_path)}")
    client.import_media(
        file_path=bgm_path,
        media_type="audio",
        name="bgm",
        start_time=0,
        duration=min(bgm_duration, narration_duration + 5), 
        track_name="BGM Track"
    )
    
    # 修改 BGM 音量
    snapshot = client.get_snapshot()
    for track in snapshot.get("tracks", []):
        if track.get("name") == "BGM Track":
            for el in track.get("elements", []):
                el["volume"] = 0.2
    client.update_snapshot(snapshot)

    # 3. 导入图片序列
    pic_dir = os.path.join(source_dir, "picture")
    images = []
    if os.path.exists(pic_dir):
        images = [f for f in os.listdir(pic_dir) if f.lower().endswith((".png", ".jpg", ".jpeg"))]
        
    if images:
        images.sort()
        img_step = narration_duration / len(images)
        print(f"🖼️  导入 {len(images)} 张图片，每张展示 {img_step:.2f}秒")
        
        for i, img_name in enumerate(images):
            img_path = os.path.join(pic_dir, img_name)
            client.import_media(
                file_path=img_path,
                media_type="image",
                name=f"素材_{i+1}",
                start_time=i * img_step,
                duration=img_step
            )

    # 4. 应用缩放动画
    final_snapshot = client.get_snapshot()
    for track in final_snapshot.get("tracks", []):
        for el in track.get("elements", []):
            if "素材_" in el.get("name", ""):
                el["scale"] = 1.05 
                if "metadata" not in el: el["metadata"] = {}
                el["metadata"]["animation"] = "zoomIn"

    client.update_snapshot(final_snapshot)
    
    print("✅ 剪辑完成！")

    # 5. 触发刷新
    time.sleep(1) 
    sync_input_path = os.path.join(os.getcwd(), "ai_workspace", "sync-input.json")
    with open(sync_input_path, "w", encoding="utf-8") as f:
        json.dump({"action": "forceRefresh", "timestamp": time.time()}, f)

if __name__ == "__main__":
    main()
