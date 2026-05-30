import { useEffect, useRef, useState } from "react";

/**
 * Returns the device's compass heading in degrees (0–360, 0 = North).
 * Uses DeviceOrientationEvent on mobile.
 * Returns null if not supported or permission denied.
 */
export function useDeviceHeading(): number | null {
  const [heading, setHeading] = useState<number | null>(null);
  const lastHeadingRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // iOS 13+ requires permission request
    const requestAndListen = async () => {
      // @ts-expect-error — requestPermission is iOS-only
      if (typeof DeviceOrientationEvent?.requestPermission === "function") {
        try {
          // @ts-expect-error
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm !== "granted") return;
        } catch {
          return;
        }
      }

      const handler = (e: DeviceOrientationEvent) => {
        let deg: number | null = null;

        // webkitCompassHeading is available on iOS (true north)
        if ("webkitCompassHeading" in e && typeof (e as DeviceOrientationEvent & { webkitCompassHeading: number }).webkitCompassHeading === "number") {
          deg = (e as DeviceOrientationEvent & { webkitCompassHeading: number }).webkitCompassHeading;
        } else if (e.alpha !== null) {
          // Android: alpha is rotation around Z axis (0 = north when facing up)
          // Convert to compass bearing
          deg = (360 - e.alpha) % 360;
        }

        if (deg === null) return;

        // Smooth with low-pass filter to reduce jitter
        if (lastHeadingRef.current !== null) {
          // Handle wrap-around (e.g. 359° → 1°)
          let diff = deg - lastHeadingRef.current;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          deg = (lastHeadingRef.current + diff * 0.3 + 360) % 360;
        }

        lastHeadingRef.current = deg;
        setHeading(Math.round(deg));
      };

      window.addEventListener("deviceorientationabsolute" as "deviceorientation", handler, true);
      window.addEventListener("deviceorientation", handler, true);

      return () => {
        window.removeEventListener("deviceorientationabsolute" as "deviceorientation", handler, true);
        window.removeEventListener("deviceorientation", handler, true);
      };
    };

    let cleanup: (() => void) | undefined;
    requestAndListen().then((fn) => { cleanup = fn; });

    return () => { cleanup?.(); };
  }, []);

  return heading;
}
