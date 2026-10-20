import { NextRequest, NextResponse } from "next/server";
import { getGenAIClient, CHAT_MODEL, NO_THINKING, buildSalesSystemPrompt } from "@/lib/llm";
import type { ChatMessage } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };
    if (messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const ai = getGenAIClient();

    // The last message is always the customer's latest utterance; everything
    // before it is prior turn-taking history. Gemini chat history must start
    // with a "user" turn, so we prepend a synthetic call-connected turn.
    const last = messages[messages.length - 1];
    const priorMessages = messages.slice(0, -1);
    const history = [
      { role: "user" as const, parts: [{ text: "(The call has just connected.)" }] },
      ...priorMessages.map((m) => ({
        role: (m.speaker === "bot" ? "model" : "user") as "user" | "model",
        parts: [{ text: m.text }],
      })),
    ];

    const chat = ai.chats.create({
      model: CHAT_MODEL,
      history,
      config: {
        systemInstruction: buildSalesSystemPrompt(),
        maxOutputTokens: 200,
        thinkingConfig: NO_THINKING,
      },
    });

    const result = await chat.sendMessage({ message: last.text });
    const reply = (result.text ?? "").trim() || "Sorry, could you say that again?";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
