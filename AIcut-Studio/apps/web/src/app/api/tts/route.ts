import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs";

const execAsync = promisify(exec);

const ttsRequestSchema = z.object({
  textElements: z.array(z.object({
    id: z.string().optional(),
    content: z.string().min(1),
    startTime: z.number().default(0),
    duration: z.number().optional(),
    voiceId: z.string().optional(),
  })).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const validationResult = ttsRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid request parameters",
        details: validationResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { textElements } = validationResult.data;

    const scriptPath = path.resolve(process.cwd(), "../../../tools/utils/tts_generate.py");
    const tempPath = path.join(os.tmpdir(), `aicut_tts_${Date.now()}.json`);
    fs.writeFileSync(tempPath, JSON.stringify({ textElements }, null, 2), "utf-8");

    const pythonCmd = "python";
    const { stdout, stderr } = await execAsync(
      `${pythonCmd} "${scriptPath}" "${tempPath}"`,
      {
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    if (stderr && !stdout) {
      console.error("[TTS API] Python Error:", stderr);
      return NextResponse.json({ error: "TTS engine error", message: stderr }, { status: 500 });
    }

    let result: any = null;
    try {
      result = JSON.parse(stdout);
    } catch (e) {
      console.error("[TTS API] Failed to parse python output:", stdout);
      return NextResponse.json({ error: "Failed to parse TTS result" }, { status: 500 });
    } finally {
      try { fs.unlinkSync(tempPath); } catch { }
    }

    return NextResponse.json({ items: result?.items || [] });
  } catch (e) {
    console.error("[TTS API] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error", details: String(e) }, { status: 500 });
  }
}
