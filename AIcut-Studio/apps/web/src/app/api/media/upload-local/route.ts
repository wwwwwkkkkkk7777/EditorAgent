import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

// --- Path Configuration ---
const WORKSPACE_ROOT = path.resolve(process.cwd(), "../../..");
const PROJECTS_DIR = path.join(WORKSPACE_ROOT, "projects");
const SNAPSHOT_FILE = path.join(WORKSPACE_ROOT, "ai_workspace", "project-snapshot.json");

// Helper: Get current project ID from snapshot
function getCurrentProjectId(): string {
    try {
        if (fs.existsSync(SNAPSHOT_FILE)) {
            const data = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf-8"));
            return data.project?.id || "demo";
        }
    } catch (e) { }
    return "demo";
}

// Helper: Get thumbnails directory for current project
function getThumbnailsDir(projectId: string): string {
    return path.join(PROJECTS_DIR, projectId, "assets", "_thumbnails");
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        let file = formData.get("file") as File | null;
        const remoteUrl = formData.get("remoteUrl") as string | null;
        const thumbnail = formData.get("thumbnail") as string; // Optional dataURL
        const width = parseInt(formData.get("width") as string) || 0;
        const height = parseInt(formData.get("height") as string) || 0;
        const duration = parseFloat(formData.get("duration") as string) || 0;
        const originalPath = formData.get("originalPath") as string;
        const soundName = formData.get("name") as string || "audio";

        if (!file && !remoteUrl && !originalPath) return NextResponse.json({ error: "No file, remoteUrl or originalPath provided" }, { status: 400 });

        const projectId = getCurrentProjectId();
        const assetId = `asset_${Date.now().toString().slice(-6)}`;

        let fileName: string = "";
        let mediaType: string = "audio";
        let absolutePath = "";
        let isLinked = false;

        if (remoteUrl && !file) {
            const response = await fetch(remoteUrl);
            if (!response.ok) {
                return NextResponse.json({ error: "Failed to fetch remoteUrl" }, { status: 400 });
            }

            const contentType = response.headers.get("content-type") || "";
            const url = new URL(remoteUrl);
            const urlName = path.basename(url.pathname);
            let ext = path.extname(urlName);

            const contentTypeToExt: Record<string, string> = {
                "audio/mpeg": ".mp3",
                "audio/wav": ".wav",
                "audio/x-wav": ".wav",
                "audio/aac": ".aac",
                "audio/ogg": ".ogg",
                "audio/flac": ".flac",
                "audio/mp4": ".m4a",
                "video/mp4": ".mp4",
                "video/webm": ".webm",
                "image/jpeg": ".jpg",
                "image/png": ".png",
                "image/webp": ".webp",
                "image/gif": ".gif",
            };

            if (!ext) {
                ext = contentTypeToExt[contentType] || ".bin";
            }

            const baseName = soundName || (urlName ? path.basename(urlName, ext) : `asset_${Date.now()}`);
            fileName = `${baseName}${ext}`;

            const extLower = ext.toLowerCase();
            const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
            const audioExts = ['.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a'];
            const isVideoExt = videoExts.includes(extLower);
            const isAudioExt = audioExts.includes(extLower);

            mediaType = contentType.startsWith("video") ? "video"
                : contentType.startsWith("audio") ? "audio"
                    : contentType.startsWith("image") ? "image"
                        : isVideoExt ? "video"
                            : isAudioExt ? "audio"
                                : "image";

            const typeFolder = mediaType === "video" ? "videos"
                : mediaType === "audio" ? "audio"
                    : "images";
            const materialsDir = path.join(PROJECTS_DIR, projectId, "assets", typeFolder);

            if (!fs.existsSync(materialsDir)) {
                fs.mkdirSync(materialsDir, { recursive: true });
            }

            absolutePath = path.join(materialsDir, fileName);
            const buffer = Buffer.from(await response.arrayBuffer());
            fs.writeFileSync(absolutePath, buffer);
        } else if (file || originalPath) {
            fileName = originalPath ? path.basename(originalPath) : (file?.name || "unnamed");
            const ext = path.extname(fileName).toLowerCase();
            const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
            const audioExts = ['.mp3', '.wav', '.aac', '.ogg', '.flac', '.m4a'];

            if (file?.type && file.type !== 'application/octet-stream') {
                mediaType = file.type.startsWith("video") ? "video"
                    : file.type.startsWith("audio") ? "audio"
                        : "image";
            } else {
                mediaType = videoExts.includes(ext) ? "video"
                    : audioExts.includes(ext) ? "audio"
                        : "image";
            }

            if (originalPath) {
                absolutePath = originalPath;
                isLinked = true;
            } else {
                const typeFolder = mediaType === "video" ? "videos"
                    : mediaType === "audio" ? "audio"
                        : "images";
                const materialsDir = path.join(PROJECTS_DIR, projectId, "assets", typeFolder);

                if (!fs.existsSync(materialsDir)) {
                    fs.mkdirSync(materialsDir, { recursive: true });
                }

                absolutePath = path.join(materialsDir, fileName);

                if (file) {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    fs.writeFileSync(absolutePath, buffer);
                }
            }
        } else {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        // Handle thumbnail - save to project thumbnails folder
        let thumbnailUrl: string | undefined;
        const thumbnailsDir = getThumbnailsDir(projectId);
        if (!fs.existsSync(thumbnailsDir)) {
            fs.mkdirSync(thumbnailsDir, { recursive: true });
        }

        if (thumbnail && thumbnail.startsWith("data:image")) {
            const thumbName = fileName.replace(/\.[^.]+$/, ".jpg");
            const thumbPath = path.join(thumbnailsDir, thumbName);
            const base64Data = thumbnail.split(",")[1];
            fs.writeFileSync(thumbPath, Buffer.from(base64Data, "base64"));
            thumbnailUrl = `/api/media/serve?path=${encodeURIComponent(thumbPath)}`;
            console.log(`[Upload API] Saved thumbnail to: ${thumbPath}`);
        }

        // Create URL - use file-serve API for absolute paths
        // Format: /api/media/serve?path=<encoded_absolute_path>
        const mediaUrl = `/api/media/serve?path=${encodeURIComponent(absolutePath)}`;

        // Update Snapshot (Add asset)
        if (fs.existsSync(SNAPSHOT_FILE)) {
            const data = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf-8"));

            const newAsset: any = {
                id: assetId,
                name: fileName,
                type: mediaType,
                url: mediaUrl,
                filePath: absolutePath, // Store absolute path for reference
                originalPath: isLinked ? originalPath : undefined,
                isLinked,
            };

            if (thumbnailUrl) newAsset.thumbnailUrl = thumbnailUrl;
            if (width) newAsset.width = width;
            if (height) newAsset.height = height;
            if (duration) newAsset.duration = duration;

            // Check for duplicates by name (same file might be added multiple times)
            if (!data.assets) data.assets = [];
            const existingIndex = data.assets.findIndex((a: any) => a.name === newAsset.name);
            if (existingIndex >= 0) {
                data.assets[existingIndex] = { ...data.assets[existingIndex], ...newAsset };
                console.log(`[Upload API] Updated existing asset: ${newAsset.name}`);
            } else {
                data.assets.push(newAsset);
                console.log(`[Upload API] Added new asset: ${newAsset.name} (linked: ${isLinked})`);
            }

            fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(data, null, 2));

            // Archive to project directory for persistence
            try {
                const archiveSnapshotPath = path.join(PROJECTS_DIR, projectId, "snapshot.json");
                fs.writeFileSync(archiveSnapshotPath, JSON.stringify(data, null, 2));
                console.log(`[Upload API] Archived to project directory: ${archiveSnapshotPath}`);
            } catch (archiveErr) {
                console.warn(`[Upload API] Failed to archive to project directory:`, archiveErr);
                // Don't fail the request if archiving fails
            }
        } else {
            console.warn("[Upload API] Snapshot file not found, cannot add asset");
        }

        return NextResponse.json({
            success: true,
            url: mediaUrl,
            assetId: assetId,
            isLinked
        });
    } catch (e) {
        console.error("[Upload API] Error:", e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
