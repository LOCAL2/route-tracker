import { useEffect, useRef, useCallback, useState } from "react";
import { Map, MapRoute, MapMarker, MarkerContent, useMap, type MapRef } from "@/components/ui/map";
import type { RoutePoint, TrackingStatus } from "@/types/tracking";
import { Layers, Info } from "lucide-react";

// ── Map style definitions ────────────────────────────────────────────────────

export type MapStyleKey = "carto-dark" | "osm-3d" | "maptiler-3d";

const MAPTILER_KEY = "ZZR0gxObw7vxzm5me3pW";

const MAP_STYLES: Record<MapStyleKey, { label: string; dark: string; light: string; is3D: boolean }> = {
  "carto-dark": {
    label: "Dark",
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    light: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    is3D: false,
  },
  "maptiler-3d": {
    label: "3D",
    dark: `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`,
    light: `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`,
    is3D: true,
  },
  "osm-3d": {
    label: "OSM",
    dark: "https://tiles.openfreemap.org/styles/liberty",
    light: "https://tiles.openfreemap.org/styles/liberty",
    is3D: true,
  },
};

// ── Style toggle button ──────────────────────────────────────────────────────

interface StyleToggleProps {
  current: MapStyleKey;
  onChange: (key: MapStyleKey) => void;
}

function StyleToggle({ current, onChange }: StyleToggleProps) {
  const keys = Object.keys(MAP_STYLES) as MapStyleKey[];
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex flex-col items-start gap-1.5">
      {/* Toggle pill */}
      <div className="flex items-center gap-1 bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-700/60 shadow-xl p-1">
        <Layers size={14} className="text-gray-400 ml-1.5 mr-0.5 flex-shrink-0" />
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={[
              "px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer",
              current === key
                ? "bg-orange-500 text-white shadow"
                : "text-gray-400 hover:text-white hover:bg-gray-700/60",
            ].join(" ")}
            aria-pressed={current === key}
          >
            {MAP_STYLES[key].label}
          </button>
        ))}

        {/* Info button — only visible when osm-3d is active */}
        {current === "osm-3d" && (
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            className="ml-0.5 mr-1 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            aria-label="About 3D buildings"
          >
            <Info size={13} />
          </button>
        )}
      </div>

      {/* OSM 3D info tooltip */}
      {current === "osm-3d" && showInfo && (
        <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700/60 rounded-xl shadow-xl px-3 py-2.5 max-w-[220px]">
          <p className="text-gray-200 text-xs font-semibold mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            3D Buildings
          </p>
          <p className="text-gray-400 text-[11px] leading-relaxed">
            ตึก 3D ขึ้นอยู่กับข้อมูล{" "}
            <span className="text-gray-300 font-medium">OpenStreetMap</span>{" "}
            ในพื้นที่นั้น บางเมืองอาจยังไม่มีข้อมูล 3D
          </p>
        </div>
      )}

      {/* Maptiler badge */}
      {current === "maptiler-3d" && (
        <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700/60 rounded-lg shadow-xl px-2.5 py-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
          <span className="text-gray-400 text-[10px]">
            Powered by <span className="text-gray-200 font-medium">Maptiler</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ── Inner component — has access to useMap() context ────────────────────────

interface MapViewProps {
  points: RoutePoint[];
  currentPosition: RoutePoint | null;
  status: TrackingStatus;
}

interface MapInnerProps extends MapViewProps {
  hasFlownRef: React.MutableRefObject<boolean>;
  mapRef: React.RefObject<MapRef | null>;
  styleKey: MapStyleKey;
}

function MapInner({ points, currentPosition, status, hasFlownRef, mapRef, styleKey }: MapInnerProps) {
  const { map, isLoaded } = useMap();

  // Keep mapRef in sync for external access (pitch control)
  useEffect(() => {
    if (map) (mapRef as React.MutableRefObject<MapRef | null>).current = map;
  }, [map, mapRef]);

  // ── Pitch when switching to/from 3D ───────────────────────────────────────
  useEffect(() => {
    if (!map || !isLoaded) return;
    const target = MAP_STYLES[styleKey].is3D ? 55 : 0;
    map.easeTo({ pitch: target, duration: 600 });
  }, [map, isLoaded, styleKey]);

  // ── Add 3D building extrusion for Maptiler style ──────────────────────────
  useEffect(() => {
    if (!map || !isLoaded) return;
    if (styleKey !== "maptiler-3d") return;

    const t = setTimeout(() => {
      try {
        if (map.getLayer("3d-buildings")) return;

        const style = map.getStyle();
        if (!style) return;

        // Auto-detect the source that contains a "building" source-layer
        let buildingSource: string | null = null;
        for (const layer of style.layers ?? []) {
          if (
            "source-layer" in layer &&
            layer["source-layer"] === "building" &&
            layer.source
          ) {
            buildingSource = layer.source as string;
            break;
          }
        }
        if (!buildingSource) {
          console.warn("RunPath: could not find building source in style");
          return;
        }

        // Insert below the first symbol layer that has a text-field (labels)
        const labelLayer = style.layers?.find(
          (l) =>
            l.type === "symbol" &&
            "layout" in l &&
            (l as { layout?: { "text-field"?: unknown } }).layout?.["text-field"]
        );
        const beforeId = labelLayer?.id;

        map.addLayer(
          {
            id: "3d-buildings",
            source: buildingSource,
            "source-layer": "building",
            filter: ["!", ["to-boolean", ["get", "hide_3d"]]],
            type: "fill-extrusion",
            minzoom: 13,
            paint: {
              "fill-extrusion-color": [
                "interpolate", ["linear"], ["get", "render_height"],
                0,   "#1a2744",
                30,  "#1e3a5f",
                80,  "#243b55",
                200, "#2d4a6b",
              ],
              "fill-extrusion-height": [
                "interpolate", ["linear"], ["zoom"],
                13, 0,
                16, ["get", "render_height"],
              ],
              "fill-extrusion-base": [
                "case",
                [">=", ["zoom"], 16],
                ["get", "render_min_height"],
                0,
              ],
              "fill-extrusion-opacity": 0.9,
            },
          },
          beforeId
        );
      } catch (e) {
        console.warn("3d-buildings layer error:", e);
      }
    }, 400);

    return () => {
      clearTimeout(t);
      try {
        if (map.getLayer("3d-buildings")) map.removeLayer("3d-buildings");
      } catch { /* ignore */ }
    };
  }, [map, isLoaded, styleKey]);

  // ── First GPS fix: fly in smoothly ────────────────────────────────────────
  useEffect(() => {
    if (!map || !isLoaded || !currentPosition) return;
    if (hasFlownRef.current) return;

    hasFlownRef.current = true;
    map.flyTo({
      center: [currentPosition.lng, currentPosition.lat],
      zoom: 17,
      speed: 1.4,
      curve: 1.6,
      easing: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    });
  }, [map, isLoaded, currentPosition, hasFlownRef]);

  // ── Follow user while tracking / paused ───────────────────────────────────
  useEffect(() => {
    if (!map || !isLoaded || !currentPosition) return;
    if (!hasFlownRef.current) return;
    if (status !== "tracking" && status !== "paused") return;

    map.easeTo({
      center: [currentPosition.lng, currentPosition.lat],
      duration: 800,
      easing: (t) => t,
    });
  }, [map, isLoaded, currentPosition, status, hasFlownRef]);

  // ── Fit bounds when stopped ────────────────────────────────────────────────
  const fitBounds = useCallback(() => {
    if (!map || points.length < 2) return;
    const lngs = points.map((p) => p.lng);
    const lats = points.map((p) => p.lat);
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 80, duration: 1000 },
    );
  }, [map, points]);

  useEffect(() => {
    if (status !== "stopped") return;
    const t = setTimeout(fitBounds, 300);
    return () => clearTimeout(t);
  }, [status, fitBounds]);

  // ── Coordinate arrays ──────────────────────────────────────────────────────
  const routeCoords: [number, number][] = points.map((p) => [p.lng, p.lat]);
  const startPoint = points[0];
  const endPoint = status === "stopped" && points.length > 1 ? points[points.length - 1] : null;

  return (
    <>
      {/* Route line — blue */}
      {routeCoords.length >= 2 && (
        <MapRoute
          id="run-route"
          coordinates={routeCoords}
          color="#3b82f6"
          width={4}
          opacity={0.9}
          interactive={false}
        />
      )}

      {/* Start marker — green */}
      {startPoint && (
        <MapMarker longitude={startPoint.lng} latitude={startPoint.lat}>
          <MarkerContent>
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-lg shadow-green-500/40" />
          </MarkerContent>
        </MapMarker>
      )}

      {/* End marker — dark */}
      {endPoint && (
        <MapMarker longitude={endPoint.lng} latitude={endPoint.lat}>
          <MarkerContent>
            <div className="w-4 h-4 rounded-full bg-gray-900 border-2 border-white shadow-lg" />
          </MarkerContent>
        </MapMarker>
      )}

      {/* Current position — red dot, pulse only while tracking */}
      {currentPosition && (
        <MapMarker longitude={currentPosition.lng} latitude={currentPosition.lat}>
          <MarkerContent>
            <div className="relative flex items-center justify-center">
              {status === "tracking" && (
                <div className="absolute w-8 h-8 rounded-full bg-red-500/30 location-marker-pulse" />
              )}
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg shadow-red-500/50 z-10" />
            </div>
          </MarkerContent>
        </MapMarker>
      )}
    </>
  );
}

