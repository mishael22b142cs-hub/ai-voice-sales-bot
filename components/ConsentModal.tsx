"use client";

import { useState } from "react";

export default function ConsentModal({
  onAccept,
  onCancel,
}: {
  onAccept: () => void;
  onCancel: () => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Before we start the call</h2>
        <p className="mt-2 text-sm text-gray-600">
          This call will use your microphone, be recorded for quality and training purposes,
          and the audio, transcript, and an AI-generated summary will be saved to your call
          history on this device.
        </p>
        <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          I consent to this call being recorded.
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            disabled={!checked}
            onClick={onAccept}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-brand-600 disabled:opacity-40"
          >
            Start Call
          </button>
        </div>
      </div>
    </div>
  );
}
