import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TrackingState } from "@/types/tracking";
import { formatDistance, formatDuration, formatSpeed } from "@/utils/distance";
import { MapPin, Timer, Gauge, Route, Navigation } from "lucide-react";

interface StatsCardProps {
  state: TrackingState;
  /** compact = horizontal pill row for mobile bottom bar */
  compact?: boolean;
}

function statusBadge(status: TrackingState["status"]) {
  switch (status) {
    case "locating":
      return (
        <Badge variant="outline">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Locating…
        </Badge>
      );
    case "located":
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          Located
        </Badge>
      );
    case "tracking":
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live
        </Badge>
      );
    case "paused":
      return <Badge variant="default">Paused</Badge>;
    case "stopped":
      return <Badge variant="secondary">Finished</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">Ready</Badge>;
  }
}

// ── Compact horizontal layout (mobile) ──────────────────────────────────────

function CompactStats({ state }: { state: TrackingState }) {
  const { status, totalDistance, elapsedSeconds, averageSpeed } = state;

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2.5">
      {/* Status */}
      <div className="flex-shrink-0">{statusBadge(status)}</div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-700 flex-shrink-0" />

      {/* Distance */}
      <div className="flex flex-col items-center min-w-0">
        <span className="text-orange-400 font-bold text-base tabular-nums leading-tight font-[family-name:var(--font-heading)]">
          {formatDistance(totalDistance)}
        </span>
        <span className="text-gray-500 text-[10px] uppercase tracking-wide flex items-center gap-0.5">
          <Route size={9} />Dist
        </span>
      </div>

      <div className="w-px h-6 bg-gray-700 flex-shrink-0" />

      {/* Time */}
      <div className="flex flex-col items-center min-w-0">
        <span className="text-white font-semibold text-base tabular-nums leading-tight font-[family-name:var(--font-heading)]">
          {formatDuration(elapsedSeconds)}
        </span>
        <span className="text-gray-500 text-[10px] uppercase tracking-wide flex items-center gap-0.5">
          <Timer size={9} />Time
        </span>
      </div>

      <div className="w-px h-6 bg-gray-700 flex-shrink-0" />

      {/* Speed */}
      <div className="flex flex-col items-center min-w-0">
        <span className="text-white font-semibold text-base tabular-nums leading-tight font-[family-name:var(--font-heading)]">
          {formatSpeed(averageSpeed)}
        </span>
        <span className="text-gray-500 text-[10px] uppercase tracking-wide flex items-center gap-0.5">
          <Gauge size={9} />Avg
        </span>
      </div>
    </div>
  );
}

// ── Full vertical layout (tablet / desktop sidebar) ──────────────────────────

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

function StatRow({ icon, label, value, highlight }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <span className="text-gray-500 w-4 h-4 flex-shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${highlight ? "text-orange-400" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

function FullStats({ state }: { state: TrackingState }) {
  const { status, totalDistance, elapsedSeconds, averageSpeed, currentPosition } = state;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="font-[family-name:var(--font-heading)] text-base font-semibold tracking-wide text-white uppercase">
          RunPath
        </span>
        {statusBadge(status)}
      </div>

      {/* Stats */}
      <div className="px-4 pb-3 divide-y divide-gray-800">
        <StatRow icon={<Route size={14} />} label="Distance" value={formatDistance(totalDistance)} highlight />
        <StatRow icon={<Timer size={14} />} label="Time" value={formatDuration(elapsedSeconds)} />
        <StatRow icon={<Gauge size={14} />} label="Avg Speed" value={formatSpeed(averageSpeed)} />
        {currentPosition && (
          <>
            <StatRow icon={<Navigation size={14} />} label="Latitude" value={currentPosition.lat.toFixed(6)} />
            <StatRow icon={<MapPin size={14} />} label="Longitude" value={currentPosition.lng.toFixed(6)} />
          </>
        )}
      </div>
    </>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export function StatsCard({ state, compact = false }: StatsCardProps) {
  if (compact) {
    return (
      <Card className="w-full rounded-none border-x-0 border-b-0 rounded-t-2xl">
        <CompactStats state={state} />
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <FullStats state={state} />
      </CardContent>
    </Card>
  );
}
