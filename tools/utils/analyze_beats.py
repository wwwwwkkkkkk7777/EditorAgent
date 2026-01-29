import json
import math
import os
import sys
import tempfile
import wave
import audioop
import subprocess


def convert_to_wav(file_path):
    try:
        temp_dir = tempfile.gettempdir()
        wav_path = os.path.join(temp_dir, f"aicut_bgm_{os.getpid()}.wav")
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


def analyze_beats(file_path):
    wav_path = convert_to_wav(file_path)
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


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"beats": []}))
        return

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"beats": []}))
        return

    beats = analyze_beats(file_path)
    print(json.dumps({"beats": beats}))


if __name__ == "__main__":
    main()
