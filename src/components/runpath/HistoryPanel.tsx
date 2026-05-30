import { X, Trash2, Route, Timer, Gauge, MapPin, Calendar, Clock } from "lucide-react";
import type { RunRecord } from "@/types/tracking";
import { formatDistance, formatDuration, formatSpeed } from "@/utils/distance";

interface HistoryPanelProps {
  records: RunRecord[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onSelect: (record: RunRecord) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Single run row ────────────────────────────────────────────────────────────

function RunRow({ record, onDelete, onSelect }: {
  record: RunRecord;
  onDelete: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      className="group relative bg-gray-800/50 hover:bg-gray-800 active:bg-gray-700 transition-colors duration-150 rounded-xl p-3 border border-gray-700/40 cursor-pointer"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      aria-label={`View run on ${formatDate(record.startTime)}`}
    >
      {/* Date + place */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-gray-400 text-[11px] mb-0.5">
            <Calendar size={10} className="flex-shrink-0" />
            <span>{formatDate(record.startTime)}</span>
          </div>
          {record.placeName && (
            <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
              <MapPin size={10} className="flex-shrink-0 text-orange-500/70" />
              <span className="truncate">{record.placeName}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label="Delete run"
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-gray-600 hover:text-red-400 p-1 rounded-lg hover:bg-gray-700 flex-shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Start → End time */}
      <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mb-2.5">
        <Clock size={10} className="flex-shrink-0" />
        <span className="text-gray-400">{formatTime(record.startTime)}</span>
        <span className="text-gray-600">→</span>
        <span className="text-gray-400">{formatTime(record.endTime)}</span>
      </div>

      {/* Stats chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 bg-orange-500/15 text-orange-300 rounded-lg px-2 py-0.5 text-xs font-semibold font-[family-name:var(--font-heading)] tabular-nums">
          <Route size={10} />
          {formatDistance(record.totalDistance)}
        </span>
        <span className="flex items-center gap-1 bg-gray-700/60 text-gray-300 rounded-lg px-2 py-0.5 text-xs font-semibold font-[family-name:var(--font-heading)] tabular-nums">
          <Timer size={10} />
          {formatDuration(record.elapsedSeconds)}
        </span>
        <span className="flex items-center gap-1 bg-gray-700/60 text-gray-300 rounded-lg px-2 py-0.5 text-xs font-semibold font-[family-name:var(--font-heading)] tabular-nums">
          <Gauge size={10} />
          {formatSpeed(record.averageSpeed)}
        </span>
      </div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function HistoryPanel({ records, onClose, onDelete, onClear, onSelect }: HistoryPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — slides in from right on desktop, up from bottom on mobile */}
      <div className="
        absolute z-40
        /* Mobile: bottom sheet, max 75vh */
        bottom-0 left-0 right-0 max-h-[75dvh]
        rounded-t-2xl
        /* Desktop: right sidebar */
        md:bottom-0 md:top-0 md:left-auto md:right-0 md:w-80 md:max-h-full
        md:rounded-none md:rounded-l-2xl
        bg-gray-900 border-t border-gray-700/60 md:border-t-0 md:border-l
        flex flex-col
        shadow-2xl
        animate-in slide-in-from-bottom md:slide-in-from-right duration-300
      ">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-base font-bold uppercase tracking-widest text-white">
              Run History
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {records.length} {records.length === 1 ? "run" : "runs"} recorded
            </p>
          </div>
          <div className="flex items-center gap-1">
            {records.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                aria-label="Clear all history"
                className="text-gray-600 hover:text-red-400 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-gray-800 text-xs"
                title="Clear all"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close history"
              className="text-gray-500 hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-gray-800"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Route size={32} className="text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm font-medium">No runs yet</p>
              <p className="text-gray-600 text-xs mt-1">Complete a run to see it here</p>
            </div>
          ) : (
            records.map((record) => (
              <RunRow
                key={record.id}
                record={record}
                onDelete={() => onDelete(record.id)}
                onSelect={() => { onSelect(record); onClose(); }}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
