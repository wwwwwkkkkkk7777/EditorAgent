import os
import sys
import argparse
from qwen_adapter import QwenClient

def main():
    parser = argparse.ArgumentParser(description="Use Qwen Wanx to generate images")
    parser.add_argument("prompt", type=str, help="The prompt for image generation")
    parser.add_argument("--output", type=str, default="generated_image.png", help="Output file path")
    parser.add_argument("--size", type=str, default="1024*1024", help="Image size (e.g. 1280*720, 1024*1024)")
    
    args = parser.parse_args()
    
    client = QwenClient()
    print(f"🎨 正在生成图片: {args.prompt}...")
    
    success, result = client.generate_image(args.prompt, args.output, size=args.size)
    
    if success:
        print(f"✅ 图片已保存至: {result}")
    else:
        print(f"❌ 生成失败: {result}")

if __name__ == "__main__":
    main()
