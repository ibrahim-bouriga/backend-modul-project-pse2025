"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import leaflet from "leaflet";

const carIcon = leaflet.divIcon({
  className: "",
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
    <filter id="shadow">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#00000066"/>
    </filter>
    <g filter="url(#shadow)">
      <rect x="3" y="9" width="18" height="8" rx="2" fill="#f97316"/>
      <rect x="5" y="6" width="14" height="6" rx="2" fill="#f97316"/>
      <rect x="6" y="7" width="5" height="4" rx="1" fill="#bfdbfe" opacity="0.9"/>
      <rect x="13" y="7" width="5" height="4" rx="1" fill="#bfdbfe" opacity="0.9"/>
      <circle cx="7.5" cy="17.5" r="2" fill="#1c1917"/>
      <circle cx="7.5" cy="17.5" r="0.9" fill="#78716c"/>
      <circle cx="16.5" cy="17.5" r="2" fill="#1c1917"/>
      <circle cx="16.5" cy="17.5" r="0.9" fill="#78716c"/>
      <rect x="2" y="11" width="2" height="3" rx="0.5" fill="#fbbf24"/>
      <rect x="20" y="11" width="2" height="3" rx="0.5" fill="#ef4444"/>
    </g>
  </svg>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

export interface VehicleTelemetry {
  lat: number;
  lng: number;
  speed: number | null; // m/s — from GPS Doppler chip or calculated
  timestamp: string;
}

interface LeafletMapProps {
  position: VehicleTelemetry | null;
  follow: VehicleTelemetry | null;
  trail: VehicleTelemetry[];
}

// Owns interpolation + both polylines so the live segment always ends at the marker
function CarController({
  position,
  follow,
  trail,
}: {
  position: VehicleTelemetry | null;
  follow: VehicleTelemetry | null;
  trail: VehicleTelemetry[];
}) {
  const map = useMap();
  const markerRef          = useRef<leaflet.Marker | null>(null);
  const confirmedLineRef   = useRef<leaflet.Polyline | null>(null);
  const liveSegmentRef     = useRef<leaflet.Polyline | null>(null);

  // All animation state in refs — no React state, stays frame-synchronous
  const fromRef         = useRef<{ lat: number; lng: number } | null>(null);
  const toRef           = useRef<{ lat: number; lng: number } | null>(null);
  const animatedRef     = useRef<{ lat: number; lng: number } | null>(null);
  const animStartRef    = useRef<number>(0);
  const animDurationRef = useRef<number>(1000); // adapts to actual update interval
  const prevPositionRef = useRef<VehicleTelemetry | null>(null);

  // Ref so the rAF loop can always read the latest trail without a closure dependency
  const trailRef = useRef<VehicleTelemetry[]>([]);

  useEffect(() => {
    trailRef.current = trail;
  }, [trail]);

  // Mount: create all Leaflet objects + start rAF loop
  useEffect(() => {
    markerRef.current = leaflet
      .marker([48.7778, 9.18], { icon: carIcon })
      .bindPopup("<strong>PSECars Super Car</strong>")
      .addTo(map);

    const lineStyle = { color: "#f97316", weight: 5, opacity: 0.9, renderer: leaflet.canvas() };
    confirmedLineRef.current = leaflet.polyline([], lineStyle).addTo(map);
    liveSegmentRef.current   = leaflet.polyline([], lineStyle).addTo(map);

    let frame: number;

    function loop(now: number) {
      const from = fromRef.current;
      const to   = toRef.current;

      if (from && to && markerRef.current) {
        const t   = Math.min((now - animStartRef.current) / animDurationRef.current, 1);
        const lat = from.lat + (to.lat - from.lat) * t;
        const lng = from.lng + (to.lng - from.lng) * t;
        animatedRef.current = { lat, lng };

        // Direct DOM updates — no React scheduler involved
        markerRef.current.setLatLng([lat, lng]);

        // Live segment: last confirmed trail point → current animated position
        const t2 = trailRef.current;
        const last = t2[t2.length - 1];
        if (last) {
          liveSegmentRef.current?.setLatLngs([[last.lat, last.lng], [lat, lng]]);
        }
      }

      frame = requestAnimationFrame(loop);
    }

    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      markerRef.current?.remove();
      confirmedLineRef.current?.remove();
      liveSegmentRef.current?.remove();
    };
  }, [map]);

  // Confirmed trail polyline — only redrawn when trail prop changes
  useEffect(() => {
    if (!confirmedLineRef.current) return;
    if (trail.length < 2) {
      confirmedLineRef.current.setLatLngs([]);
    } else {
      confirmedLineRef.current.setLatLngs(trail.map((p) => [p.lat, p.lng]));
    }
  }, [trail]);

  // New server position → adapt animation duration + update target
  useEffect(() => {
    if (!position) return;
    const now  = performance.now();
    const prev = prevPositionRef.current;

    if (prev && (position.lat !== prev.lat || position.lng !== prev.lng)) {
      // Use payload timestamps for accurate interval measurement (removes polling-timing noise)
      const payloadDt =
        new Date(position.timestamp).getTime() - new Date(prev.timestamp).getTime();
      if (payloadDt > 100 && payloadDt < 30_000) {
        // Animate 90% of the real interval so car always arrives just before the next update
        animDurationRef.current = payloadDt * 0.9;
      }
    }

    prevPositionRef.current = position;

    if (!toRef.current) {
      const pt = { lat: position.lat, lng: position.lng };
      fromRef.current = toRef.current = animatedRef.current = pt;
      animStartRef.current = now;
      return;
    }

    if (position.lat === toRef.current.lat && position.lng === toRef.current.lng) return;

    fromRef.current  = animatedRef.current ?? { lat: position.lat, lng: position.lng };
    toRef.current    = { lat: position.lat, lng: position.lng };
    animStartRef.current = now;
  }, [position]);

  // Camera pan — animate:false avoids Leaflet CSS transforms conflicting with our rAF updates
  useEffect(() => {
    if (!follow) return;
    map.setView([follow.lat, follow.lng], map.getZoom(), { animate: true, duration: 0.9 });
  }, [map, follow]);

  return null;
}

export default function LeafletMap({ position, follow, trail }: LeafletMapProps) {
  return (
    <MapContainer
      center={[48.7778, 9.18]}
      zoom={14}
      style={{ height: "70vh", minHeight: "500px", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CarController position={position} follow={follow} trail={trail} />
    </MapContainer>
  );
}
