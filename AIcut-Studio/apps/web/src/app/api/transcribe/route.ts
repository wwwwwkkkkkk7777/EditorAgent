import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";
import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import fs from "fs";
import crypto from "crypto";

const execAsync = promisify(exec);

// Increase timeout for transcription
export const maxDuration = 300; // 5 minutes

const transcribeRequestSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  language: z.string().optional().default("auto"),
});

const WORKSPACE_ROOT = path.resolve(process.cwd(), "../../../");
const TRANSCRIPTS_DIR = path.join(WORKSPACE_ROOT, "ai_workspace", "video_transcripts");

function ensureTranscriptDir() {
  if (!fs.existsSync(TRANSCRIPTS_DIR)) {
    fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
  }
}

function generateTranscriptId(filePath: string): string {
  return crypto.createHash("md5").update(filePath).digest("hex").substring(0, 12);
}

function getTranscriptJsonPath(id: string): string {
  return path.join(TRANSCRIPTS_DIR, `${id}.json`);
}

function getTranscriptTxtPath(id: string): string {
  return path.join(TRANSCRIPTS_DIR, `${id}.txt`);
}

function resolveLocalPath(inputPath: string): string {
  if (!inputPath) return inputPath;

  // Support /api/media/serve?path=... or full URL with query param
  const queryMatch = inputPath.match(/[?&]path=([^&]+)/);
  if (queryMatch?.[1]) {
    try {
      return decodeURIComponent(queryMatch[1]);
    } catch {
      // fall through
    }
  }

  if (inputPath.startsWith("file://")) {
    try {
      const url = new URL(inputPath);
      return decodeURIComponent(url.pathname).replace(/^\/([A-Za-z]:)/, "$1");
    } catch {
      return inputPath.replace("file://", "");
    }
  }

  return inputPath;
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validationResult = transcribeRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { filename, language } = validationResult.data;
    const resolvedFilename = resolveLocalPath(filename);

    ensureTranscriptDir();
    const transcriptId = generateTranscriptId(resolvedFilename);
    const transcriptJsonPath = getTranscriptJsonPath(transcriptId);
    const transcriptTxtPath = getTranscriptTxtPath(transcriptId);

    // Return cached transcript if available
    if (fs.existsSync(transcriptJsonPath)) {
      try {
        const cached = JSON.parse(fs.readFileSync(transcriptJsonPath, "utf-8"));
        if (cached?.text && Array.isArray(cached?.segments)) {
          return NextResponse.json({
            text: cached.text,
            segments: cached.segments,
            language: cached.language || language,
            cached: true,
          });
        }
      } catch {
        // Ignore cache read errors and proceed to transcribe
      }
    }

    // Call the Python transcription script
    // tools directory is at D:\Desktop\AIcut\tools
    // apps/web is at D:\Desktop\AIcut\AIcut-Studio\apps\web
    const scriptPath = path.resolve(process.cwd(), "../../../tools/utils/transcribe_file.py");
    
    // Determine python command
    const pythonCmd = "python"; // Assume in path or handled by env

    console.log(`[Transcribe API] Running transcription for: ${resolvedFilename}`);
    
    // Set PYTHONIOENCODING to utf-8 to ensure we get UTF-8 output from Python
    const { stdout, stderr } = await execAsync(
      `${pythonCmd} "${scriptPath}" "${resolvedFilename}" "${language}"`,
      { 
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for long transcriptions
      }
    );

    if (stderr && !stdout) {
      console.error("[Transcribe API] Python Error:", stderr);
      return NextResponse.json(
        { error: "Transcription engine error", message: stderr },
        { status: 500 }
      );
    }

    console.log(`[Transcribe API] Python output: ${stdout}`);

    try {
      const result = JSON.parse(stdout);
      
      if (result.error) {
        return NextResponse.json(
          { error: result.error, message: result.message || result.error },
          { status: 500 }
        );
      }

      // Handle both local whisper format and DashScope format
      let segments = [];
      if (result.segments) {
        // Local Whisper format (already in seconds)
        segments = result.segments.map((s: any) => ({
          id: s.id,
          text: s.text,
          start: s.start,
          end: s.end,
        }));
      } else if (result.transcripts) {
        // DashScope format (in milliseconds)
        segments = (result.transcripts || []).flatMap((t: any) => 
          (t.sentences || []).map((s: any, idx: number) => ({
            id: idx,
            text: s.text,
            start: s.begin_time / 1000,
            end: s.end_time / 1000,
          }))
        );
      }

      const fullText = result.text || segments.map((s: any) => s.text).join(" ");

      // Cache transcript for reuse (captions + summary)
      try {
        fs.writeFileSync(
          transcriptJsonPath,
          JSON.stringify(
            {
              id: transcriptId,
              sourcePath: resolvedFilename,
              text: fullText,
              segments,
              language: result.language || language,
              createdAt: Date.now(),
            },
            null,
            2
          )
        );
        fs.writeFileSync(transcriptTxtPath, fullText || "", "utf-8");
      } catch (cacheErr) {
        console.warn("[Transcribe API] Failed to cache transcript:", cacheErr);
      }

      return NextResponse.json({
        text: fullText,
        segments: segments,
        language: result.language || language,
        cached: false,
      });

    } catch (parseError) {
      console.error("[Transcribe API] Failed to parse python output:", stdout);
      return NextResponse.json(
        { error: "Failed to parse transcription result" },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error("[Transcribe API] Unexpected error:", e);
    return NextResponse.json(
      { error: "Internal server error", details: String(e) },
      { status: 500 }
    );
  }
}
