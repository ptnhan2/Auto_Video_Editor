import { TripleScriptEngine } from "@/services/ai-director/triple-script-engine";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { script } = await req.json();

    if (!script) {
      return NextResponse.json({ error: "Script is required" }, { status: 400 });
    }

    const engine = new TripleScriptEngine();
    const result = await engine.decompose(script);

    // Story 1.6: Return user-friendly error if content is flagged
    if (result.moderation?.flagged) {
      return NextResponse.json({
        success: false,
        error: "Nội dung vi phạm chính sách kiểm duyệt.",
        moderation: result.moderation,
        message: "Phát hiện nội dung không phù hợp trong kịch bản. Vui lòng chỉnh sửa các đoạn được đánh dấu để tiếp tục."
      }, { status: 422 }); // Unprocessable Entity
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error("Triple-Script Engine Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
