import { generateText } from 'ai';
import { primaryModel, fallbackModel } from '@/lib/vercel-ai';
import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, { success: boolean; text?: string; error?: string }> = {};

  try {
    // Test Primary Model (Gemini)
    try {
      const { text: primaryText } = await generateText({
        model: primaryModel,
        prompt: 'Say "Primary model is working!"',
      });
      results.primary = { success: true, text: primaryText };
    } catch (e: unknown) {
      results.primary = { success: false, error: e instanceof Error ? e.message : String(e) };
    }

    // Test Fallback Model (DeepSeek)
    try {
      const { text: fallbackText } = await generateText({
        model: fallbackModel,
        prompt: 'Say "Fallback model is working!"',
      });
      results.fallback = { success: true, text: fallbackText };
    } catch (e: unknown) {
      results.fallback = { success: false, error: e instanceof Error ? e.message : String(e) };
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
