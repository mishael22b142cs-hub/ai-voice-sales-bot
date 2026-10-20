import type { SalesStatus } from "@/lib/types";

const STYLES: Record<SalesStatus, string> = {
  Converted: "bg-green-100 text-green-800 border-green-300",
  Interested: "bg-blue-100 text-blue-800 border-blue-300",
  "Follow-up Required": "bg-amber-100 text-amber-800 border-amber-300",
  "Not Interested": "bg-red-100 text-red-800 border-red-300",
  "Demo Requested": "bg-purple-100 text-purple-800 border-purple-300",
  "No Response": "bg-gray-100 text-gray-700 border-gray-300",
};

export default function StatusBadge({ status }: { status: SalesStatus }) {
  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
