import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";
import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";

const execAsync = promisify(exec);

// Increase timeout for transcription
export const maxDuration = 300; // 5 minutes

const transcribeRequestSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  language: z.string().optional().default("auto"),
});

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

    // Call the Python transcription script
    // tools directory is at D:\Desktop\AIcut\tools
    // apps/web is at D:\Desktop\AIcut\AIcut-Studio\apps\web
    const scriptPath = path.resolve(process.cwd(), "../../../tools/utils/transcribe_file.py");
    
    // Determine python command
    const pythonCmd = "python"; // Assume in path or handled by env

    console.log(`[Transcribe API] Running transcription for: ${filename}`);
    
    // Set PYTHONIOENCODING to utf-8 to ensure we get UTF-8 output from Python
    const { stdout, stderr } = await execAsync(
      `${pythonCmd} "${scriptPath}" "${filename}" "${language}"`,
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

      return NextResponse.json({
        text: fullText,
        segments: segments,
        language: result.language || language
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
