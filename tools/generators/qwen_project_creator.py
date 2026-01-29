import os
import sys
import json
import uuid
import time
from qwen_adapter import QwenClient
from aicut_sdk import AIcutClient

# 添加 SDK 路径
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "core"))

def create_qwen_project(topic):
    """
    使用 Qwen 自动生成视频脚本和项目结构
    """
    qwen = QwenClient()
    client = AIcutClient()

    print(f"🧠 正在请求 Qwen 生成视频脚本: {topic}...")
    
    prompt = f"""
    请为主题为“{topic}”的短视频生成一个剪辑大纲。
    要求返回一个 JSON 对象，包含：
    1. title: 视频标题
    2. script: 包含多个分镜的数组，每个分镜包含:
       - subtitle: 字幕内容
       - image_prompt: 描述该分镜画面的英文提示词 (用于 AI 生图)
       - duration: 预计时长 (秒)
    
    只需输出 JSON，不要有任何其他文字。
    """
    
    response_text = qwen.chat(prompt, system_prompt="你是一个专业的短视频编导，只输出合法的 JSON 代码块。")
    
    # 清理 Markdown 代码块包裹
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0].strip()
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0].strip()

    try:
        project_data = json.loads(response_text)
    except Exception as e:
        print(f"❌ 解析 JSON 失败: {e}")
        print(f"原始响应: {response_text}")
        return

    print(f"✅ 脚本已生成: {project_data['title']}")

    # 构建 AIcut Snapshot
    pid = str(uuid.uuid4())
    scene_id = str(uuid.uuid4())
    
    snapshot = {
        "project": {
            "id": pid,
            "name": project_data['title'],
            "thumbnail": "",
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "scenes": [{"id": scene_id, "name": "Main", "isMain": True}],
            "currentSceneId": scene_id,
            "fps": 30,
            "canvasSize": {"width": 1080, "height": 1920}, # 竖屏
        },
        "tracks": [
            {
                "id": "track_text",
                "name": "Subtitles",
                "type": "text",
                "elements": []
            },
            {
                "id": "track_media",
                "name": "Images",
                "type": "media",
                "elements": []
            }
        ],
        "assets": []
    }

    current_time = 0
    for i, scene in enumerate(project_data['script']):
        dur = scene.get('duration', 3)
        
        # 添加字幕
        snapshot['tracks'][0]['elements'].append({
            "id": f"sub_{i}",
            "text": scene['subtitle'],
            "startTime": current_time,
            "duration": dur,
            "style": {"fontSize": 60, "color": "#FFFFFF", "y": 1400}
        })
        
        # 添加占位素材 (这里可以后续集成 Wanx 生图)
        snapshot['tracks'][1]['elements'].append({
            "id": f"img_{i}",
            "type": "image",
            "name": f"Scene_{i}",
            "startTime": current_time,
            "duration": dur,
            "imagePrompt": scene['image_prompt'] # 存入 metadata
        })
        
        current_time += dur

    print("🚀 正在同步至编辑器...")
    # client._post("archiveProject", {}) # 存档旧项目
    client._post("saveSnapshot", snapshot)
    print(f"✨ 项目已创建！请在编辑器中查看: {project_data['title']}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        create_qwen_project(sys.argv[1])
    else:
        create_qwen_project("上海深夜的浪漫故事")
