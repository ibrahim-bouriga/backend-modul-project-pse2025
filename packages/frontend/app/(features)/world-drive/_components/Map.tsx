"use client";
import { useEffect, useRef, Fragment } from "react";
import { MapContainer, TileLayer, Polyline, ZoomControl, useMap } from "react-leaflet";
import leaflet from "leaflet";


function makeCarIcon(color: string): leaflet.DivIcon {
  return leaflet.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
      <rect x="3" y="9" width="18" height="8" rx="2" fill="${color}"/>
      <rect x="5" y="6" width="14" height="6" rx="2" fill="${color}"/>
      <rect x="6" y="7" width="5" height="4" rx="1" fill="#bfdbfe" opacity="0.9"/>
      <rect x="13" y="7" width="5" height="4" rx="1" fill="#bfdbfe" opacity="0.9"/>
      <circle cx="7.5" cy="17.5" r="2" fill="#1c1917"/>
      <circle cx="7.5" cy="17.5" r="0.9" fill="#78716c"/>
      <circle cx="16.5" cy="17.5" r="2" fill="#1c1917"/>
      <circle cx="16.5" cy="17.5" r="0.9" fill="#78716c"/>
      <rect x="2" y="11" width="2" height="3" rx="0.5" fill="#fbbf24"/>
      <rect x="20" y="11" width="2" height="3" rx="0.5" fill="#ef4444"/>
    </svg>`,
    iconSize:    [36, 36],
    iconAnchor:  [18, 18],
    popupAnchor: [0, -20],
  });
}

export interface VehicleTelemetry {
  lat:       number;
  lng:       number;
  speed:     number | null;
  timestamp: string;
}

export interface CarDisplayState {
  id:       string;
  color:    string;
  position: VehicleTelemetry | null; // null solange kein Signal da ist
  trail:    VehicleTelemetry[];
}

export interface LeafletMapProps {
  initialCenter: [number, number]; //wo die Karte beim ersten Render zentriert wird
  cars:          CarDisplayState[]; // alle Autos mit Position, Trail und Farbe (s.o.)
  followCarId:   string | null; // welches Auto die Kamera gerade folgt
  onCarSelect:   (carId: string) => void; // Callback wenn ein Auto-Marker geklickt wird
}

/**
 * Zeichnet Linen des Fahrverlaufs in der Farbe vom Auto
 * 
 */
function CarTrail({ color, trail }: { color: string; trail: VehicleTelemetry[] }) { 
  if (trail.length < 2) {
    return null;
  }
  return (
    <Polyline
      positions={trail.map((p) => [p.lat, p.lng] as [number, number])}
      pathOptions={{ color, weight: 5, opacity: 0.8 }}
    />
  );
}

/**
 * bewegt einen Auto-Marker flüssig auf der Karte
 * position = letzter empfangener GPS-Datenpunkt
 */
function CarMarker({
  id, color, position, onSelect,
}: {
  id:       string;
  color:    string;
  position: VehicleTelemetry | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const markerRef = useRef<leaflet.Marker | null>(null);
  const isFirst   = useRef(true);

  // Marker einmalig beim Mount erstellen (unsichtbar)
  useEffect(() => {
    const marker = leaflet
      .marker([0, 0], { icon: makeCarIcon(color), opacity: 0 })
      .addTo(map)
      .on("click", () => onSelect(id));
    markerRef.current = marker;
    isFirst.current   = true;
    return () => { marker.remove(); };
  }, [map]);

  // Bei jeder neuen Position: Marker setzen; der Browser animiert via CSS Transition
  useEffect(() => {
    const marker = markerRef.current; // marker = Leaflet-Objekt auf der Karte, null bis der erste useEffect gelaufen ist
    if (!position || !marker) return;
    marker.setLatLng([position.lat, position.lng]);
    if (isFirst.current) {
      isFirst.current = false;
      marker.setOpacity(1);
      // Transition erst nach dem ersten Sprung aktivieren, damit der Marker nicht von [0,0] einfliegt
      requestAnimationFrame(() => {
        marker.getElement()?.style.setProperty("transition", "transform 190ms linear");
      });
    }
  }, [position]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}


function CameraFollower({ position }: { position: VehicleTelemetry | null }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    map.setView([position.lat, position.lng], map.getZoom(), { animate: true, duration: 0.9 });
  }, [map, position]);
  return null;
}

export default function LeafletMap({ initialCenter, cars, followCarId, onCarSelect }: LeafletMapProps) {
  const focusedCar = cars.find((c) => c.id === followCarId);

  return (
    <MapContainer center={initialCenter} zoom={10} zoomControl={false} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {cars.map((car) => (
        <Fragment key={car.id}>
          <CarTrail color={car.color} trail={car.trail} />
          <CarMarker id={car.id} color={car.color} position={car.position} onSelect={onCarSelect} />
        </Fragment>
      ))}
      <CameraFollower position={focusedCar?.position ?? null} />
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
}
