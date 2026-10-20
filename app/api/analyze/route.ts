import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { getGenAIClient, CHAT_MODEL, NO_THINKING } from "@/lib/llm";
import { PRODUCT } from "@/lib/product";
import type { ChatMessage, CallAnalysis, SalesStatus } from "@/lib/types";

const STATUSES: SalesStatus[] = [
  "Converted",
  "Interested",
  "Follow-up Required",
  "Not Interested",
  "Demo Requested",
  "No Response",
];

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    const customerMessages = messages.filter((m) => m.speaker === "customer");
    if (customerMessages.length === 0) {
      const analysis: CallAnalysis = {
        summary: "The customer did not say anything during the call.",
        customerRequirements: "None captured.",
        objections: "None captured.",
        nextSteps: "Attempt to re-contact the customer at a different time.",
        status: "No Response",
      };
      return NextResponse.json({ analysis });
    }

    const ai = getGenAIClient();

    const transcriptText = messages
      .map((m) => `${m.speaker === "bot" ? "Alex (AI sales rep)" : "Customer"}: ${m.text}`)
      .join("\n");

    const prompt = `Here is the transcript of a sales call for the SaaS product "${PRODUCT.name}":

${transcriptText}

Analyze this call: summarize how it went in 2-3 sentences, capture what the customer said they
need or care about (or "None mentioned"), capture any concerns or objections raised (or "None
raised"), recommend a short next step for the sales team, and classify the final sales status.`;

    const result = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: prompt,
      config: {
        maxOutputTokens: 1000,
        thinkingConfig: NO_THINKING,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            customerRequirements: { type: Type.STRING },
            objections: { type: Type.STRING },
            nextSteps: { type: Type.STRING },
            status: { type: Type.STRING, enum: STATUSES },
          },
          required: ["summary", "customerRequirements", "objections", "nextSteps", "status"],
        },
      },
    });

    const raw = (result.text ?? "").trim();

    let parsed: Partial<CallAnalysis> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const status = STATUSES.includes(parsed.status as SalesStatus)
      ? (parsed.status as SalesStatus)
      : "Follow-up Required";

    const analysis: CallAnalysis = {
      summary: parsed.summary || "Summary unavailable.",
      customerRequirements: parsed.customerRequirements || "Not captured.",
      objections: parsed.objections || "None captured.",
      nextSteps: parsed.nextSteps || "Follow up with the customer.",
      status,
    };

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
