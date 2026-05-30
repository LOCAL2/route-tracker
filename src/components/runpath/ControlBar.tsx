import { Button } from "@/components/ui/button";
import type { TrackingStatus } from "@/types/tracking";
import { Play, Pause, Square, RotateCcw, LocateFixed, Loader2 } from "lucide-react";

interface ControlBarProps {
  status: TrackingStatus;
  onLocate: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function ControlBar({
  status,
  onLocate,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
}: ControlBarProps) {
  return (
    <div className="flex items-center gap-2 justify-center flex-wrap">

      {/* ── Step 1: Find location ── */}
      {status === "idle" && (
        <Button
          variant="outline"
          size="default"
          onClick={onLocate}
          aria-label="Find my location"
          className="flex-1 min-w-[100px] sm:min-w-[160px] sm:h-12 sm:text-base"
        >
          <LocateFixed size={16} />
          Find My Location
        </Button>
      )}

      {/* ── Locating spinner ── */}
      {status === "locating" && (
        <Button
          variant="outline"
          size="default"
          disabled
          aria-label="Getting location…"
          className="flex-1 min-w-[100px] sm:min-w-[160px] sm:h-12 sm:text-base opacity-80"
        >
          <Loader2 size={16} className="animate-spin" />
          Getting Location…
        </Button>
      )}

      {/* ── Step 2: Location found → show Start ── */}
      {status === "located" && (
        <Button
          variant="success"
          size="default"
          onClick={onStart}
          aria-label="Start tracking"
          className="flex-1 min-w-[100px] sm:min-w-[160px] sm:h-12 sm:text-base"
        >
          <Play size={16} />
          Start Run
        </Button>
      )}

      {/* ── Tracking ── */}
      {status === "tracking" && (
        <>
          <Button
            variant="outline"
            size="default"
            onClick={onPause}
            aria-label="Pause tracking"
            className="flex-1 sm:h-12 sm:text-base"
          >
            <Pause size={16} />
            Pause
          </Button>
          <Button
            variant="destructive"
            size="default"
            onClick={onStop}
            aria-label="Stop tracking"
            className="flex-1 sm:h-12 sm:text-base"
          >
            <Square size={16} />
            Stop
          </Button>
        </>
      )}

      {/* ── Paused ── */}
      {status === "paused" && (
        <>
          <Button
            variant="success"
            size="default"
            onClick={onResume}
            aria-label="Resume tracking"
            className="flex-1 sm:h-12 sm:text-base"
          >
            <Play size={16} />
            Resume
          </Button>
          <Button
            variant="destructive"
            size="default"
            onClick={onStop}
            aria-label="Stop tracking"
            className="flex-1 sm:h-12 sm:text-base"
          >
            <Square size={16} />
            Stop
          </Button>
        </>
      )}

      {/* ── Finished / Error ── */}
      {(status === "stopped" || status === "error") && (
        <Button
          variant="outline"
          size="default"
          onClick={onReset}
          aria-label="Reset and start new run"
          className="flex-1 min-w-[100px] sm:min-w-[140px] sm:h-12 sm:text-base"
        >
          <RotateCcw size={16} />
          New Run
        </Button>
      )}

    </div>
  );
}
