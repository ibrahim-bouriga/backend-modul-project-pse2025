"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default icons break in webpack environments — override with CDN paths
const carIcon = L.icon({
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

function MapPanner({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [map, lat, lng]);
  return null;
}

export default function LeafletMap({ position, trail }: LeafletMapProps) {
  const center: [number, number] = position
    ? [position.lat, position.lng]
    : [48.7778, 9.1800]; // Default: Stuttgart Schlossplatz

  const trailCoords: [number, number][] = trail.map((p) => [p.lat, p.lng]);

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: "500px", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {trailCoords.length > 1 && (
        <Polyline
          positions={trailCoords}
          pathOptions={{ color: "#f97316", weight: 4, opacity: 0.85 }}
        />
      )}
      {position && (
        <>
          <MapPanner lat={position.lat} lng={position.lng} />
          <Marker position={[position.lat, position.lng]} icon={carIcon}>
            <Popup>
              <strong>PSECars Super Car</strong>
              <br />
              {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
              <br />
              <span style={{ fontSize: "0.8em", color: "#888" }}>
                {new Date(position.timestamp).toLocaleTimeString()}
              </span>
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}
