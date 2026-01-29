import os
import json
import time
import requests
import subprocess
import sys
import tempfile
from typing import List, Dict, Optional
from aicut_sdk import AIcutClient
from dotenv import load_dotenv
import asyncio
import edge_tts
import re
import wave
import audioop
import math

# 强制 UTF-8 编码，防止 Windows 下输出乱码
if sys.stdout.encoding.lower() != 'utf-8':
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8')
    except:
        pass

print("[AI Daemon] Script loaded. Initializing heartbeat...", flush=True)

load_dotenv()

# 配置
WORKSPACE_ROOT = os.environ.get('WORKSPACE_ROOT', os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
api_port = os.environ.get('API_PORT', '3000')
BASE_URL = f"http://localhost:{api_port}"
POLL_INTERVAL = 0.5

class AIDaemon:
    def __init__(self):
        self.workspace_root = os.path.abspath(WORKSPACE_ROOT)
        self.client = AIcutClient(BASE_URL)
        self.processed_tasks = set()
        self.tts_cooldowns = {}
        
    def log(self, msg):
        print(f"[AI Daemon] {msg}", flush=True)

    def get_snapshot(self):
        try:
            # 优先通过接口获取，保证最新且包含 assets 信息
            return self.client._get("getSnapshot")
        except Exception as e:
            self.log(f"Error getting snapshot via API: {e}")
            return None

    def get_file_duration(self, file_path):
        try:
            cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file_path]
            result = subprocess.run(cmd, capture_output=True, check=False)
            if result.returncode == 0:
                output = result.stdout.decode('utf-8', errors='replace').strip()
                return float(output)
        except Exception as e:
            pass
        return None

    def _convert_to_wav(self, file_path):
        try:
            temp_dir = tempfile.gettempdir()
            wav_path = os.path.join(temp_dir, f"aicut_bgm_{int(time.time())}.wav")
            cmd = [
                "ffmpeg", "-y", "-i", file_path,
                "-ac", "1", "-ar", "44100",
                "-f", "wav", wav_path
            ]
            subprocess.run(cmd, capture_output=True, check=False)
            if os.path.exists(wav_path) and os.path.getsize(wav_path) > 1000:
                return wav_path
        except Exception:
            pass
        return None

    def analyze_beats(self, file_path):
        wav_path = self._convert_to_wav(file_path)
        if not wav_path:
            return []

        rms_values = []
        sample_rate = 44100
        hop_size = 1024

        try:
            with wave.open(wav_path, "rb") as wf:
                sample_rate = wf.getframerate()
                sample_width = wf.getsampwidth()
                channels = wf.getnchannels()
                if channels != 1:
                    return []
                while True:
                    frames = wf.readframes(hop_size)
                    if not frames:
                        break
                    rms = audioop.rms(frames, sample_width)
                    rms_values.append(rms)
        except Exception:
            return []
        finally:
            try:
                os.remove(wav_path)
            except Exception:
                pass

        if not rms_values:
            return []

        mean = sum(rms_values) / len(rms_values)
        var = sum((v - mean) ** 2 for v in rms_values) / max(1, len(rms_values) - 1)
        std = math.sqrt(var)
        threshold = mean + std * 1.5

        beats = []
        min_interval = 0.3
        last_time = -999.0

        for i in range(1, len(rms_values) - 1):
            v = rms_values[i]
            if v < threshold:
                continue
            if v <= rms_values[i - 1] or v < rms_values[i + 1]:
                continue
            t = (i * hop_size) / float(sample_rate)
            if t - last_time >= min_interval:
                beats.append(round(t, 3))
                last_time = t

        return beats

    def find_local_file(self, filename, target_duration=None, hint_path=None):
        skip_dirs = {'.git', 'node_modules', '.next', 'dist-electron', 'dist', 'bin', 'obj', 'ai_workspace'}
        target_name = filename.strip()
        
        # 1. 如果有通过媒体信息传来的绝对路径，优先使用
        if hint_path and os.path.exists(hint_path):
            self.log(f"Using absolute path from project assets: {hint_path}")
            return os.path.normpath(hint_path)

        # 2. 直接检查
        if os.path.isabs(target_name) and os.path.exists(target_name):
            return target_name

        # 2. 构造搜索根目录 (包含更深层的查找)
        # 如果工作区在 f:\桌面\开发\AIcut, 我们希望搜到 f:\桌面 的内容
        search_roots = [
            self.workspace_root,
            os.path.join(self.workspace_root, 'public'),
            os.path.join(self.workspace_root, 'AIcut-Studio', 'apps', 'web', 'public'),
            os.path.dirname(self.workspace_root), # f:\桌面\开发
            os.path.dirname(os.path.dirname(self.workspace_root)) # f:\桌面
        ]

        # self.log(f"Searching for file: '{target_name}' in {search_roots}")

        # 先查文件名完全匹配的 (尝试带/不带后缀)
        name_no_ext = os.path.splitext(target_name)[0].lower()
        for base in search_roots:
            if not os.path.exists(base): continue
            for root, dirs, files in os.walk(base):
                dirs[:] = [d for d in dirs if d not in skip_dirs]
                for f in files:
                    f_lower = f.lower()
                    f_no_ext = os.path.splitext(f_lower)[0]
                    if f_lower == target_name.lower() or f_no_ext == name_no_ext:
                        found = os.path.normpath(os.path.join(root, f))
                        # self.log(f"Match found by name: {found}")
                        return found

        # 3. 时长匹配 (放宽到 2秒 误差，针对视频文件)
        if target_duration:
            self.log(f"No name match, trying duration match ({target_duration:.2f}s, tolerance 2s)...")
            for base in search_roots:
                if not os.path.exists(base): continue
                for root, dirs, files in os.walk(base):
                    dirs[:] = [d for d in dirs if d not in skip_dirs]
                    for f in files:
                        if f.lower().endswith(('.mp4', '.mp3', '.wav', '.m4a', '.mov', '.webm')):
                            path = os.path.join(root, f)
                            d = self.get_file_duration(path)
                            if d and abs(d - target_duration) < 2.0:
                                self.log(f"Match found by duration: {f} ({d:.2f}s)")
                                return os.path.normpath(path)
        return None

    def recognize_and_sync(self, file_path, element_id, element_config):
        dashscope_key = os.environ.get("DASHSCOPE_API_KEY")
        groq_key = os.environ.get("GROQ_API_KEY")
        
        if not dashscope_key and not groq_key:
            self.log("Error: Neither DASHSCOPE_API_KEY nor GROQ_API_KEY is set.")
            return

        temp_audio = None
        try:
            self.log(f"Element Config Debug: {element_config}")
            trim_start = element_config.get('trimStart', 0)
            trim_end = element_config.get('trimEnd', 0)
            asset_duration = element_config.get('duration', 0)
            el_start = element_config.get('startTime', 0)
            
            # 计算片元在时间轴上的实际可见长度
            effective_dur = asset_duration - trim_start - trim_end
            if effective_dur <= 0.1:
                # 容错：如果计算结果太小，可能 duration 指的是可见长度
                effective_dur = max(0.1, asset_duration)
                
            self.log(f"Recognizing: {os.path.basename(file_path)} (File Offset: {trim_start:.2f}s, Visible Len: {effective_dur:.2f}s)")

            # 统一提取音频子集
            temp_dir = tempfile.gettempdir()
            temp_audio = os.path.join(temp_dir, f"aicut_slice_{int(time.time())}.wav")
            
            self.log(f"Extracting precise WAV slice: {trim_start}s for {effective_dur}s...")
            # 使用 ffmpeg 提取对应片段 (使用 wav 以获得更准确的时间戳)
            cmd = [
                "ffmpeg", "-y", "-ss", str(trim_start), "-t", str(effective_dur),
                "-i", file_path, "-vn", "-ar", "16000", "-ac", "1", "-f", "wav", temp_audio
            ]
            proc = subprocess.run(cmd, capture_output=True, check=False)
            if proc.returncode != 0:
                 self.log(f"FFmpeg Error Output: {proc.stderr.decode('utf-8', 'ignore')}")

            work_file = temp_audio if os.path.exists(temp_audio) and os.path.getsize(temp_audio) > 100 else file_path
            is_sliced = (work_file == temp_audio)

            final_subtitles = []
            
            # --- 分支 1: 使用 阿里云百炼 (DashScope) ---
            if dashscope_key:
                try:
                    self.log("Using DashScope (SenseVoice) for recognition...")
                    import dashscope
                    from dashscope.audio.asr import Transcription
                    from http import HTTPStatus
                    
                    dashscope.api_key = dashscope_key
                    # 使用 file:// 协议上传本地文件 (DashScope SDK 会自动处理)
                    abs_path = os.path.abspath(work_file)
                    file_url = f'file://{abs_path.replace("\\", "/")}'
                    
                    task_response = Transcription.async_call(
                        model='sensevoice-v1',
                        file_urls=[file_url],
                        language_hints=['zh', 'en']
                    )
                    
                    status = Transcription.wait(task_response)
                    if status.status_code == HTTPStatus.OK:
                        # 识别结果是一个 URL，指向详细的 JSON
                        result_url = status.output.results[0].transcription_url
                        resp = requests.get(result_url)
                        data = resp.json()
                        
                        # DashScope SenseVoice 格式解析
                        # 结构: {"transcripts": [{"sentences": [{"begin_time": ms, "end_time": ms, "text": "..."}]}]}
                        transcripts = data.get("transcripts", [])
                        if transcripts:
                            sentences = transcripts[0].get("sentences", [])
                            for sent in sentences:
                                s = sent.get("begin_time", 0) / 1000.0
                                e = sent.get("end_time", 0) / 1000.0
                                text = sent.get("text", "").strip()
                                
                                if not text: continue
                                
                                sync_s = el_start + s if is_sliced else el_start + (max(trim_start, s) - trim_start)
                                sync_e = el_start + e if is_sliced else el_start + (min(trim_start + effective_dur, e) - trim_start)
                                
                                final_subtitles.append({
                                    "text": text,
                                    "startTime": sync_s,
                                    "duration": sync_e - sync_s,
                                })
                    else:
                        self.log(f"DashScope API Error: {status.message}")
                        if groq_key: self.log("Falling back to Groq...")
                        else: return
                except Exception as ds_err:
                    self.log(f"DashScope Failed: {ds_err}")
                    if not groq_key: return

            # --- 分支 2: 使用 Groq (只有在 DashScope 没产生结果且 Groq Key 存在时运行) ---
            if not final_subtitles and groq_key:
                # Check file size for Groq API limit (25MB)
                file_size_mb = os.path.getsize(work_file) / (1024 * 1024)
                # ... (后面接原来的 Groq 逻辑，此处省略部分代码以匹配 replace_string_in_file)
                    seg_text = seg["text"].strip()
                    
                    # 在 word 列表中找到属于这个 segment 的词
                    sub_words = [w for w in words if w["start"] >= seg_start - 0.1 and w["end"] <= seg_end + 0.1]
                    if sub_words:
                        # 使用第一个词的开始和最后一个词的结束，剔除前后的空白
                        true_start = sub_words[0]["start"]
                        true_end = sub_words[-1]["end"]
                        processed_segments.append({"start": true_start, "end": true_end, "text": seg_text})
                    else:
                        processed_segments.append(seg)

            final_subtitles = []
            for seg in processed_segments:
                s, e = seg.get("start"), seg.get("end")
                text = seg.get("text", "").strip()
                self.log(f"  > Refined Segment: [{s:.2f}s - {e:.2f}s] text: {text}")
                if not text: continue
                
                # 如果是切片，结果时间是相对于 0 的
                # 如果是全量，结果时间是相对于文件开头的
                if is_sliced:
                    sync_s = el_start + s
                    sync_e = el_start + e
                else:
                    # 过滤和映射
                    if e <= trim_start or s >= (trim_start + effective_dur): continue
                    v_s = max(trim_start, s)
                    v_e = min(trim_start + effective_dur, e)
                    sync_s = el_start + (v_s - trim_start)
                    sync_e = el_start + (v_e - trim_start)
                
                if sync_e - sync_s > 0.1:
                    # 避免字幕过长 (比如 Whisper 把一段很长的空白也算进去了)
                    if len(text) < 5 and (sync_e - sync_s) > 4:
                        self.log(f"Skipping potentially stretched subtitle: {text}")
                        continue
                        
                    subtitles.append({
                        "text": text,
                        "startTime": sync_s,
                        "duration": sync_e - sync_s,
                    })

            if subtitles:
                self.client.add_subtitles(subtitles)
                self.log(f"Synced {len(subtitles)} subtitles.")
            else:
                self.log("No speech segments detected.")

        except Exception as e:
            self.log(f"Error during recognition: {e}")
        finally:
            if temp_audio and os.path.exists(temp_audio):
                try: os.remove(temp_audio)
                except: pass

    def emit_event(self, action, data):
        """
        通过标准输出直接发送事件给 Electron 前端 (IPC)
        格式: ::AI_EVENT::{json_data}
        """
        payload = {
            "id": f"evt_{int(time.time()*1000)}",
            "action": action,
            "data": data,
            "timestamp": int(time.time())
        }
        # 使用特殊前缀供前端解析
        print(f"::AI_EVENT::{json.dumps(payload)}", flush=True)

    async def generate_tts(self, text_elements):
        # 去重: 根据 ID 去重，防止前端发来重复请求
        unique_elements = {}
        now = time.time()
        
        for el in text_elements:
            el_id = el.get("id")
            # Check cooldown (10 seconds)
            if el_id in self.tts_cooldowns:
                if now - self.tts_cooldowns[el_id] < 10:
                    self.log(f"  > Skipping {el_id} (cooldown)")
                    continue
            
            unique_elements[el_id] = el
            self.tts_cooldowns[el_id] = now
            
        text_elements = list(unique_elements.values())
        
        if not text_elements:
            self.log("No new TTS tasks to process.")
            return

        self.log(f"Starting Parallel TTS generation for {len(text_elements)} segments...")
        
        # 确定输出目录：改为直接输出到项目 assets/audio (如有) 或者保持原样
        # 更好的策略：
        # 1. 检测当前活跃项目ID (通过快照)
        # 2. 如果能找到项目目录，优先输出到 projects/<id>/assets/audio
        # 3. 否则回退到 public/assets/tts
        
        output_dir = os.path.join(self.workspace_root, "AIcut-Studio", "apps", "web", "public", "assets", "tts")
        
        try:
            snapshot = self.get_snapshot().get("snapshot", {})
            project_id = snapshot.get("project", {}).get("id")
            if project_id:
                project_audio_dir = os.path.join(self.workspace_root, "projects", project_id, "assets", "audio")
                if os.path.exists(os.path.dirname(project_audio_dir)): # assets dir exists
                    os.makedirs(project_audio_dir, exist_ok=True)
                    output_dir = project_audio_dir
                    self.log(f"Redirecting TTS output to project assets: {output_dir}")
        except Exception:
            pass # Fallback to default
            
        os.makedirs(output_dir, exist_ok=True)
        
        # 并发处理
        # Create tasks
        tasks = [self._process_single_tts(el, output_dir) for el in text_elements]
        results = await asyncio.gather(*tasks)
        
        # 过滤掉失败的结果 (None)
        valid_results = [r for r in results if r is not None]

        if valid_results:
            # 为本次生成创建一个新的专用轨道，防止重叠
            import datetime
            time_str = datetime.datetime.now().strftime("%H:%M:%S")
            batch_track_name = f"AI 语音 {time_str}"
            
            self.log(f"Importing clean TTS batch to new track: {batch_track_name}")

            for item in valid_results:
                try:
                    # 使用 SDK 直接导入到项目快照，类似 aicut_tool.py 的行为
                    # 这会更新 project-snapshot.json
                    res = self.client.import_media(
                        file_path=item["filePath"],
                        media_type="audio", 
                        name=item["name"],
                        start_time=item["startTime"],
                        track_name=batch_track_name
                    )
                    
                    if res and res.get("success"):
                         self.log(f"  > Imported asset: {item['name']}")
                    else:
                         self.log(f"  ! Import failed for {item['name']}: {res}")
                         
                except Exception as e:
                    self.log(f"  ! API Error importing {item['name']}: {e}")

            # 通知前端刷新 (可选，如果 import_media 内部已经触发了 updateSnapshot，前端 SSE 会收到通知)
            # 但为了保险，我们可以发一个简单的 refresh 信号或者什么都不做
            # self.emit_event("refreshProject", {}) 
        else:
            self.log("TTS generation completed but no audio files were generated.")

    async def _process_single_tts(self, el, output_dir):
        text = el.get("content", "")
        el_id = el.get("id")
        start_time = el.get("startTime", 0)
        voice_id = el.get("voiceId", "zh-CN-XiaoxiaoNeural")  # 默认使用晓晓
        
        if not text:
            return None
            
        filename = f"tts_{el_id}.mp3"
        filepath = os.path.join(output_dir, filename)
        
        self.log(f"  > Generating voice for: {text[:20]}... (voice: {voice_id})")
        
        try:
            # Always regenerate to ensure latest text content is used
            # 使用 edge-tts 生成语音
            communicate = edge_tts.Communicate(text, voice_id)
            await communicate.save(filepath)
            # Ensure file is flushed
            for _ in range(10):
                if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
                    break
                await asyncio.sleep(0.5)
            await asyncio.sleep(0.2) # Extra buffer

            # Verify file integrity
            if not os.path.exists(filepath) or os.path.getsize(filepath) < 100:
                raise Exception("Generated audio file is too small or missing")
            
            # 返回结果而不是直接发送
            return {
                "filePath": filepath,
                "name": f"TTS: {text[:10]}",
                "startTime": start_time,
                "duration": None # Let frontend calculate
            }
            
        except Exception as e:
            self.log(f"  X Error generating TTS for segment {el_id}: {e}")
            return None

    async def generate_tts_preview(self, voice_id: str, text: str):
        """生成音色试听预览"""
        self.log(f"Generating TTS preview for voice: {voice_id}")
        
        output_dir = os.path.join(self.workspace_root, "AIcut-Studio", "apps", "web", "public", "assets", "tts")
        os.makedirs(output_dir, exist_ok=True)
        
        # 使用音色ID作为文件名，只替换非法字符（保留字母数字和破折号）
        safe_voice_id = re.sub(r'[^a-zA-Z0-9-]', '_', voice_id)
        filename = f"preview_{safe_voice_id}.mp3"
        filepath = os.path.join(output_dir, filename)
        
        try:
            # 检查文件是否已存在且有效 (增量缓存)
            if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
                self.log(f"  > Start preview using cached file: {filename}")
                return

            # 使用 edge-tts 生成语音
            communicate = edge_tts.Communicate(text, voice_id)
            await communicate.save(filepath)
            await asyncio.sleep(0.3)
            
            if os.path.exists(filepath) and os.path.getsize(filepath) > 100:
                self.log(f"  > Preview generated: {filename}")
            else:
                raise Exception("Generated preview file is too small or missing")
                
        except Exception as e:
            self.log(f"  X Error generating TTS preview: {e}")

    def run(self):
        self.log(f"AI Daemon started. Root: {self.workspace_root}")
        poll_count = 0
        while True:
            try:
                poll_count += 1
                resp = self.client._get("getPendingEdits")
                if poll_count % 20 == 0:
                    # self.log("Heartbeat...")
                    pass

                edits = resp.get("edits", [])
                processed_ids = []
                
                for task in edits:
                    task_id = task.get("id")
                    if task_id in self.processed_tasks or task.get("processed"):
                        continue
                    
                    # 立即标记为正在处理/已处理，避免 polling 重复抓取
                    self.processed_tasks.add(task_id)
                    self.client._post("markProcessed", {"ids": [task_id]})
                    
                    if task.get("action") == "requestTask":
                        data = task.get("data", {})
                        if data.get("taskType") == "subtitle_generation":
                            m_name = data.get("mediaName")
                            m_id = data.get("mediaId")
                            e_id = data.get("elementId")
                            
                            self.log(f"New Recognition Task: {m_name}")
                            
                            # 获取快照
                            resp = self.get_snapshot()
                            snap = resp.get("snapshot") if resp and resp.get("success") else None
                            el_config = None
                            m_dur = None
                            if snap:
                                for t in snap.get("tracks", []):
                                    for el in t.get("elements", []):
                                        if el["id"] == e_id:
                                            el_config = el
                                            break
                                    if el_config: break
                                for asset in snap.get("assets", []):
                                    if asset["id"] == m_id:
                                        m_dur = asset.get("duration")
                                        break
                                        
                            if el_config:
                                m_path_hint = None
                                if snap:
                                    for asset in snap.get("assets", []):
                                        if asset["id"] == m_id:
                                            m_path_hint = asset.get("filePath")
                                            break
                                
                                file_path = self.find_local_file(m_name, m_dur, m_path_hint)
                                if file_path:
                                    self.recognize_and_sync(file_path, e_id, el_config)
                                else:
                                    self.log(f"File not found on disk: {m_name}")
                            else:
                                self.log(f"Element {e_id} not found in project snapshot.")
                        elif data.get("taskType") == "tts_generation":
                            text_elements = data.get("textElements", [])
                            asyncio.run(self.generate_tts(text_elements))
                        elif data.get("taskType") == "tts_preview":
                            voice_id = data.get("voiceId", "zh-CN-XiaoxiaoNeural")
                            text = data.get("text", "这是一段试听文本")
                            asyncio.run(self.generate_tts_preview(voice_id, text))
                        elif data.get("taskType") == "bgm_beat_analysis":
                            m_name = data.get("mediaName")
                            m_id = data.get("mediaId")
                            m_path_hint = data.get("filePath")

                            snap_resp = self.get_snapshot()
                            snap = snap_resp.get("snapshot") if snap_resp and snap_resp.get("success") else None
                            if snap and m_id and not m_path_hint:
                                for asset in snap.get("assets", []):
                                    if asset.get("id") == m_id:
                                        m_path_hint = asset.get("filePath")
                                        if not m_name:
                                            m_name = asset.get("name")
                                        break

                            if not m_name and snap:
                                for asset in snap.get("assets", []):
                                    if asset.get("type") == "audio":
                                        m_name = asset.get("name")
                                        if not m_path_hint:
                                            m_path_hint = asset.get("filePath")
                                        break

                            file_path = None
                            if m_name or m_path_hint:
                                file_path = self.find_local_file(m_name or "", None, m_path_hint)

                            if file_path:
                                self.log(f"Analyzing BGM beats: {os.path.basename(file_path)}")
                                beats = self.analyze_beats(file_path)
                                if beats:
                                    self.client._post("addMarkers", {"times": beats})
                                    self.log(f"Beat markers added: {len(beats)}")
                                else:
                                    self.log("No beats detected.")
                            else:
                                self.log("BGM beat analysis skipped: audio file not found.")

            except Exception as e:
                self.log(f"Poll error: {e}")
                
            time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    AIDaemon().run()
