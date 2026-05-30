import { useState, useEffect, useRef } from "react";
import { History } from "lucide-react";
import { useGeolocationTracker } from "@/hooks/useGeolocationTracker";
import { useRunHistory } from "@/hooks/useRunHistory";
import { MapView, StyleToggle, type MapStyleKey } from "./MapView";
import { StatsCard } from "./StatsCard";
import { ControlBar } from "./ControlBar";
import { ErrorOverlay } from "./ErrorOverlay";
import { RunCompleteCard } from "./RunCompleteCard";
import { RecordDetailCard } from "./RecordDetailCard";
import { HistoryPanel } from "./HistoryPanel";
import type { RunRecord } from "@/types/tracking";

export function RunPath() {
  const {
    state,
    locateMe,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    resetTracking,
  } = useGeolocationTracker();

  const { history, addRecord, deleteRecord, clearHistory } = useRunHistory();

  const [mapStyle, setMapStyle] = useState<MapStyleKey>("carto-dark");
  const [cardDismissed, setCardDismissed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  // Run selected from history to replay on map
  const [selectedRecord, setSelectedRecord] = useState<RunRecord | null>(null);

  // Capture endTime the moment Stop is pressed
  const endTimeRef = useRef<number>(Date.now());
  const prevStatusRef = useRef(state.status);

  useEffect(() => {
    // Transition into "stopped" — snapshot endTime
    if (state.status === "stopped" && prevStatusRef.current !== "stopped") {
      endTimeRef.current = Date.now();
      setCardDismissed(false);
    }
    prevStatusRef.current = state.status;
  }, [state.status]);

  const handleReset = () => {
    setCardDismissed(false);
    setSelectedRecord(null);
    resetTracking();
  };

  const handleSelectRecord = (record: RunRecord) => {
    setSelectedRecord(record);
    setShowHistory(false);
  };

  const styleToggle = <StyleToggle current={mapStyle} onChange={setMapStyle} />;

  const showCompleteCard =
    state.status === "stopped" &&
    state.points.length >= 1 &&
    !cardDismissed;

  return (
    <div className="relative w-screen h-[100dvh] bg-gray-950 overflow-hidden flex flex-col md:flex-row">

      {/* ── Map area ── */}
      <div className="relative flex-1 min-h-0 h-[calc(100dvh-160px)] md:h-full">
        <MapView
          points={selectedRecord ? selectedRecord.points : state.points}
          currentPosition={selectedRecord ? null : state.currentPosition}
          status={selectedRecord ? "stopped" : state.status}
          styleKey={mapStyle}
          styleToggleSlot={styleToggle}
        />

        {state.geoError && (
          <ErrorOverlay error={state.geoError} onReset={handleReset} />
        )}

        {/* ── Top header ── */}
        <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="flex items-start justify-between p-3 sm:p-4 gap-2">
            {/* Logo */}
            <div className="bg-gray-900/90 backdrop-blur-md rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-700/60 shadow-xl pointer-events-auto flex-shrink-0">
              <span className="font-[family-name:var(--font-heading)] text-lg sm:text-xl font-bold tracking-widest text-white uppercase">
                Run<span className="text-orange-500">Path</span>
              </span>
            </div>

            {/* Right side: hint + history button */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {state.status === "idle" && (
                <div className="hidden xs:flex bg-gray-900/80 backdrop-blur-md rounded-xl px-3 py-2 border border-gray-700/60 shadow-xl">
                  <p className="text-gray-400 text-xs">
                    Tap <span className="text-blue-400 font-semibold">Find My Location</span> to begin
                  </p>
                </div>
              )}
              {state.status === "located" && (
                <div className="hidden xs:flex bg-gray-900/80 backdrop-blur-md rounded-xl px-3 py-2 border border-gray-700/60 shadow-xl">
                  <p className="text-gray-400 text-xs">
                    <span className="text-green-400 font-semibold">Location found</span> — tap Start Run
                  </p>
                </div>
              )}

              {/* History button */}
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                aria-label="View run history"
                className="relative bg-gray-900/90 backdrop-blur-md rounded-xl p-2 border border-gray-700/60 shadow-xl text-gray-400 hover:text-white hover:bg-gray-800/90 transition-colors cursor-pointer"
              >
                <History size={18} />
                {/* Badge showing count */}
                {history.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {history.length > 99 ? "99+" : history.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ── Run Complete Card (current run) ── */}
        {showCompleteCard && !selectedRecord && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-4">
            <div className="pointer-events-auto">
              <RunCompleteCard
                state={state}
                endTime={endTimeRef.current}
                onDismiss={() => setCardDismissed(true)}
                onSave={addRecord}
              />
            </div>
          </div>
        )}

        {/* ── History replay card ── */}
        {selectedRecord && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-4">
            <div className="pointer-events-auto">
              <RecordDetailCard
                record={selectedRecord}
                onClose={() => setSelectedRecord(null)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Sidebar / bottom sheet ── */}
      <aside className="
        flex-shrink-0 flex flex-col w-full
        md:w-[220px] md:h-full md:overflow-y-auto lg:w-72
        bg-gray-950/95 md:bg-gray-950
        border-t border-gray-800 md:border-t-0 md:border-l md:border-gray-800
        z-20
      ">
        <div className="md:hidden">
          <StatsCard state={state} compact />
        </div>
        <div className="hidden md:block p-3 lg:p-4">
          <StatsCard state={state} />
        </div>

        <div className="px-3 pb-3 pt-2 md:px-3 md:pb-4 md:pt-0 lg:px-4 flex-shrink-0">
          <div className="bg-gray-900/80 md:bg-gray-900/90 backdrop-blur-md rounded-xl p-2.5 sm:p-3 border border-gray-700/60 shadow-xl">
            <ControlBar
              status={state.status}
              onLocate={locateMe}
              onStart={startTracking}
              onPause={pauseTracking}
              onResume={resumeTracking}
              onStop={stopTracking}
              onReset={handleReset}
            />
          </div>
        </div>

        <div className="hidden md:block flex-1" />
      </aside>

      {/* ── History panel (portal-like overlay) ── */}
      {showHistory && (
        <HistoryPanel
          records={history}
          onClose={() => setShowHistory(false)}
          onDelete={deleteRecord}
          onClear={clearHistory}
          onSelect={handleSelectRecord}
        />
      )}
    </div>
  );
}
