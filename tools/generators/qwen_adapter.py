import os
import sys
import json
import time
import dashscope
from dashscope import Generation, ImageSynthesis
from dashscope.audio.asr import Transcription
from http import HTTPStatus
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def get_dashscope_api_key():
    """从环境变量获取 API Key"""
    return os.getenv("DASHSCOPE_API_KEY")

class QwenClient:
    """阿里云百炼 (Qwen) 大模型适配器"""
    
    def __init__(self, api_key=None, model='qwen-max'):
        self.api_key = api_key or get_dashscope_api_key()
        self.model = model
        if self.api_key:
            dashscope.api_key = self.api_key

    def chat(self, prompt, system_prompt="你是一个专业的视频剪辑助手，擅长编写剪辑脚本和生成时间轴逻辑。"):
        """调用 Qwen 进行文本生成"""
        if not self.api_key:
            return "错误: 未设置 DASHSCOPE_API_KEY"

        try:
            messages = [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': prompt}
            ]
            
            response = Generation.call(
                model=self.model,
                messages=messages,
                result_format='message'
            )

            if response.status_code == HTTPStatus.OK:
                return response.output.choices[0].message.content
            else:
                return f"错误: {response.code} - {response.message}"
        except Exception as e:
            return f"异常: {str(e)}"

    def transcribe(self, file_path):
        """使用 DashScope SenseVoice 进行语音识别 (ASR)"""
        if not self.api_key:
            return None, "错误: 未设置 DASHSCOPE_API_KEY"

        try:
            # 对于 DashScope 异步任务，可以使用本地文件上传 (SDK 会自动处理)
            task_response = Transcription.async_call(
                model='sensevoice-v1',
                file_urls=[f'file://{os.path.abspath(file_path)}']
            )
            
            status = Transcription.wait(task_response)
            if status.status_code == HTTPStatus.OK:
                # 获取结果 URL 并解析
                result_url = status.output.results[0].transcription_url
                import requests
                res = requests.get(result_url)
                return res.json(), None
            else:
                return None, f"ASR 错误: {status.message}"
        except Exception as e:
            return None, f"ASR 异常: {str(e)}"

    def generate_image(self, prompt, output_path, size='1024*1024'):
        """使用 Wanx (万相) 生成图片"""
        if not self.api_key:
            return False, "错误: 未设置 DASHSCOPE_API_KEY"

        try:
            rsp = ImageSynthesis.call(model=ImageSynthesis.Models.wanx_v1,
                                     prompt=prompt,
                                     n=1,
                                     size=size)
            if rsp.status_code == HTTPStatus.OK:
                # 下载图片
                image_url = rsp.output.results[0].url
                import requests
                img_data = requests.get(image_url).content
                with open(output_path, 'wb') as f:
                    f.write(img_data)
                return True, output_path
            else:
                return False, f"图片生成错误: {rsp.message}"
        except Exception as e:
            return False, f"图片生成异常: {str(e)}"

    def generate_timeline_json(self, project_description):
        """让 Qwen 生成符合 AIcut 格式的时间轴 JSON"""
        prompt = f"""
        请根据以下描述生成一个视频剪辑时间轴 JSON。
        视频描述: {project_description}
        
        要求:
        1. 必须符合 AIcut 的 tracks 结构。
        2. 包含 video 轨道和 text 轨道。
        3. 输出纯 JSON，不要包含 Markdown 代码块。
        """
        return self.chat(prompt, system_prompt="你是一个 AI 视频工程师，只输出合法的 JSON 数据。")

if __name__ == "__main__":
    # 测试代码
    client = QwenClient()
    print("正在测试 Qwen API...")
    result = client.chat("你好，请自我介绍。")
    print(f"Qwen 回复: \n{result}")
