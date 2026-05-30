import { MapPin, Timer, Route, Gauge, Trophy, X, Clock } from "lucide-react";
import { formatDistance, formatDuration, formatSpeed } from "@/utils/distance";
import type { RunRecord } from "@/types/tracking";

interface RecordDetailCardProps {
  record: RunRecord;
  onClose: () => void;
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(ms: number): string {
  return new Date(ms).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatBlock({
  icon, label, value, highlight,
}: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-0 px-1">
      <span className={`font-[family-name:var(--font-heading)] text-lg sm:text-xl font-bold tabular-nums tracking-wide ${highlight ? "text-orange-400" : "text-white"}`}>
        {value}
      </span>
      <span className="text-gray-500 text-[10px] uppercase tracking-widest flex items-center gap-1">
        {icon}{label}
      </span>
    </div>
  );
}

export function RecordDetailCard({ record, onClose }: RecordDetailCardProps) {
  return (
    <div className="
      bg-gray-900/95 backdrop-blur-md
      border border-gray-700/60
      rounded-2xl shadow-2xl
      w-[min(92vw,360px)]
      overflow-hidden
      animate-in fade-in-0 zoom-in-95 duration-300
    ">
      {/* Header */}
      <div className="relative flex items-center justify-center px-4 pt-4 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-orange-400" />
          <span className="font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-widest text-white">
            Run History
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-800"
        >
          <X size={14} />
        </button>
      </div>

      {/* Date + Start → End */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800/60">
        <Clock size={12} className="text-gray-500 flex-shrink-0" />
        <div className="flex items-center gap-1.5 text-xs min-w-0">
          <span className="text-gray-500">{formatDateShort(record.startTime)}</span>
          <span className="text-gray-400 font-semibold">{formatTime(record.startTime)}</span>
          <span className="text-gray-600">→</span>
          <span className="text-gray-400 font-semibold">{formatTime(record.endTime)}</span>
        </div>
      </div>

      {/* Place */}
      {record.placeName && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800/60">
          <MapPin size={12} className="text-orange-400 flex-shrink-0" />
          <span className="text-gray-300 text-xs truncate">{record.placeName}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-gray-800 py-4">
        <StatBlock icon={<Route size={9} />} label="Distance" value={formatDistance(record.totalDistance)} highlight />
        <StatBlock icon={<Timer size={9} />} label="Time" value={formatDuration(record.elapsedSeconds)} />
        <StatBlock icon={<Gauge size={9} />} label="Avg Speed" value={formatSpeed(record.averageSpeed)} />
      </div>
    </div>
  );
}
