import { GoogleGenAI, Type } from "@google/genai";
import { createLogger } from "./logger.js";

const log = createLogger("analyzer");

export interface CallTurn {
  role: string;
  text: string;
}

import type { OutcomeTag } from "@voiceplatform/shared";

export interface CallTurn {
  role: string;
  text: string;
}

export async function analyzeCall(turns: CallTurn[]): Promise<{
  summary: string;
  sentiment: "positive" | "neutral" | "negative" | "unknown";
  outcomeTag: OutcomeTag;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    log.warn("GEMINI_API_KEY is not set. Skipping call analysis.");
    return {
      summary: "Call analysis skipped: GEMINI_API_KEY is not configured.",
      sentiment: "unknown",
      outcomeTag: "UNKNOWN",
    };
  }

  if (turns.length === 0) {
    return {
      summary: "No conversation turns recorded.",
      sentiment: "unknown",
      outcomeTag: "NO_ANSWER",
    };
  }

  const formattedTranscript = turns
    .map((turn) => `${turn.role.toUpperCase()}: ${turn.text}`)
    .join("\n");

  const ai = new GoogleGenAI({ apiKey });

  // List of active recommended Gemini models to try in priority order
  const models = [
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
  ];

  for (const model of models) {
    // Retry up to 2 attempts per model for transient errors
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        log.info({ model, attempt }, "Attempting call analysis with model");
        const response = await ai.models.generateContent({
          model,
          contents: `You are an AI assistant that analyzes loan reminder / collection call transcripts.
Provide a concise summary of the conversation (1-2 sentences), determine customer sentiment (positive, neutral, negative), and classify the call outcome tag into EXACTLY ONE of:
- PAID_CONFIRMED: Customer confirmed payment has already been completed.
- PROMISE_TO_PAY: Customer committed to a future date for payment.
- DISPUTED: Customer disputes the EMI amount, due date, or account charges.
- HARDSHIP: Customer requested restructuring, partial payment, or reported financial difficulty.
- OPT_OUT: Customer requested no further automated calls / DNC.
- WRONG_NUMBER: Number does not belong to borrower or third party answered.
- CALLBACK_REQUESTED: Customer requested a callback at a different time.
- NO_ANSWER: Call was unanswered, dropped, or reached voicemail.
- UNKNOWN: Outcome could not be categorized.

Transcript:
${formattedTranscript}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description: "A concise 1-2 sentence summary of the call conversation.",
                },
                sentiment: {
                  type: Type.STRING,
                  enum: ["positive", "neutral", "negative"],
                  description: "The customer's overall sentiment.",
                },
                outcomeTag: {
                  type: Type.STRING,
                  enum: [
                    "PAID_CONFIRMED",
                    "PROMISE_TO_PAY",
                    "DISPUTED",
                    "HARDSHIP",
                    "NO_ANSWER",
                    "OPT_OUT",
                    "WRONG_NUMBER",
                    "CALLBACK_REQUESTED",
                    "UNKNOWN",
                  ],
                  description: "Categorized call outcome tag.",
                },
              },
              required: ["summary", "sentiment", "outcomeTag"],
            },
          },
        });

        const text = response.text;
        if (!text) {
          throw new Error(`Empty response from model ${model}`);
        }

        const parsed = JSON.parse(text);
        const validTags: OutcomeTag[] = [
          "PAID_CONFIRMED",
          "PROMISE_TO_PAY",
          "DISPUTED",
          "HARDSHIP",
          "NO_ANSWER",
          "OPT_OUT",
          "WRONG_NUMBER",
          "CALLBACK_REQUESTED",
          "UNKNOWN",
        ];
        return {
          summary: parsed.summary || "",
          sentiment: (["positive", "neutral", "negative"].includes(parsed.sentiment)
            ? parsed.sentiment
            : "unknown") as "positive" | "neutral" | "negative" | "unknown",
          outcomeTag: validTags.includes(parsed.outcomeTag) ? parsed.outcomeTag : "UNKNOWN",
        };
      } catch (err: any) {
        log.error({ err: err?.message || err, model, attempt }, `Failed call analysis with model ${model} (attempt ${attempt})`);
        if (attempt < 2) {
          await new Promise((res) => setTimeout(res, 1000));
        }
      }
    }
  }

  return {
    summary: "Error: AI analysis failed across all models.",
    sentiment: "unknown",
    outcomeTag: "UNKNOWN",
  };
}

