'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

import { VehicleMapProps } from './types';

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function RecenterMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), {
      animate: true,
      duration: 0.75,
    });
  }, [latitude, longitude, map]);

  return null;
}

export default function VehicleMap({
  latitude,
  longitude,
  nickname,
}: VehicleMapProps) {
  if (latitude === null || longitude === null) {
    return (
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Vehicle map
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">Live position</h3>
        </div>
        <div className="flex h-[320px] items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/60 text-center text-sm text-zinc-500">
          Waiting for GPS coordinates from the vehicle.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Vehicle map
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">Live position</h3>
        </div>
        <div className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </div>
      </div>

      <div className="h-[320px] overflow-hidden rounded-3xl border border-zinc-800">
        <MapContainer
          center={[latitude, longitude]}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap latitude={latitude} longitude={longitude} />
          <Marker position={[latitude, longitude]} />
        </MapContainer>
      </div>

      <p className="mt-4 text-sm text-zinc-400">
        Tracking {nickname || 'your vehicle'} in real time via MQTT GPS updates.
      </p>
    </section>
  );
}
