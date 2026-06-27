import { GoogleGenAI } from "@google/genai";
import { createLogger } from "./logger.js";

const log = createLogger("analyzer");

export interface CallTurn {
  role: string;
  text: string;
}

export async function analyzeCall(turns: CallTurn[]): Promise<{
  summary: string;
  sentiment: "positive" | "neutral" | "negative" | "unknown";
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    log.warn("GEMINI_API_KEY is not set. Skipping call analysis.");
    return {
      summary: "Call analysis skipped: GEMINI_API_KEY is not configured.",
      sentiment: "unknown",
    };
  }

  if (turns.length === 0) {
    return {
      summary: "No conversation turns recorded.",
      sentiment: "unknown",
    };
  }

  const formattedTranscript = turns
    .map((turn) => `${turn.role.toUpperCase()}: ${turn.text}`)
    .join("\n");

  const ai = new GoogleGenAI({ apiKey });

  // List of fallback models to try, starting with the latest recommended flash model
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

  for (const model of models) {
    try {
      log.info({ model }, "Attempting call analysis with model");
      const response = await ai.models.generateContent({
        model,
        contents: `You are an AI assistant that analyzes phone call transcripts.
Provide a concise summary of the conversation (1-2 sentences) and determine the overall customer sentiment (positive, neutral, negative).

Transcript:
${formattedTranscript}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              summary: {
                type: "STRING",
                description: "A concise 1-2 sentence summary of the call conversation.",
              },
              sentiment: {
                type: "STRING",
                enum: ["positive", "neutral", "negative"],
                description: "The customer's overall sentiment.",
              },
            },
            required: ["summary", "sentiment"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error(`Empty response from model ${model}`);
      }

      const parsed = JSON.parse(text);
      return {
        summary: parsed.summary || "",
        sentiment: parsed.sentiment || "unknown",
      };
    } catch (err) {
      log.error({ err, model }, `Failed call analysis with model ${model}`);
      // Continue to next model in loop
    }
  }

  return {
    summary: "Error: AI analysis failed across all models.",
    sentiment: "unknown",
  };
}
