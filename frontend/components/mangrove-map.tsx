"use client";

import dynamic from "next/dynamic";
import type { Basemap } from "./leaflet-map-inner";
import type { ZoneBounds } from "@/lib/api";

// Leaflet must be loaded client-side only
const LeafletMap = dynamic(() => import("./leaflet-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-gray-50 rounded-xl text-muted text-sm">
      Loading map…
    </div>
  ),
});

interface MangroveMapProps {
  selectedYear: number;
  showRisk: boolean;
  basemap: Basemap;
  drawMode: boolean;
  onZoneSelect: (bounds: ZoneBounds) => void;
}

export default function MangroveMap(props: MangroveMapProps) {
  return <LeafletMap {...props} />;
}
