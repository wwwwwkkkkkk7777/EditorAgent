import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";

const execAsync = promisify(exec);

const WORKSPACE_ROOT = path.resolve(process.cwd(), "../../../");

export async function GET() {
  try {
    const files = fs.readdirSync(WORKSPACE_ROOT);
    const pythonScripts = files
      .filter(f => f.endsWith(".py"))
      .map(f => ({
        name: f,
        path: path.join(WORKSPACE_ROOT, f),
        description: f.includes("auto") ? "自动剪辑脚本" : "功能脚本"
      }));

    return NextResponse.json({ scripts: pythonScripts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { scriptName } = await request.json();
    if (!scriptName) {
      return NextResponse.json({ error: "Missing scriptName" }, { status: 400 });
    }

    const scriptPath = path.join(WORKSPACE_ROOT, scriptName);
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    console.log(`[Automation API] Running script: ${scriptName}`);
    
    // We run it as a background process to avoid blocking the API too long
    // but for simple scripts we can wait. 
    // Given the user wants to see it running, we'll try to execute it.
    
    // We use "python" command and ensure tools/core is in PYTHONPATH
    const pythonCmd = "python"; 
    const pythonPath = [
        path.join(WORKSPACE_ROOT, "tools/core"),
        path.join(WORKSPACE_ROOT, "tools"),
        process.env.PYTHONPATH || ""
    ].filter(Boolean).join(path.delimiter);

    // Use a simpler exec for long running scripts or spawn
    exec(`${pythonCmd} "${scriptPath}"`, {
        cwd: WORKSPACE_ROOT,
        env: { 
            ...process.env, 
            PYTHONIOENCODING: "utf-8",
            PYTHONPATH: pythonPath
        }
    }, (error, stdout, stderr) => {
        if (error) {
            console.error(`[Automation API] Error running ${scriptName}:`, error);
        }
        console.log(`[Automation API] ${scriptName} stdout:`, stdout);
        if (stderr) console.error(`[Automation API] ${scriptName} stderr:`, stderr);
    });

    return NextResponse.json({ 
        success: true, 
        message: `脚本 ${scriptName} 已启动。请查看控制台或等待同步指令。` 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
