import os
import sys
import json
import torch
import warnings

# Suppress warnings to keep stdout clean for JSON
warnings.filterwarnings("ignore")
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import subprocess
import tempfile

def transcribe_local(file_path, language='auto'):
    # The user's provided path
    model_path = "D:/Desktop/AIcut/tools/whisper-large-v3-turbo"
    
    if not os.path.exists(model_path):
        # Check if the folder is actually there or if it's relative to current script
        alt_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "whisper-large-v3-turbo"))
        if os.path.exists(alt_path):
            model_id = alt_path
        else:
            # Fallback to downloading if not found locally
            print(f"DEBUGLOG: Local model path {model_path} not found, using 'openai/whisper-large-v3-turbo'", file=sys.stderr)
            model_id = "openai/whisper-large-v3-turbo"
    else:
        model_id = model_path

    temp_wav = None
    try:
        from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
        
        # --- ROBUSTNESS FIX: Use FFmpeg to normalize audio to 16kHz Mono WAV ---
        # This handles malformed files, MP4s named as WAV, etc.
        try:
            temp_wav = tempfile.mktemp(suffix=".wav")
            print(f"DEBUGLOG: Normalizing audio with FFmpeg to {temp_wav}...", file=sys.stderr)
            # -y: overwrite, -i: input, -ar: rate 16000, -ac: channels 1, output.wav
            subprocess.run([
                "ffmpeg", "-y", "-i", file_path, 
                "-ar", "16000", "-ac", "1", "-vn",
                temp_wav
            ], check=True, capture_output=True)
            input_file = temp_wav
        except Exception as ffmpeg_err:
            print(f"DEBUGLOG: FFmpeg normalization failed: {ffmpeg_err}. Using original file.", file=sys.stderr)
            input_file = file_path

        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

        print(f"DEBUGLOG: Loading model from {model_id} on {device}...", file=sys.stderr)
        
        model = AutoModelForSpeechSeq2Seq.from_pretrained(
            model_id, 
            torch_dtype=torch_dtype, 
            low_cpu_mem_usage=True, 
            use_safetensors=True
        )
        model.to(device)

        processor = AutoProcessor.from_pretrained(model_id)

        pipe = pipeline(
            "automatic-speech-recognition",
            model=model,
            tokenizer=processor.tokenizer,
            feature_extractor=processor.feature_extractor,
            max_new_tokens=128,
            chunk_length_s=30,
            batch_size=16,
            return_timestamps=True,
            torch_dtype=torch_dtype,
            device=device,
        )

        print(f"DEBUGLOG: Transcribing {input_file}...", file=sys.stderr)
        
        # If language is 'auto', detect it from the first chunk to avoid
        # "Multiple languages detected" error in chunked mode
        generate_kwargs = {}
        target_lang = None
        
        if language and language != 'auto':
            lang_map = {"chinese": "zh", "english": "en", "cn": "zh", "us": "en", "zh": "zh", "en": "en"}
            target_lang = lang_map.get(language.lower(), language.lower())
        else:
            # Auto-detect language using the model on a small sample
            print("DEBUGLOG: Detecting language...", file=sys.stderr)
            try:
                import librosa
                audio_sample, _ = librosa.load(input_file, sr=16000, duration=30)
                inputs = processor(audio_sample, sampling_rate=16000, return_tensors="pt")
                inputs = inputs.to(device=device, dtype=torch_dtype)
                
                with torch.no_grad():
                    generated_ids = model.generate(inputs.input_features)
                
                # The first token is usually the language token
                # This depends on the processor/model version
                decoded_ids = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
                # Format is usually <|startoftranscript|><|zh|><|transcribe|><|notimestamps|>...
                import re
                lang_match = re.search(r"<\|(\w\w)\|>", decoded_ids)
                if lang_match:
                    target_lang = lang_match.group(1)
                    print(f"DEBUGLOG: Detected language: {target_lang}", file=sys.stderr)
            except Exception as detect_err:
                print(f"DEBUGLOG: Language detection failed: {detect_err}", file=sys.stderr)
                target_lang = None # Fallback to None (may still cause error if model is confused)

        if target_lang:
            generate_kwargs["language"] = target_lang

        result = pipe(input_file, generate_kwargs=generate_kwargs)
        
        segments = []
        for i, chunk in enumerate(result.get("chunks", [])):
            ts = chunk.get("timestamp", (0, 0))
            segments.append({
                "id": i,
                "text": chunk.get("text", "").strip(),
                "start": float(ts[0]) if ts[0] is not None else 0.0,
                "end": float(ts[1]) if ts[1] is not None else 0.0
            })

        return {
            "text": result.get("text", ""),
            "segments": segments,
            "language": language
        }
    except Exception as e:
        return {"error": f"Whisper Exception: {str(e)}"}
    finally:
        # Cleanup temp file
        if temp_wav and os.path.exists(temp_wav):
            try: os.remove(temp_wav)
            except: pass

if __name__ == "__main__":
    # Force UTF-8 encoding for stdout to avoid GBK errors on Windows
    if sys.platform == "win32":
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)
        
    file_path = sys.argv[1]
    
    # Check if file exists
    if not os.path.exists(file_path):
        # Handle Windows style paths that might have been passed from JS
        file_path = file_path.replace("file:///", "").replace("file://", "")
        if not os.path.exists(file_path):
             print(json.dumps({"error": f"File not found: {file_path}"}))
             sys.exit(1)

    language = sys.argv[2] if len(sys.argv) > 2 else 'auto'
    
    res = transcribe_local(file_path, language)
    print(json.dumps(res, ensure_ascii=False))
