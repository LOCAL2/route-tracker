import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GeoError,
  RoutePoint,
  TrackingState,
  TrackingStatus,
} from "@/types/tracking";
import { haversineDistance } from "@/utils/distance";

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 0,
};

function geoErrorCode(code: number): GeoError {
  switch (code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return "permission_denied";
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return "position_unavailable";
    case GeolocationPositionError.TIMEOUT:
      return "timeout";
    default:
      return "position_unavailable";
  }
}

const INITIAL_STATE: TrackingState = {
  status: "idle",
  points: [],
  currentPosition: null,
  totalDistance: 0,
  elapsedSeconds: 0,
  averageSpeed: 0,
  geoError: null,
  startTime: null,
};

export function useGeolocationTracker() {
  const [state, setState] = useState<TrackingState>(INITIAL_STATE);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<TrackingStatus>("idle");
  const startTimeRef = useRef<number | null>(null);
  const pausedSecondsRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);

  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      if (statusRef.current !== "tracking") return;
      const now = Date.now();
      const wallSeconds = startTimeRef.current
        ? (now - startTimeRef.current) / 1000
        : 0;
      const elapsed = Math.max(0, wallSeconds - pausedSecondsRef.current);
      setState((prev) => {
        const avgSpeed =
          elapsed > 0 ? (prev.totalDistance / 1000 / elapsed) * 3600 : 0;
        return { ...prev, elapsedSeconds: elapsed, averageSpeed: avgSpeed };
      });
    }, 1000);
  }, [clearTimer]);

  const handlePosition = useCallback((pos: GeolocationPosition) => {
    if (statusRef.current !== "tracking") return;

    const point: RoutePoint = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      timestamp: pos.timestamp,
      accuracy: pos.coords.accuracy,
      speed: pos.coords.speed,
      altitude: pos.coords.altitude,
    };

    setState((prev) => {
      const newPoints = [...prev.points, point];
      let newDistance = prev.totalDistance;
      if (prev.points.length > 0) {
        newDistance += haversineDistance(prev.points[prev.points.length - 1], point);
      }
      const elapsed = prev.elapsedSeconds;
      const avgSpeed = elapsed > 0 ? (newDistance / 1000 / elapsed) * 3600 : 0;
      return {
        ...prev,
        currentPosition: point,
        points: newPoints,
        totalDistance: newDistance,
        averageSpeed: avgSpeed,
        geoError: null,
      };
    });
  }, []);

  const handleError = useCallback(
    (err: GeolocationPositionError) => {
      clearWatch();
      clearTimer();
      setState((prev) => ({
        ...prev,
        status: "error",
        geoError: geoErrorCode(err.code),
      }));
    },
    [clearWatch, clearTimer]
  );

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, status: "error", geoError: "unsupported" }));
      return;
    }
    setState((prev) => ({ ...prev, status: "locating", geoError: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point: RoutePoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: pos.timestamp,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          altitude: pos.coords.altitude,
        };
        setState((prev) => ({ ...prev, status: "located", currentPosition: point, geoError: null }));
      },
      (err) => {
        setState((prev) => ({ ...prev, status: "error", geoError: geoErrorCode(err.code) }));
      },
      GEO_OPTIONS
    );
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, status: "error", geoError: "unsupported" }));
      return;
    }
    const now = Date.now();
    startTimeRef.current = now;
    pausedSecondsRef.current = 0;
    pauseStartRef.current = null;

    setState((prev) => ({
      ...prev,
      status: "tracking",
      points: [],
      totalDistance: 0,
      elapsedSeconds: 0,
      averageSpeed: 0,
      geoError: null,
      startTime: now,
    }));

    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, GEO_OPTIONS);
    startTimer();
  }, [handlePosition, handleError, startTimer]);

  const pauseTracking = useCallback(() => {
    if (statusRef.current !== "tracking") return;
    clearWatch();
    clearTimer();
    pauseStartRef.current = Date.now();
    setState((prev) => ({ ...prev, status: "paused" }));
  }, [clearWatch, clearTimer]);

  const resumeTracking = useCallback(() => {
    if (statusRef.current !== "paused") return;
    if (!navigator.geolocation) return;
    if (pauseStartRef.current !== null) {
      pausedSecondsRef.current += (Date.now() - pauseStartRef.current) / 1000;
      pauseStartRef.current = null;
    }
    setState((prev) => ({ ...prev, status: "tracking" }));
    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, GEO_OPTIONS);
    startTimer();
  }, [handlePosition, handleError, startTimer]);

  const stopTracking = useCallback(() => {
    clearWatch();
    clearTimer();
    const now = Date.now();
    const wallSeconds = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;
    const finalElapsed = Math.max(0, wallSeconds - pausedSecondsRef.current);
    setState((prev) => {
      const finalAvgSpeed =
        finalElapsed > 0 ? (prev.totalDistance / 1000 / finalElapsed) * 3600 : 0;
      return {
        ...prev,
        status: "stopped",
        elapsedSeconds: finalElapsed,
        averageSpeed: finalAvgSpeed,
      };
    });
  }, [clearWatch, clearTimer]);

  const resetTracking = useCallback(() => {
    clearWatch();
    clearTimer();
    startTimeRef.current = null;
    pausedSecondsRef.current = 0;
    pauseStartRef.current = null;
    setState(INITIAL_STATE);
  }, [clearWatch, clearTimer]);

  useEffect(() => {
    return () => {
      clearWatch();
      clearTimer();
    };
  }, [clearWatch, clearTimer]);

  return {
    state,
    locateMe,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    resetTracking,
  };
}
