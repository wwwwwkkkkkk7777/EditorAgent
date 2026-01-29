import { NextRequest, NextResponse } from "next/server";

const MOCK_SOUNDS = [
  // --- Effects ---
  {
    id: 1,
    name: "Cinematic Swoosh",
    username: "Pixabay",
    description: "High quality cinematic swoosh for transitions.",
    previewUrl: "https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73430.mp3",
    previews: {
      "preview-lq-mp3": "https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73430.mp3",
    },
    duration: 1.5,
    tags: ["whoosh", "transition", "cinematic"],
    type: "effects",
    license: "CC0",
  },
  {
    id: 2,
    name: "Calm Nature Birds",
    username: "Pixabay",
    description: "Relaxing birds singing in the morning forest.",
    previewUrl: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0a1b80db1.mp3",
    previews: {
      "preview-lq-mp3": "https://cdn.pixabay.com/audio/2022/01/18/audio_d0a1b80db1.mp3",
    },
    duration: 45,
    tags: ["nature", "birds", "ambient"],
    type: "effects",
    license: "CC0",
  },
  {
    id: 3,
    name: "Tech Notification",
    username: "Pixabay",
    description: "Modern tech chime for notifications.",
    previewUrl: "https://cdn.pixabay.com/audio/2021/08/04/audio_0625c13af1.mp3",
    previews: {
      "preview-lq-mp3": "https://cdn.pixabay.com/audio/2021/08/04/audio_0625c13af1.mp3",
    },
    duration: 0.8,
    tags: ["notification", "chime", "tech"],
    type: "effects",
    license: "CC0",
  },
  // --- Music ---
  {
    id: 101,
    name: "Lofi Beat Background",
    username: "Mixkit",
    description: "Chill lofi hip hop beat for background music.",
    previewUrl: "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
    previews: {
      "preview-lq-mp3": "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
    },
    duration: 156,
    tags: ["music", "lofi", "chill"],
    type: "music",
    license: "Mixkit Free",
  },
  {
    id: 102,
    name: "Corporate Motivation",
    username: "Pixabay",
    description: "Upbeat corporate music for presentations.",
    previewUrl: "https://cdn.pixabay.com/audio/2022/07/25/audio_32ad9f3d58.mp3",
    previews: {
      "preview-lq-mp3": "https://cdn.pixabay.com/audio/2022/07/25/audio_32ad9f3d58.mp3",
    },
    duration: 180,
    tags: ["music", "corporate", "happy"],
    type: "music",
    license: "CC0",
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "effects";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 20;

    const apiKey = process.env.FREESOUND_API_KEY;

    if (apiKey) {
      // Freesound doesn't have a clean "music" vs "effects" type in the same way,
      // but we can query with tags.
      const queryType = type === "music" ? "music" : "";
      const freesoundUrl = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query + " " + queryType)}&page=${page}&token=${apiKey}&fields=id,name,description,previews,duration,username,tags,license`;
      const response = await fetch(freesoundUrl);
      if (response.ok) {
        const data = await response.json();
        // Map previewUrl for compatibility
        if (data.results) {
          data.results = data.results.map((s: any) => ({
            ...s,
            previewUrl: s.previews?.["preview-lq-mp3"] || s.previews?.["preview-hq-mp3"]
          }));
        }
        return NextResponse.json(data);
      }
    }

    // Fallback to MOCK_SOUNDS
    let results = MOCK_SOUNDS.filter(s => s.type === type);
    
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    const start = (page - 1) * pageSize;
    const paginated = results.slice(start, start + pageSize);

    return NextResponse.json({
      results: paginated,
      count: results.length,
      next: results.length > start + pageSize ? page + 1 : null
    });
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Transcription not configured",
      message: `Auto-captions not available in standalone mode.`,
    },
    { status: 503 }
  );
}
