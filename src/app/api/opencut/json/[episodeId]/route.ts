import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * GET /api/opencut/json/[episodeId]
 *
 * Serve OpenCut v10 project JSON với CORS headers cho OpenCut-AI (port 3001).
 * Đọc file từ public/scripts/opencut_{episodeId}.json.
 *
 * @returns 200 với JSON project và CORS headers
 * @returns 404 nếu file không tồn tại
 * @sideEffect Read-only — đọc file từ disk
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ episodeId: string }> },
): Promise<NextResponse> {
  const { episodeId } = await params;

  const filePath = path.join(
    process.cwd(),
    "public",
    "scripts",
    `opencut_${episodeId}.json`,
  );

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json(JSON.parse(content), {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3001",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "File not found" },
      {
        status: 404,
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:3001",
        },
      },
    );
  }
}

/**
 * OPTIONS handler cho CORS preflight.
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3001",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  );
}
