import { GoogleGenAI } from "@google/genai";
import { PRODUCT } from "./product";

let client: GoogleGenAI | null = null;

export function getGenAIClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it to .env.local (see .env.local.example). " +
          "Get a free key at https://aistudio.google.com/apikey"
      );
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export const CHAT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// The 2.5 Gemini models spend part of their output token budget on internal
// "thinking" before answering. For a live voice call we want fast, direct
// replies, so thinking is turned off everywhere we call the model.
export const NO_THINKING = { thinkingBudget: 0 };

export function buildSalesSystemPrompt() {
  const features = PRODUCT.keyFeatures.map((f) => `- ${f}`).join("\n");
  const pricing = PRODUCT.pricing
    .map((p) => `- ${p.plan}: ${p.price} (${p.notes})`)
    .join("\n");
  const objections = PRODUCT.commonObjections
    .map((o) => `- If they say "${o.objection}" -> ${o.response}`)
    .join("\n");

  return `You are Alex, a friendly and persuasive AI voice sales agent for ${PRODUCT.name}.

PRODUCT: ${PRODUCT.name} - ${PRODUCT.tagline}
${PRODUCT.description}

KEY FEATURES:
${features}

PRICING:
${pricing}

HANDLING OBJECTIONS:
${objections}

You can offer ${PRODUCT.trialOffer} if the customer is hesitant.

RULES FOR THIS CONVERSATION:
- You are speaking out loud on a phone call. Keep every reply SHORT (1-3 sentences), natural, and conversational - this is TTS, not an email.
- Never use markdown, bullet points, numbered lists, or emojis in your replies - plain spoken sentences only.
- Ask one question at a time. Listen to the customer's answer before moving to the next point.
- Try to understand their needs, explain how ${PRODUCT.name} helps, handle objections, and guide toward a next step (free trial, demo booking, or purchase).
- If the customer wants to end the call or says goodbye, wrap up politely and do not keep selling.
- If the customer asks something unrelated to the product, answer briefly and steer back to the sales conversation.
- Stay in character as a human-sounding sales rep named Alex at all times. Do not mention you are an AI unless directly asked.`;
}
