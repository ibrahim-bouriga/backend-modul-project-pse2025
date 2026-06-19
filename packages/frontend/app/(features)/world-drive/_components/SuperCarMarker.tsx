'use client';

import { useEffect, useRef, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GPSData } from './types';

interface SuperCarMarkerProps {
  position: [number, number];
  speed: number | null;
  heading: number | null;
  name: string;
  followMode: boolean;
}

// Create custom car icon with rotation
const createCarIcon = (heading: number | null) => {
  const rotation = heading ?? 0;
  
  return L.divIcon({
    className: 'custom-car-marker',
    html: `
      <div style="transform: rotate(${rotation}deg); transform-origin: center;">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Car body -->
          <ellipse cx="20" cy="20" rx="12" ry="18" fill="#ef4444" stroke="#dc2626" stroke-width="2"/>
          <!-- Windshield -->
          <ellipse cx="20" cy="15" rx="8" ry="6" fill="#93c5fd" stroke="#3b82f6" stroke-width="1"/>
          <!-- Headlights -->
          <circle cx="20" cy="8" r="2" fill="#fef08a"/>
          <!-- Shadow -->
          <ellipse cx="20" cy="32" rx="10" ry="3" fill="rgba(0,0,0,0.3)"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

export default function SuperCarMarker({
  position,
  speed,
  heading,
  name,
  followMode,
}: SuperCarMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number]>(position);
  const animationRef = useRef<number | null>(null);

  // Smooth animation between positions
  useEffect(() => {
    const [targetLat, targetLng] = position;
    const [currentLat, currentLng] = currentPosition;

    // Calculate distance
    const latDiff = targetLat - currentLat;
    const lngDiff = targetLng - currentLng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    // Only animate if distance is significant
    if (distance > 0.0001) {
      const duration = 1000; // 1 second animation
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const newLat = currentLat + latDiff * easeProgress;
        const newLng = currentLng + lngDiff * easeProgress;

        setCurrentPosition([newLat, newLng]);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setCurrentPosition(position);
        }
      };

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [position]);

  // Follow mode - center map on car
  useEffect(() => {
    if (followMode && markerRef.current) {
      map.setView(currentPosition, map.getZoom(), {
        animate: true,
        duration: 0.5,
      });
    }
  }, [currentPosition, followMode, map]);

  return (
    <Marker
      ref={markerRef}
      position={currentPosition}
      icon={createCarIcon(heading)}
    >
      <Popup>
        <div className="text-center">
          <h3 className="font-bold text-lg mb-2">{name}</h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-semibold">Speed:</span>{' '}
              {speed !== null ? `${speed.toFixed(1)} km/h` : 'N/A'}
            </p>
            <p>
              <span className="font-semibold">Heading:</span>{' '}
              {heading !== null ? `${heading.toFixed(0)}°` : 'N/A'}
            </p>
            <p>
              <span className="font-semibold">Position:</span>
              <br />
              {currentPosition[0].toFixed(6)}, {currentPosition[1].toFixed(6)}
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
