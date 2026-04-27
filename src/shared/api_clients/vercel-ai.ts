import { google } from '@ai-sdk/google';
import { createOpenAI, openai } from '@ai-sdk/openai';

// Primary Model: Gemini 3 Flash Preview (Experimental/Preview)
export const primaryModel = google('gemini-3-flash-preview');

// Fallback Model: DeepSeek Chat
// DeepSeek uses an OpenAI-compatible API
export const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export const fallbackModel = deepseek('deepseek-chat');

/**
 * Helper to get the appropriate model with failover logic
 * This is a placeholder for more complex routing logic in Story 1.5
 */
export const getModel = (preferFallback = false) => {
  return preferFallback ? fallbackModel : primaryModel;
};

/**
 * OpenAI Client for Moderation (Experimental/Direct)
 */
export const openaiClient = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
