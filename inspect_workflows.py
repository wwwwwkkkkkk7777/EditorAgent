
import sys
import os
import yaml
from pathlib import Path

# Add project root to sys.path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'VideoAgent'))

# Load intents.yml directly since constructing the full MultiAgent might be heavy/require API keys
def load_intents():
    config_path = Path("VideoAgent/environment/config/intents.yml")
    if not config_path.exists():
        print(f"Error: {config_path} not found")
        return {}
    
    with open(config_path, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    return data

def main():
    intents = load_intents()
    print("Loaded Intents:")
    
    # Map our UI modes to Intents
    mode_mapping = {
        "News": "News", # Likely 'News'
        "CrossTalk": "CrossTalk",
        "Talk Show": "Stand-up Comedy",
        "MAD TTS": "Text-to-Speech",
        "MAD SVC": "Singing Voice Conversion"
    }
    
    for ui_mode, intent_key in mode_mapping.items():
        steps = intents.get(intent_key, [])
        print(f"\n[{ui_mode}] (mapped to '{intent_key}'):")
        for step in steps:
            # Try to get tool description if possible (would need to assume path pattern)
            print(f"  - {step}")

    # Also check if Video Edit steps should be appended to News
    print(f"\n[Check]: Does 'News' need 'Video Edit' steps?")
    # Based on logic, if News produces scenes/audio but not a video file, it needs Editor.
    # Looking at NewsContentGenerator Output: video_scene_path
    # Looking at VoiceGenerator Output: audio_path
    # Neither produces a final .mp4. So VideoEditor is needed.

if __name__ == "__main__":
    main()
