export type Speaker = "bot" | "customer";

export interface ChatMessage {
  id: string;
  speaker: Speaker;
  text: string;
  timestamp: number;
}

export type SalesStatus =
  | "Converted"
  | "Interested"
  | "Follow-up Required"
  | "Not Interested"
  | "Demo Requested"
  | "No Response";

export interface CallAnalysis {
  summary: string;
  customerRequirements: string;
  objections: string;
  nextSteps: string;
  status: SalesStatus;
}

export interface CallRecord {
  id: string;
  startedAt: number;
  durationSeconds: number;
  transcript: ChatMessage[];
  analysis: CallAnalysis | null;
  audioBlob: Blob | null;
}
