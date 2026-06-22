"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import leaflet from "leaflet";

const carIcon = leaflet.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
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
