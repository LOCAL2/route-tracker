import { useEffect, useRef, useState } from "react";
import { MapPin, Timer, Route, Gauge, Trophy, X, Clock } from "lucide-react";
import { formatDistance, formatDuration, formatSpeed } from "@/utils/distance";
import type { RunRecord, TrackingState } from "@/types/tracking";

interface RunCompleteCardProps {
  state: TrackingState;
  endTime: number;
  onDismiss: () => void;
  onSave: (record: RunRecord) => void;
}

interface PlaceInfo {
  name: string;
  loading: boolean;
}

/** Reverse geocode using Nominatim (OSM) — free, no API key */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // zoom=10 = district level, avoids returning village/hamlet names
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&accept-language=th,en`;
  const res = await fetch(url, { headers: { "Accept-Language": "th,en" } });
  if (!res.ok) throw new Error("geocode failed");
  const data = await res.json() as {
    address?: {
      subdistrict?: string;
      district?: string;
      city_district?: string;
      county?: string;
      city?: string;
      town?: string;
      state?: string;
      country?: string;
    };
    display_name?: string;
  };

  const a = data.address ?? {};

  // Thai hierarchy (zoom=10 returns district-level, no village noise):
  // subdistrict (ตำบล) → district (อำเภอ) → state (จังหวัด)
  const subdistrict = a.subdistrict ?? "";
  const district    = a.district ?? a.city_district ?? a.county ?? "";
  const province    = a.state ?? a.city ?? a.town ?? "";

  // Prefer: ตำบล + จังหวัด  →  อำเภอ + จังหวัด  →  จังหวัด
  if (subdistrict && province) return `${subdistrict}, ${province}`;
  if (district && province)    return `${district}, ${province}`;
  if (province)                return province;
  if (district)                return district;

  // Last resort: first 2 comma-parts of display_name
  if (data.display_name) {
    return data.display_name.split(",").map((s) => s.trim()).slice(0, 2).join(", ");
  }
  return "Unknown location";
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Stat block ────────────────────────────────────────────────────────────────

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

// ── Main card ─────────────────────────────────────────────────────────────────

export function RunCompleteCard({ state, endTime, onDismiss, onSave }: RunCompleteCardProps) {
  const { totalDistance, elapsedSeconds, averageSpeed, points, startTime } = state;
  const [place, setPlace] = useState<PlaceInfo>({ name: "", loading: true });
  const savedRef = useRef(false);

  // Keep latest props in a ref so the async geocode callback always reads fresh values
  const snapshotRef = useRef({ totalDistance, elapsedSeconds, averageSpeed, points, startTime, endTime });
  snapshotRef.current = { totalDistance, elapsedSeconds, averageSpeed, points, startTime, endTime };
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const resolvedStartTime = startTime ?? endTime - elapsedSeconds * 1000;

  // Reverse geocode once on mount, then save using latest snapshot
  useEffect(() => {
    if (points.length === 0) {
      setPlace({ name: "", loading: false });
      return;
    }
    const start = points[0];

    const doSave = (name: string) => {
      if (savedRef.current) return;
      savedRef.current = true;
      const s = snapshotRef.current;
      const resolvedStart = s.startTime ?? s.endTime - s.elapsedSeconds * 1000;
      onSaveRef.current({
        id: new Date().toISOString(),
        startTime: resolvedStart,
        endTime: s.endTime,
        totalDistance: s.totalDistance,
        elapsedSeconds: s.elapsedSeconds,
        averageSpeed: s.averageSpeed,
        points: s.points,
        placeName: name,
      });
    };

    reverseGeocode(start.lat, start.lng)
      .then((name) => { setPlace({ name, loading: false }); doSave(name); })
      .catch(() => { setPlace({ name: "Unknown location", loading: false }); doSave("Unknown location"); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="
      bg-gray-900/95 backdrop-blur-md
      border border-gray-700/60
      rounded-2xl shadow-2xl
      w-[min(92vw,360px)]
      overflow-hidden
      animate-in fade-in-0 zoom-in-95 duration-300
    ">
      {/* ── Header ── */}
      <div className="relative flex items-center justify-center px-4 pt-4 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-orange-400" />
          <span className="font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-widest text-white">
            Run Complete
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-800"
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Date + Start → End time ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800/60">
        <Clock size={12} className="text-gray-500 flex-shrink-0" />
        <div className="flex items-center gap-1.5 text-xs min-w-0">
          <span className="text-gray-500">{formatDateShort(resolvedStartTime)}</span>
          <span className="text-gray-400 font-semibold">{formatTime(resolvedStartTime)}</span>
          <span className="text-gray-600">→</span>
          <span className="text-gray-400 font-semibold">{formatTime(endTime)}</span>
        </div>
      </div>

      {/* ── Place name ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800/60">
        <MapPin size={12} className="text-orange-400 flex-shrink-0" />
        {place.loading ? (
          <div className="flex gap-1 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-pulse [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-pulse [animation-delay:300ms]" />
          </div>
        ) : (
          <span className="text-gray-300 text-xs truncate">{place.name}</span>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 divide-x divide-gray-800 py-4">
        <StatBlock icon={<Route size={9} />} label="Distance" value={formatDistance(totalDistance)} highlight />
        <StatBlock icon={<Timer size={9} />} label="Time" value={formatDuration(elapsedSeconds)} />
        <StatBlock icon={<Gauge size={9} />} label="Avg Speed" value={formatSpeed(averageSpeed)} />
      </div>
    </div>
  );
}
