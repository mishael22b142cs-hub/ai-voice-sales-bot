"use client";

import { useState } from "react";
import { useCallEngine } from "@/lib/useCallEngine";
import { PRODUCT } from "@/lib/product";
import ChatMessages from "@/components/ChatMessages";
import CallControls from "@/components/CallControls";
import ConsentModal from "@/components/ConsentModal";
import HistoryList from "@/components/HistoryList";
import StatusBadge from "@/components/StatusBadge";

export default function Home() {
  const {
    status,
    messages,
    interim,
    durationSeconds,
    error,
    lastRecord,
    speechSupported,
    startCall,
    endCall,
  } = useCallEngine();

  const [showConsent, setShowConsent] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  async function handleAccept() {
    setShowConsent(false);
    await startCall();
  }

  function handleEnd() {
    endCall();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">AI Voice Sales Bot</h1>
        <p className="text-sm text-gray-500">
          Selling <span className="font-semibold">{PRODUCT.name}</span> — {PRODUCT.tagline}
        </p>
      </header>

      {!speechSupported && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Your browser doesn't support the Web Speech API needed for voice. Please open this app in
          Google Chrome on desktop.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <CallControls
            status={status}
            durationSeconds={durationSeconds}
            onStart={() => setShowConsent(true)}
            onEnd={handleEnd}
          />
          <div className="h-[420px] rounded-2xl bg-gray-50 shadow-inner">
            <ChatMessages messages={messages} interim={interim} />
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800">Call Result</h2>
            {status === "ended" && lastRecord?.analysis ? (
              <div className="mt-3 space-y-3">
                <StatusBadge status={lastRecord.analysis.status} />
                <div>
                  <div className="text-xs font-semibold uppercase text-gray-500">Summary</div>
                  <p className="text-sm text-gray-700">{lastRecord.analysis.summary}</p>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-gray-500">
                    Customer requirements
                  </div>
                  <p className="text-sm text-gray-700">
                    {lastRecord.analysis.customerRequirements}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-gray-500">Objections</div>
                  <p className="text-sm text-gray-700">{lastRecord.analysis.objections}</p>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-gray-500">Next steps</div>
                  <p className="text-sm text-gray-700">{lastRecord.analysis.nextSteps}</p>
                </div>
                <button
                  className="text-xs font-medium text-brand-600 hover:underline"
                  onClick={() => setHistoryRefresh((n) => n + 1)}
                >
                  Refresh history ↓
                </button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-400">
                Results will appear here once a call ends.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-800">Call History</h2>
        <HistoryList refreshToken={historyRefresh + (status === "ended" ? 1 : 0)} />
      </section>

      {showConsent && (
        <ConsentModal onAccept={handleAccept} onCancel={() => setShowConsent(false)} />
      )}
    </main>
  );
}
