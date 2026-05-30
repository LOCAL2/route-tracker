/** A single GPS coordinate captured during tracking */
export interface RoutePoint {
  lat: number;
  lng: number;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  accuracy?: number;
  speed?: number | null;
  altitude?: number | null;
}

/** Possible states of the tracker */
export type TrackingStatus =
  | "idle"
  | "locating"
  | "located"
  | "tracking"
  | "paused"
  | "stopped"
  | "error";

/** Geolocation permission / availability errors */
export type GeoError =
  | "permission_denied"
  | "position_unavailable"
  | "timeout"
  | "unsupported"
  | null;

/** Full tracking state managed by the hook */
export interface TrackingState {
  status: TrackingStatus;
  points: RoutePoint[];
  currentPosition: RoutePoint | null;
  totalDistance: number; // metres
  elapsedSeconds: number;
  averageSpeed: number; // km/h
  geoError: GeoError;
  /** Unix ms when Start was pressed (set by startTracking) */
  startTime: number | null;
}

/** A completed run saved to history */
export interface RunRecord {
  /** Unique ID */
  id: string;
  /** Unix ms when Start was pressed */
  startTime: number;
  /** Unix ms when Stop was pressed */
  endTime: number;
  /** Total distance in metres */
  totalDistance: number;
  /** Active running time in seconds */
  elapsedSeconds: number;
  /** Average speed in km/h */
  averageSpeed: number;
  /** All GPS points */
  points: RoutePoint[];
  /** Place name from reverse geocoding */
  placeName: string;
}
