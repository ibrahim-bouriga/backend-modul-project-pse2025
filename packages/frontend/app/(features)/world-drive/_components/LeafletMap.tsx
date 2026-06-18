"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

function MapPanner({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [map, lat, lng]);
  return null;
}

export default function LeafletMap({ position }: { position: CarPosition | null }) {
  const center: [number, number] = position
    ? [position.lat, position.lng]
    : [48.7758, 9.1829]; // Default: Stuttgart

  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ height: "500px", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