// ── Public MapView ────────────────────────────────────────────────────────────

interface MapViewFullProps extends MapViewProps {
  /** Slot for the style toggle — rendered inside the map container */
  styleToggleSlot?: React.ReactNode;
  styleKey: MapStyleKey;
}

export function MapView({ points, currentPosition, status, styleToggleSlot, styleKey }: MapViewFullProps) {
  const hasFlownRef = useRef(false);
  const mapRef = useRef<MapRef | null>(null);

  // Reset fly flag on new run (idle) or when locate fires fresh
  useEffect(() => {
    if (status === "idle" || (status === "tracking" && points.length === 0)) {
      hasFlownRef.current = false;
    }
  }, [status, points.length]);

  const style = MAP_STYLES[styleKey];

  return (
    <div className="absolute inset-0 w-full h-full">
      <Map
        ref={mapRef}
        theme="dark"
        styles={{ dark: style.dark, light: style.light }}
        center={[100.5018, 13.7563]}
        zoom={12}
        className="absolute inset-0 w-full h-full"
        aria-label="GPS route map"
      >
        <MapInner
          points={points}
          currentPosition={currentPosition}
          status={status}
          hasFlownRef={hasFlownRef}
          mapRef={mapRef}
          styleKey={styleKey}
        />
      </Map>

      {/* Style toggle — positioned bottom-left, above attribution */}
      {styleToggleSlot && (
        <div className="absolute bottom-8 left-3 z-10">
          {styleToggleSlot}
        </div>
      )}
    </div>
  );
}

export { StyleToggle };
