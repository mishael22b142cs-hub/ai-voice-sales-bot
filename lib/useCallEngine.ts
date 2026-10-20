"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PRODUCT } from "./product";
import { saveCall } from "./db";
import type { CallAnalysis, CallRecord, ChatMessage } from "./types";

export type EngineStatus =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "ending"
  | "ended";

const SILENCE_LIMIT = 3;

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createRecognition(): SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = "en-US";
  rec.maxAlternatives = 1;
  return rec;
}

export function useCallEngine() {
  const [status, setStatus] = useState<EngineStatus>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [interim, setInterim] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastRecord, setLastRecord] = useState<CallRecord | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const messagesRef = useRef<ChatMessage[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const callIdRef = useRef("");
  const endingRef = useRef(false);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition) &&
      !!window.speechSynthesis;
    setSpeechSupported(supported);
  }, []);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* noop */
        }
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const appendMessage = useCallback((speaker: "bot" | "customer", text: string) => {
    const msg: ChatMessage = { id: uid(), speaker, text, timestamp: Date.now() };
    messagesRef.current = [...messagesRef.current, msg];
    setMessages(messagesRef.current);
    return msg;
  }, []);

  const speak = useCallback((text: string, onDone: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      onDone();
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.onend = () => onDone();
    utter.onerror = () => onDone();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, []);

  function stopListening() {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    }
  }

  function stopRecorderAndGetBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const type = audioChunksRef.current[0]?.type || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type });
        resolve(blob);
      };
      if (recorder.state !== "inactive") {
        recorder.stop();
      } else {
        resolve(new Blob(audioChunksRef.current));
      }
    });
  }

  async function finalizeCall() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStatus("ending");

    const audioBlob = await stopRecorderAndGetBlob();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    let analysis: CallAnalysis | null = null;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesRef.current }),
      });
      const data = await res.json();
      if (res.ok) analysis = data.analysis as CallAnalysis;
      else setError(data.error || "Failed to analyze call");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze call");
    }

    const record: CallRecord = {
      id: callIdRef.current,
      startedAt: startedAtRef.current,
      durationSeconds: Math.floor((Date.now() - startedAtRef.current) / 1000),
      transcript: messagesRef.current,
      analysis,
      audioBlob,
    };

    try {
      await saveCall(record);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save call");
    }

    setLastRecord(record);
    setStatus("ended");
  }

  const endCallRef = useRef<() => void>(() => {});
  endCallRef.current = function endCall() {
    if (endingRef.current) return;
    endingRef.current = true;
    stopListening();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    void finalizeCall();
  };

  async function handleCustomerSpeech(text: string) {
    appendMessage("customer", text);
    setStatus("thinking");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesRef.current }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to get a reply");
        endCallRef.current();
        return;
      }
      const reply: string = data.reply;
      appendMessage("bot", reply);
      if (endingRef.current) return;
      setStatus("speaking");
      speak(reply, () => {
        if (!endingRef.current) listenOnce();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get a reply");
      endCallRef.current();
    }
  }

  function listenOnce() {
    if (endingRef.current) return;
    const rec = createRecognition();
    if (!rec) {
      setError("Speech recognition isn't supported in this browser. Please use Google Chrome.");
      return;
    }
    recognitionRef.current = rec;
    setStatus("listening");
    setInterim("");

    let finalText = "";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      setInterim(interimText);
    };

    rec.onerror = () => {
      // handled in onend
    };

    rec.onend = () => {
      recognitionRef.current = null;
      if (endingRef.current) return;
      setInterim("");
      const text = finalText.trim();
      if (text) {
        silenceCountRef.current = 0;
        void handleCustomerSpeech(text);
      } else {
        silenceCountRef.current += 1;
        if (silenceCountRef.current >= SILENCE_LIMIT) {
          const closing =
            "I'm not able to hear anything, so I'll go ahead and end the call here. Feel free to reach out anytime!";
          appendMessage("bot", closing);
          setStatus("speaking");
          speak(closing, () => endCallRef.current());
        } else {
          setTimeout(() => {
            if (!endingRef.current) listenOnce();
          }, 300);
        }
      }
    };

    try {
      rec.start();
    } catch {
      setTimeout(() => {
        if (!endingRef.current) listenOnce();
      }, 300);
    }
  }

  const startCall = useCallback(async () => {
    setError(null);
    setMessages([]);
    messagesRef.current = [];
    setInterim("");
    setLastRecord(null);
    setDurationSeconds(0);
    silenceCountRef.current = 0;
    endingRef.current = false;

    if (!speechSupported) {
      setError("Speech recognition isn't supported in this browser. Please use Google Chrome.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access is required to start the call.");
      return;
    }
    streamRef.current = stream;
    audioChunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;

    callIdRef.current = uid();
    startedAtRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setDurationSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);

    const opening = `Hi! This is Alex calling from ${PRODUCT.name}. Do you have a quick moment to chat about how we help teams manage their projects more easily?`;
    appendMessage("bot", opening);
    setStatus("speaking");
    speak(opening, () => {
      if (!endingRef.current) listenOnce();
    });
  }, [appendMessage, speak, speechSupported]);

  const endCall = useCallback(() => {
    endCallRef.current();
  }, []);

  return {
    status,
    messages,
    interim,
    durationSeconds,
    error,
    lastRecord,
    speechSupported,
    startCall,
    endCall,
  };
}
