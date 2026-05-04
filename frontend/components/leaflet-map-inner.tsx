"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapContainer, TileLayer, ImageOverlay, Popup,
  useMapEvents, useMap,
} from "react-leaflet";
import L from "leaflet";
import { api } from "@/lib/api";
import type { ZoneBounds } from "@/lib/api";

// Fix broken default marker icons in webpack/Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const BOUNDS: [[number, number], [number, number]] = [[15.5, 72.7], [19.5, 73.9]];
const CENTER: [number, number] = [17.5, 73.3];

const BASEMAP_TILES = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  carto: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  esri: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye",
    maxZoom: 18,
  },
} as const;

// Forces the map to recalculate its size after first render so tiles load correctly
function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  return null;
}

function ClickPopup() {
  const [pos, setPos] = useState<L.LatLng | null>(null);
  useMapEvents({ click: (e) => setPos(e.latlng) });
  if (!pos) return null;
  return (
    <Popup position={pos} eventHandlers={{ remove: () => setPos(null) }}>
      <div style={{ fontSize: 13 }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>Location</p>
        <p style={{ color: "#64748B" }}>Lat: {pos.lat.toFixed(4)}</p>
        <p style={{ color: "#64748B" }}>Lng: {pos.lng.toFixed(4)}</p>
        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 6, fontStyle: "italic" }}>
          Live pixel data requires satellite integration.
        </p>
      </div>
    </Popup>
  );
}

interface DrawRectProps {
  onComplete: (bounds: ZoneBounds) => void;
}

function DrawRect({ onComplete }: DrawRectProps) {
  const map = useMap();
  const startRef = useRef<L.LatLng | null>(null);
  const rectRef  = useRef<L.Rectangle | null>(null);

  useEffect(() => {
    map.getContainer().style.cursor = "crosshair";
    return () => {
      map.getContainer().style.cursor = "";
      if (rectRef.current) { map.removeLayer(rectRef.current); rectRef.current = null; }
    };
  }, [map]);

  useMapEvents({
    click(e) {
      if (!startRef.current) {
        startRef.current = e.latlng;
        const r = L.rectangle([e.latlng, e.latlng], {
          color: "#16A34A", weight: 2, dashArray: "6 3", fillOpacity: 0.08,
        });
        r.addTo(map);
        rectRef.current = r;
      } else {
        const bounds = L.latLngBounds(startRef.current, e.latlng);
        if (rectRef.current) { map.removeLayer(rectRef.current); rectRef.current = null; }
        // Draw the final solid rectangle
        const r = L.rectangle(bounds, { color: "#16A34A", weight: 2, fillOpacity: 0.15 });
        r.addTo(map);
        rectRef.current = r;
        onComplete({
          lat_min: bounds.getSouth(),
          lat_max: bounds.getNorth(),
          lng_min: bounds.getWest(),
          lng_max: bounds.getEast(),
        });
        startRef.current = null;
      }
    },
    mousemove(e) {
      if (!startRef.current || !rectRef.current) return;
      rectRef.current.setBounds(L.latLngBounds(startRef.current, e.latlng));
    },
  });
  return null;
}

export type Basemap = "osm" | "carto" | "esri";

interface Props {
  selectedYear: number;
  showRisk: boolean;
  basemap: Basemap;
  drawMode: boolean;
  onZoneSelect: (bounds: ZoneBounds) => void;
}

export default function LeafletMapInner({ selectedYear, showRisk, basemap, drawMode, onZoneSelect }: Props) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [selectedYear, showRisk]);

  // Use transparent overlay PNGs so basemap shows through non-mangrove areas
  const overlayUrl = showRisk
    ? api.mapImageUrl("risk_heatmap_overlay")
    : api.mapImageUrl(`mangrove_map_${selectedYear}_overlay`);

  const tiles = BASEMAP_TILES[basemap];

  return (
    <MapContainer
      center={CENTER}
      zoom={8}
      style={{ width: "100%", height: "500px" }}
      scrollWheelZoom
      preferCanvas
    >
      <InvalidateSize />
      {/* key forces TileLayer remount on basemap change so old tiles clear */}
      <TileLayer
        key={basemap}
        url={tiles.url}
        attribution={tiles.attribution}
        maxZoom={tiles.maxZoom}
        keepBuffer={4}
      />
      {!imgError && (
        <ImageOverlay
          url={overlayUrl}
          bounds={BOUNDS}
          opacity={1.0}
          eventHandlers={{ error: () => setImgError(true) }}
        />
      )}
      {drawMode ? <DrawRect onComplete={onZoneSelect} /> : <ClickPopup />}
    </MapContainer>
  );
}
