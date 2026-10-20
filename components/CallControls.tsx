"use client";

import type { EngineStatus } from "@/lib/useCallEngine";

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const STATUS_LABEL: Record<EngineStatus, string> = {
  idle: "Ready",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  ending: "Wrapping up…",
  ended: "Call ended",
};

const STATUS_DOT: Record<EngineStatus, string> = {
  idle: "bg-gray-400",
  listening: "bg-green-500 animate-pulse",
  thinking: "bg-amber-500 animate-pulse",
  speaking: "bg-brand-500 animate-pulse",
  ending: "bg-amber-500 animate-pulse",
  ended: "bg-gray-400",
};

export default function CallControls({
  status,
  durationSeconds,
  onStart,
  onEnd,
}: {
  status: EngineStatus;
  durationSeconds: number;
  onStart: () => void;
  onEnd: () => void;
}) {
  const inCall = status !== "idle" && status !== "ended";

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[status]}`} />
        <div>
          <div className="text-sm font-semibold text-gray-800">{STATUS_LABEL[status]}</div>
          <div className="font-mono text-xs text-gray-500">{formatDuration(durationSeconds)}</div>
        </div>
      </div>
      <div className="flex gap-2">
        {!inCall ? (
          <button
            onClick={onStart}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Start Call
          </button>
        ) : (
          <button
            onClick={onEnd}
            disabled={status === "ending"}
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            End Call
          </button>
        )}
      </div>
    </div>
  );
}
