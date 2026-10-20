"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";

export default function ChatMessages({
  messages,
  interim,
}: {
  messages: ChatMessage[];
  interim: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interim]);

  if (messages.length === 0 && !interim) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Press "Start Call" to begin the conversation.
      </div>
    );
  }

  return (
    <div className="scrollbar-thin flex h-full flex-col gap-3 overflow-y-auto p-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex ${m.speaker === "bot" ? "justify-start" : "justify-end"}`}
        >
          <div
            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
              m.speaker === "bot"
                ? "rounded-bl-sm bg-white text-gray-800"
                : "rounded-br-sm bg-brand-500 text-white"
            }`}
          >
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-60">
              {m.speaker === "bot" ? "Alex (AI)" : "Customer (You)"}
            </div>
            {m.text}
          </div>
        </div>
      ))}
      {interim && (
        <div className="flex justify-end">
          <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-brand-100 px-4 py-2 text-sm italic text-brand-700">
            {interim}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
