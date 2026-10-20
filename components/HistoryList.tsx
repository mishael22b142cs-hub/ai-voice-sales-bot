"use client";

import { useEffect, useState } from "react";
import { getAllCalls } from "@/lib/db";
import type { CallRecord } from "@/lib/types";
import StatusBadge from "./StatusBadge";

function formatDate(ts: number) {
  return new Date(ts).toLocaleString();
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function CallRow({ call }: { call: CallRecord }) {
  const [open, setOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open && call.audioBlob && !audioUrl) {
      const url = URL.createObjectURL(call.audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [open, call.audioBlob, audioUrl]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <div className="text-sm font-medium text-gray-800">{formatDate(call.startedAt)}</div>
          <div className="text-xs text-gray-500">Duration: {formatDuration(call.durationSeconds)}</div>
        </div>
        <div className="flex items-center gap-3">
          {call.analysis && <StatusBadge status={call.analysis.status} />}
          <span className="text-gray-400">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div className="space-y-4 border-t border-gray-100 px-4 py-4">
          {call.audioBlob ? (
            audioUrl && <audio controls src={audioUrl} className="w-full" />
          ) : (
            <p className="text-xs text-gray-400">No recording available.</p>
          )}

          {call.analysis && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">Summary</div>
                <p className="text-sm text-gray-700">{call.analysis.summary}</p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">
                  Customer requirements
                </div>
                <p className="text-sm text-gray-700">{call.analysis.customerRequirements}</p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">Objections</div>
                <p className="text-sm text-gray-700">{call.analysis.objections}</p>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">Next steps</div>
                <p className="text-sm text-gray-700">{call.analysis.nextSteps}</p>
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 text-xs font-semibold uppercase text-gray-500">Transcript</div>
            <div className="scrollbar-thin max-h-48 space-y-1 overflow-y-auto rounded-lg bg-gray-50 p-3">
              {call.transcript.map((m) => (
                <p key={m.id} className="text-xs text-gray-700">
                  <span className="font-semibold">{m.speaker === "bot" ? "Alex:" : "Customer:"}</span>{" "}
                  {m.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryList({ refreshToken }: { refreshToken: number }) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAllCalls()
      .then((data) => {
        if (!cancelled) setCalls(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading call history…</p>;
  }

  if (calls.length === 0) {
    return <p className="text-sm text-gray-400">No calls yet. Start a call to see it here.</p>;
  }

  return (
    <div className="space-y-3">
      {calls.map((call) => (
        <CallRow key={call.id} call={call} />
      ))}
    </div>
  );
}
