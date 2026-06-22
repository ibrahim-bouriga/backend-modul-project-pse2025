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

export interface CarPosition {
  lat: number;
  lng: number;
  timestamp: string;
}

interface LeafletMapProps {
  position: CarPosition | null;
  trail: CarPosition[];
}

// Imperative car marker + map follow — bypasses React reconciliation for smooth 60fps updates
function CarController({ position }: { position: CarPosition | null }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    markerRef.current = leaflet.marker([48.7778, 9.18], { icon: carIcon })
      .bindPopup("<strong>PSECars Super Car</strong>")
      .addTo(map);
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (!position || !markerRef.current) return;
    const latlng: L.LatLngTuple = [position.lat, position.lng];
    markerRef.current.setLatLng(latlng);
    // animate:false so map tracks the interpolated position exactly each frame
    map.setView(latlng, map.getZoom(), { animate: false });
  }, [map, position]);

  return null;
}

// Imperative polyline — bypasses react-leaflet v5 / Tailwind CSS compatibility issues
function TrailPolyline({ trail }: { trail: CarPosition[] }) {
  const map = useMap();
  const polylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    polylineRef.current = leaflet.polyline([], {
      color: "#f97316",
      weight: 5,
      opacity: 0.9,
      renderer: leaflet.canvas(),
    }).addTo(map);
    return () => {
      polylineRef.current?.remove();
      polylineRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (!polylineRef.current || trail.length < 2) return;
    polylineRef.current.setLatLngs(trail.map((p) => [p.lat, p.lng]));
  }, [trail]);

  return null;
}

export default function LeafletMap({ position, trail }: LeafletMapProps) {
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
      <TrailPolyline trail={trail} />
      <CarController position={position} />
    </MapContainer>
  );
}
