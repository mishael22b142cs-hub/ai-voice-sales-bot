import { createStore, set, get, del, values } from "idb-keyval";
import type { CallRecord } from "./types";

const callStore = createStore("ai-voice-sales-bot", "calls");

export async function saveCall(record: CallRecord): Promise<void> {
  await set(record.id, record, callStore);
}

export async function getCall(id: string): Promise<CallRecord | undefined> {
  return get(id, callStore);
}

export async function getAllCalls(): Promise<CallRecord[]> {
  const all = await values<CallRecord>(callStore);
  return all.sort((a, b) => b.startedAt - a.startedAt);
}

export async function deleteCall(id: string): Promise<void> {
  await del(id, callStore);
}
