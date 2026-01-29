import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

const analyzeRequestSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const validationResult = analyzeRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid request parameters",
        details: validationResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { filename } = validationResult.data;
    const scriptPath = path.resolve(process.cwd(), "../../../tools/utils/analyze_beats.py");
    const pythonCmd = "python";

    const { stdout, stderr } = await execAsync(
      `${pythonCmd} "${scriptPath}" "${filename}"`,
      { env: { ...process.env, PYTHONIOENCODING: "utf-8" }, maxBuffer: 5 * 1024 * 1024 }
    );

    if (stderr && !stdout) {
      console.error("[Analyze Beats API] Python Error:", stderr);
      return NextResponse.json({ error: "Beat analysis error", message: stderr }, { status: 500 });
    }

    let result: any = null;
    try {
      result = JSON.parse(stdout);
    } catch (e) {
      console.error("[Analyze Beats API] Failed to parse python output:", stdout);
      return NextResponse.json({ error: "Failed to parse beat analysis result" }, { status: 500 });
    }

    return NextResponse.json({ beats: result?.beats || [] });
  } catch (e) {
    console.error("[Analyze Beats API] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error", details: String(e) }, { status: 500 });
  }
}
