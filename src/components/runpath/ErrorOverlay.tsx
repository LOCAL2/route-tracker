import type { GeoError } from "@/types/tracking";
import { AlertTriangle, WifiOff, ShieldOff, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorOverlayProps {
  error: GeoError;
  onReset: () => void;
}

const ERROR_INFO: Record<
  NonNullable<GeoError>,
  { icon: React.ReactNode; title: string; description: string }
> = {
  permission_denied: {
    icon: <ShieldOff size={32} className="text-red-400" />,
    title: "Location Access Denied",
    description:
      "RunPath needs location permission to track your route. Please allow location access in your browser settings and try again.",
  },
  position_unavailable: {
    icon: <WifiOff size={32} className="text-orange-400" />,
    title: "GPS Signal Lost",
    description:
      "Unable to determine your position. Make sure you're outdoors with a clear view of the sky, then try again.",
  },
  timeout: {
    icon: <AlertTriangle size={32} className="text-yellow-400" />,
    title: "Location Timeout",
    description:
      "Getting your location took too long. Check your GPS signal and try again.",
  },
  unsupported: {
    icon: <Globe size={32} className="text-gray-400" />,
    title: "Browser Not Supported",
    description:
      "Your browser doesn't support the Geolocation API. Please use a modern browser like Chrome, Firefox, or Safari.",
  },
};

export function ErrorOverlay({ error, onReset }: ErrorOverlayProps) {
  if (!error) return null;

  const info = ERROR_INFO[error];

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-gray-950/70 backdrop-blur-sm p-4">
      <Card className="max-w-sm w-full">
        <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
          {info.icon}
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-white uppercase tracking-wide mb-2">
              {info.title}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {info.description}
            </p>
          </div>
          <Button variant="outline" onClick={onReset} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
