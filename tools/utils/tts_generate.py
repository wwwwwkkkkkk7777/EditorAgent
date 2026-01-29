import asyncio
import json
import os
import sys
import time
import re
import edge_tts


def load_payload(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def resolve_workspace_root():
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def resolve_output_dir(workspace_root):
    default_dir = os.path.join(
        workspace_root, "AIcut-Studio", "apps", "web", "public", "assets", "tts"
    )
    snapshot_path = os.path.join(workspace_root, "ai_workspace", "project-snapshot.json")
    try:
        if os.path.exists(snapshot_path):
            with open(snapshot_path, "r", encoding="utf-8") as f:
                snapshot = json.load(f)
            project_id = snapshot.get("project", {}).get("id")
            if project_id:
                project_audio_dir = os.path.join(
                    workspace_root, "projects", project_id, "assets", "audio"
                )
                os.makedirs(project_audio_dir, exist_ok=True)
                return project_audio_dir
    except Exception:
        pass

    os.makedirs(default_dir, exist_ok=True)
    return default_dir


async def generate_single(text, voice_id, output_path):
    communicate = edge_tts.Communicate(text, voice_id)
    await communicate.save(output_path)


async def run_generation(text_elements, output_dir):
    tasks = []
    outputs = []
    for idx, el in enumerate(text_elements):
        content = el.get("content", "").strip()
        if not content:
            continue
        el_id = el.get("id") or f"{int(time.time()*1000)}_{idx}"
        safe_id = re.sub(r"[^a-zA-Z0-9_-]", "_", str(el_id))
        filename = f"tts_{safe_id}.mp3"
        filepath = os.path.join(output_dir, filename)
        voice_id = el.get("voiceId") or "zh-CN-XiaoxiaoNeural"
        tasks.append(generate_single(content, voice_id, filepath))
        outputs.append({
            "filePath": filepath,
            "name": f"TTS: {content[:10]}",
            "startTime": el.get("startTime", 0),
            "duration": el.get("duration"),
        })

    if tasks:
        await asyncio.gather(*tasks)
    return outputs


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"items": []}))
        return

    payload_path = sys.argv[1]
    if not os.path.exists(payload_path):
        print(json.dumps({"items": []}))
        return

    payload = load_payload(payload_path)
    text_elements = payload.get("textElements", [])
    if not isinstance(text_elements, list) or not text_elements:
        print(json.dumps({"items": []}))
        return

    workspace_root = resolve_workspace_root()
    output_dir = resolve_output_dir(workspace_root)

    outputs = asyncio.run(run_generation(text_elements, output_dir))
    print(json.dumps({"items": outputs}, ensure_ascii=False))


if __name__ == "__main__":
    main()
