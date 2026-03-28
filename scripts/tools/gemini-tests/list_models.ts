import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
  const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).listModels();
  // Wait, listModels is not on the model instance, it's on the client or something else.
  // Actually, let's just use the discovery endpoint or try common names.
  console.log("Checking available models...");
  // ListModels is available on the client in some versions of the SDK.
  // But let's just try 'gemini-1.5-flash' vs 'gemini-1.5-pro'
}
// Actually, let's just try 'gemini-pro'
