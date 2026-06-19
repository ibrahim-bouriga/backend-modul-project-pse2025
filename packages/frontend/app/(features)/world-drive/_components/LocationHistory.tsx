'use client';

import { useEffect } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { LocationHistoryPoint } from './types';

interface LocationHistoryProps {
  history: LocationHistoryPoint[];
  color?: string;
  weight?: number;
}

export default function LocationHistory({
  history,
  color = '#3b82f6',
  weight = 3,
}: LocationHistoryProps) {
  const map = useMap();

  // Convert history points to Leaflet LatLng format
  const positions: LatLngExpression[] = history.map((point) => [
    point.latitude,
    point.longitude,
  ]);

  useEffect(() => {
    // Fit map bounds to show entire trail when history changes
    if (positions.length > 1) {
      const bounds = positions.map((pos) => pos as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [history.length, map]);

  if (positions.length < 2) {
    return null;
  }

  return (
    <>
      {/* Main trail line */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: color,
          weight: weight,
          opacity: 0.7,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      
      {/* Gradient effect - lighter line underneath */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: color,
          weight: weight + 2,
          opacity: 0.3,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </>
  );
}
